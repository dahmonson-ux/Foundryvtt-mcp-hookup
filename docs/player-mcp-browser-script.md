# Player MCP Browser Controller Script

This document is the reference setup for a **remote player** whose Foundry world is running elsewhere, but who has the game open and authenticated in their browser.

The goal is a shared-controller model:

```text
REMOTE FOUNDRY SERVER
        ^
        | normal Foundry connection
        |
PLAYER BROWSER
  Foundry client + bridge module
        ^
        | loopback only
        |
LOCAL MCP / PAWN RUNNER
        ^
        |
       AI
```

The AI does **not** need the player's Foundry password, browser cookie, session token, or a second public API.

The browser is already authenticated. The local MCP talks to a small Foundry module running in that browser session.

## What this script gives the AI

Keep the MCP surface small:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

The browser-side executor only accepts known game actions. It never accepts arbitrary JavaScript.

Initial supported character actions:

```text
combat.move
combat.attack
combat.cast_spell
combat.use_ability
combat.use_item
combat.speak
combat.wait
combat.end_turn
```

The wider repository already defines additional affordance types. Add them only after their Foundry-side handlers are implemented and tested.

---

# Part 1: browser-side Foundry module script

This code belongs in the client script of the Foundry module enabled in the world.

It is **not** intended to be pasted into the browser console every session.

The example targets Foundry VTT v14 and D&D 5e. Core actions use Foundry's public client API. D&D 5e item/activity execution is system-specific and should be tested against the installed D&D 5e version.

```js
const MODULE_ID = "foundry-ai-player-client";
const LOOPBACK_URL = "ws://127.0.0.1:3001";

let bridgeSocket = null;
let stateVersion = 1;

function bumpStateVersion() {
  stateVersion += 1;
}

// Invalidate old AI affordances whenever relevant Foundry state changes.
Hooks.on("updateActor", bumpStateVersion);
Hooks.on("updateToken", bumpStateVersion);
Hooks.on("updateCombat", bumpStateVersion);
Hooks.on("createCombat", bumpStateVersion);
Hooks.on("deleteCombat", bumpStateVersion);
Hooks.on("createChatMessage", bumpStateVersion);

function openLoopbackSocket() {
  // Chromium 154+ can explicitly mark a WebSocket as loopback.
  // Older browsers use the normal constructor as a fallback.
  try {
    return new WebSocket(LOOPBACK_URL, {
      targetAddressSpace: "loopback"
    });
  } catch {
    return new WebSocket(LOOPBACK_URL);
  }
}

async function requireOwnedActor(actorUuid) {
  const actor = await fromUuid(actorUuid);

  if (!actor || actor.documentName !== "Actor") {
    throw new Error("Configured AI Actor was not found.");
  }

  if (!actor.isOwner) {
    throw new Error("Current Foundry user does not control this Actor.");
  }

  return actor;
}

function findCanvasToken(actor) {
  const token = canvas.tokens?.placeables.find(
    (candidate) => candidate.actor?.uuid === actor.uuid
  );

  if (!token) {
    throw new Error("AI Actor has no token on the current scene.");
  }

  if (!token.document.isOwner) {
    throw new Error("Current Foundry user does not control this token.");
  }

  return token;
}

function visibleTargets(actor) {
  return (canvas.tokens?.placeables ?? [])
    .filter((token) =>
      token.visible &&
      token.actor &&
      token.actor.uuid !== actor.uuid
    )
    .map((token) => ({
      tokenId: token.id,
      tokenUuid: token.document.uuid,
      actorUuid: token.actor.uuid,
      name: token.name,
      x: token.document.x,
      y: token.document.y,
      elevation: token.document.elevation
    }));
}

function summarizeActor(actor) {
  const hp = actor.system?.attributes?.hp;
  const ac = actor.system?.attributes?.ac;
  const movement = actor.system?.attributes?.movement;

  return {
    uuid: actor.uuid,
    name: actor.name,
    type: actor.type,
    hp: hp
      ? {
          value: hp.value,
          max: hp.max,
          temp: hp.temp
        }
      : undefined,
    ac: ac?.value,
    movement,
    effects: actor.effects?.map((effect) => ({
      id: effect.id,
      name: effect.name,
      disabled: effect.disabled
    }))
  };
}

async function readFilteredState(actorUuid) {
  const actor = await requireOwnedActor(actorUuid);

  const ownedTokens = (canvas.tokens?.placeables ?? [])
    .filter((token) => token.actor?.uuid === actor.uuid && token.document.isOwner)
    .map((token) => ({
      id: token.id,
      uuid: token.document.uuid,
      sceneId: canvas.scene?.id,
      x: token.document.x,
      y: token.document.y,
      elevation: token.document.elevation
    }));

  const combatant = game.combat?.combatants?.find(
    (candidate) => candidate.actor?.uuid === actor.uuid
  );

  return {
    stateVersion,
    turnId: game.combat?.combatant?.id,
    mode: game.combat?.started ? "combat" : "world",
    data: {
      self: summarizeActor(actor),
      tokens: ownedTokens,
      visibleTargets: visibleTargets(actor),
      combat: game.combat
        ? {
            id: game.combat.id,
            round: game.combat.round,
            turn: game.combat.turn,
            currentCombatantId: game.combat.combatant?.id,
            actorCombatantId: combatant?.id,
            isActorTurn: Boolean(
              combatant && game.combat.combatant?.id === combatant.id
            )
          }
        : undefined
    }
  };
}

function actionId(parts) {
  return parts
    .map((part) => String(part ?? "none").replace(/[^a-zA-Z0-9_-]/g, "_"))
    .join(":");
}

async function listLegalActions(actorUuid, state) {
  const actor = await requireOwnedActor(actorUuid);
  const actions = [];

  const base = {
    contractVersion: 1,
    actorId: actorUuid,
    stateVersion: state.stateVersion,
    turnId: state.turnId,
    expiresAtStateVersion: state.stateVersion
  };

  // No-op is always safe.
  actions.push({
    ...base,
    actionId: actionId(["wait", state.stateVersion]),
    type: "combat.wait"
  });

  // End turn is only offered while this Actor owns the current combatant.
  const actorCombatant = game.combat?.combatants?.find(
    (candidate) => candidate.actor?.uuid === actor.uuid
  );

  if (
    game.combat?.started &&
    actorCombatant &&
    game.combat.combatant?.id === actorCombatant.id
  ) {
    actions.push({
      ...base,
      actionId: actionId(["end-turn", state.stateVersion]),
      type: "combat.end_turn"
    });
  }

  // Offer simple adjacent movement choices.
  // Foundry's TokenDocument.move() remains authoritative and may stop/prevent
  // movement that is illegal because of walls, terrain, or other constraints.
  try {
    const token = findCanvasToken(actor);
    const step = canvas.grid?.size ?? 100;

    const directions = [
      ["N", 0, -step],
      ["NE", step, -step],
      ["E", step, 0],
      ["SE", step, step],
      ["S", 0, step],
      ["SW", -step, step],
      ["W", -step, 0],
      ["NW", -step, -step]
    ];

    for (const [label, dx, dy] of directions) {
      actions.push({
        ...base,
        actionId: actionId(["move", label, state.stateVersion]),
        type: "combat.move",
        destination: {
          x: token.document.x + dx,
          y: token.document.y + dy
        },
        parameters: {
          direction: label
        }
      });
    }
  } catch {
    // No active token on this scene means no movement affordances.
  }

  // D&D 5e items and activities.
  for (const item of actor.items ?? []) {
    if (!item.isOwner) continue;

    const activities = item.system?.activities
      ? Array.from(item.system.activities.values())
      : [];

    const usableActivities = activities.filter(
      (activity) => activity.canUse !== false
    );

    // Use item-level execution when there are no explicit activities.
    if (!usableActivities.length && item.use) {
      const type =
        item.type === "weapon"
          ? "combat.attack"
          : item.type === "spell"
            ? "combat.cast_spell"
            : "combat.use_item";

      actions.push({
        ...base,
        actionId: actionId(["item", item.id, state.stateVersion]),
        type,
        itemId: item.id
      });

      continue;
    }

    for (const activity of usableActivities) {
      const type =
        item.type === "weapon"
          ? "combat.attack"
          : item.type === "spell"
            ? "combat.cast_spell"
            : "combat.use_ability";

      actions.push({
        ...base,
        actionId: actionId([
          "activity",
          item.id,
          activity.id,
          state.stateVersion
        ]),
        type,
        itemId: item.id,
        abilityId: activity.id
      });
    }
  }

  return actions;
}

async function setTarget(targetId) {
  if (!targetId) return;

  const target = canvas.tokens?.placeables.find(
    (token) =>
      token.id === targetId ||
      token.document.uuid === targetId ||
      token.actor?.uuid === targetId
  );

  if (!target || !target.visible) {
    throw new Error("Requested target is not visible.");
  }

  // Public Foundry Token API.
  target.setTarget(true, { releaseOthers: true });
}

async function resolveOwnedItem(actor, itemId) {
  if (!itemId) throw new Error("This action requires itemId.");

  let item = actor.items?.get(itemId);

  if (!item && itemId.includes(".")) {
    item = await fromUuid(itemId);
  }

  if (!item || item.documentName !== "Item") {
    throw new Error("Requested item was not found.");
  }

  if (item.actor?.uuid !== actor.uuid || !item.isOwner) {
    throw new Error("Requested item does not belong to the AI Actor.");
  }

  return item;
}

async function executeAction(actorUuid, action) {
  const actor = await requireOwnedActor(actorUuid);

  if (action.actorId !== actorUuid) {
    throw new Error("Action is scoped to a different Actor.");
  }

  switch (action.type) {
    case "combat.move": {
      const token = findCanvasToken(actor);
      const x = Number(action.destination?.x);
      const y = Number(action.destination?.y);

      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new Error("Move action requires numeric x and y.");
      }

      const completed = await token.document.move(
        { x, y },
        {
          showRuler: true,
          autoRotate: true
        }
      );

      if (!completed) {
        throw new Error("Foundry stopped or prevented the movement.");
      }

      return { status: "SUCCEEDED", stateVersionAfter: ++stateVersion };
    }

    case "combat.attack":
    case "combat.cast_spell":
    case "combat.use_ability":
    case "combat.use_item": {
      const item = await resolveOwnedItem(actor, action.itemId);

      if (action.targetId) {
        await setTarget(action.targetId);
      }

      const activity = action.abilityId
        ? item.system?.activities?.get(action.abilityId)
        : undefined;

      if (activity?.use) {
        await activity.use();
      } else if (item.use) {
        await item.use();
      } else {
        throw new Error("This item does not expose a supported use action.");
      }

      return { status: "SUCCEEDED", stateVersionAfter: ++stateVersion };
    }

    case "combat.speak": {
      const message = String(action.parameters?.message ?? "").trim();

      if (!message) {
        throw new Error("Speak action requires parameters.message.");
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: message
      });

      return { status: "SUCCEEDED", stateVersionAfter: ++stateVersion };
    }

    case "combat.wait":
      return { status: "SUCCEEDED", stateVersionAfter: stateVersion };

    case "combat.end_turn": {
      const combat = game.combat;

      if (!combat?.started) {
        throw new Error("There is no active combat.");
      }

      const combatant = combat.combatants.find(
        (candidate) => candidate.actor?.uuid === actor.uuid
      );

      if (!combatant || combat.combatant?.id !== combatant.id) {
        throw new Error("It is not this Actor's turn.");
      }

      // Foundry permissions remain authoritative. If this player's role/table
      // cannot advance combat, Foundry will reject the update.
      await combat.nextTurn();

      return { status: "SUCCEEDED", stateVersionAfter: ++stateVersion };
    }

    default:
      throw new Error(`Unsupported AI action type: ${action.type}`);
  }
}

const completedCommands = new Map();

async function reconcileAction(commandId) {
  return completedCommands.get(commandId) ?? {
    status: "UNKNOWN"
  };
}

async function handleBridgeRequest(request) {
  switch (request.operation) {
    case "read_filtered_state":
      return readFilteredState(request.actorId);

    case "list_legal_actions":
      return listLegalActions(request.actorId, request.state);

    case "execute_action": {
      const result = await executeAction(request.actorId, request.action);

      completedCommands.set(request.commandId, {
        status: result.status,
        stateVersionAfter: result.stateVersionAfter
      });

      return result;
    }

    case "reconcile_action":
      return reconcileAction(request.commandId);

    case "resolve_proposal":
      // Deliberately conservative for the first implementation.
      // Add proposal resolution only when each proposal type has a validated
      // Foundry-side resolver.
      return undefined;

    default:
      throw new Error(`Unknown bridge operation: ${request.operation}`);
  }
}

async function getSession() {
  return {
    sessionId: game.socket?.id ?? crypto.randomUUID(),
    foundryUserId: game.user.id,
    worldId: game.world.id,
    controllableActorIds: game.actors
      .filter((actor) => actor.isOwner)
      .map((actor) => actor.uuid)
  };
}

function connectBridge() {
  const socket = openLoopbackSocket();

  bridgeSocket = socket;

  socket.addEventListener("open", async () => {
    console.info(`[${MODULE_ID}] local AI bridge connected`);

    socket.send(JSON.stringify({
      kind: "browser_ready",
      session: await getSession()
    }));
  });

  socket.addEventListener("message", async (event) => {
    let message;

    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    try {
      let result;

      if (message.kind === "get_session") {
        result = await getSession();
      } else if (message.kind === "bridge_request") {
        result = await handleBridgeRequest(message.request);
      } else {
        throw new Error("Unknown local bridge message.");
      }

      socket.send(JSON.stringify({
        replyTo: message.id,
        ok: true,
        result
      }));
    } catch (error) {
      socket.send(JSON.stringify({
        replyTo: message.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  });

  socket.addEventListener("close", () => {
    bridgeSocket = null;
    setTimeout(connectBridge, 2000);
  });
}

Hooks.once("ready", connectBridge);
```

## Important browser-side rules

The browser module should always derive identity from the active Foundry client:

```js
game.user
```

Never accept a caller-supplied Foundry user ID as proof of identity.

For Actor control, verify:

```js
actor.isOwner
```

For token movement, use the Foundry v14 movement API:

```js
await token.document.move(...)
```

Do not replace movement with an unrestricted coordinate update that bypasses the normal movement workflow.

For D&D 5e item use, the current system exposes item/activity usage APIs. The handler above uses an activity's `use()` when an activity ID is available and falls back to `item.use()`.

---

# Part 2: local MCP/Pawn runner

The player's MCP process owns the loopback WebSocket server.

The browser-side module connects **outbound** to that local server.

Install the reference dependencies:

```powershell
npm install @modelcontextprotocol/server zod ws
npm install -D tsx @types/ws
```

Example `player-mcp.ts`:

```ts
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import { GatewayCore } from "@foundry-ai-gateway/gateway";
import { DefaultAffordanceResolver } from "@foundry-ai-gateway/affordances";
import { InMemoryActionLedger } from "@foundry-ai-gateway/ledger";
import { StaticIdentityProvider } from "@foundry-ai-gateway/adapter-mock";
import {
  FoundryGameAdapter,
  PlayerClientBridge,
  type PlayerClientRequest,
  type PlayerClientSession,
  type PlayerClientTransport
} from "@foundry-ai-gateway/adapter-foundry";

const ACTOR_ID = process.env.AI_ACTOR_UUID;
const AGENT_ID = process.env.AI_AGENT_ID ?? "player_pawn";
const HOST = process.env.PLAYER_CLIENT_BRIDGE_HOST ?? "127.0.0.1";
const PORT = Number(process.env.PLAYER_CLIENT_BRIDGE_PORT ?? "3001");

if (!ACTOR_ID) {
  throw new Error("AI_ACTOR_UUID is required.");
}

let browserSocket: WebSocket | undefined;

const pending = new Map<
  string,
  {
    resolve(value: unknown): void;
    reject(error: Error): void;
  }
>();

const wss = new WebSocketServer({
  host: HOST,
  port: PORT
});

wss.on("connection", (socket) => {
  // Only one active Foundry browser session owns this Pawn connection.
  browserSocket?.close();
  browserSocket = socket;

  socket.on("message", (raw) => {
    const message = JSON.parse(String(raw));

    if (!message.replyTo) return;

    const waiter = pending.get(message.replyTo);
    if (!waiter) return;

    pending.delete(message.replyTo);

    if (message.ok) waiter.resolve(message.result);
    else waiter.reject(new Error(message.error ?? "Browser bridge failed."));
  });

  socket.on("close", () => {
    if (browserSocket === socket) browserSocket = undefined;
  });
});

function browserRpc<T>(
  kind: "get_session" | "bridge_request",
  payload: object = {}
): Promise<T> {
  if (!browserSocket || browserSocket.readyState !== WebSocket.OPEN) {
    throw new Error(
      "Foundry browser is not connected to the local player bridge."
    );
  }

  const id = randomUUID();

  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: (value) => resolve(value as T),
      reject
    });

    browserSocket!.send(JSON.stringify({
      id,
      kind,
      ...payload
    }));

    setTimeout(() => {
      if (!pending.has(id)) return;

      pending.delete(id);
      reject(new Error("Timed out waiting for the Foundry browser."));
    }, 15000);
  });
}

class BrowserPlayerClientTransport implements PlayerClientTransport {
  getSession(): Promise<PlayerClientSession> {
    return browserRpc<PlayerClientSession>("get_session");
  }

  request<T>(request: PlayerClientRequest): Promise<T> {
    return browserRpc<T>("bridge_request", { request });
  }
}

const playerTransport = new BrowserPlayerClientTransport();

const bridge = new PlayerClientBridge(playerTransport, {
  actorId: ACTOR_ID
});

const identityProvider = new StaticIdentityProvider([
  {
    agentId: AGENT_ID,
    actorId: ACTOR_ID,
    policyVersion: 1,
    capabilities: [
      { capability: "combat.*", scope: "self" }
    ]
  }
]);

const gateway = new GatewayCore({
  identityProvider,
  adapter: new FoundryGameAdapter(bridge),
  resolver: new DefaultAffordanceResolver(),
  ledger: new InMemoryActionLedger()
});

function mcpResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

const server = new McpServer(
  {
    name: "foundry-player-pawn",
    version: "0.1.0"
  },
  {
    instructions: [
      "You control only the Actor assigned to this MCP server.",
      "Call get_available_actions before acting.",
      "Choose only an action_id returned by get_available_actions.",
      "Pass the matching state_version to execute_action.",
      "If execute_action reports STALE_STATE, call get_available_actions again.",
      "Do not invent Foundry IDs, item IDs, targets, destinations, or actions.",
      "Never request arbitrary JavaScript execution."
    ].join(" ")
  }
);

server.registerTool(
  "get_available_actions",
  {
    description:
      "Read the current character state and the exact legal actions this Pawn may take.",
    inputSchema: {
      state_version: z.number().int().optional()
    }
  },
  async ({ state_version }) => {
    return mcpResult(
      await gateway.getAvailableActions(AGENT_ID, state_version)
    );
  }
);

server.registerTool(
  "execute_action",
  {
    description:
      "Execute one action_id that was returned by get_available_actions for the same state version.",
    inputSchema: {
      action_id: z.string().min(1),
      state_version: z.number().int(),
      idempotency_key: z.string().min(1).optional()
    }
  },
  async ({ action_id, state_version, idempotency_key }) => {
    return mcpResult(
      await gateway.executeAction({
        agentId: AGENT_ID,
        actionId: action_id,
        stateVersion: state_version,
        idempotencyKey: idempotency_key ?? randomUUID()
      })
    );
  }
);

server.registerTool(
  "propose_action",
  {
    description:
      "Propose an action that is not already present in the current affordance list. The browser bridge may reject unsupported proposal types.",
    inputSchema: {
      type: z.string().min(1),
      state_version: z.number().int(),
      idempotency_key: z.string().min(1).optional(),
      parameters: z.record(z.string(), z.unknown()).optional()
    }
  },
  async ({ type, state_version, idempotency_key, parameters }) => {
    return mcpResult(
      await gateway.proposeAction(
        AGENT_ID,
        {
          type,
          parameters
        },
        state_version,
        idempotency_key ?? randomUUID()
      )
    );
  }
);

server.registerTool(
  "reconcile_action",
  {
    description:
      "Check the authoritative outcome of an action whose execution result was uncertain.",
    inputSchema: {
      command_id: z.string().min(1),
      idempotency_key: z.string().min(1)
    }
  },
  async ({ command_id, idempotency_key }) => {
    return mcpResult(
      await gateway.reconcileAction(command_id, idempotency_key)
    );
  }
);

console.error(
  `Foundry player MCP waiting for browser bridge on ws://${HOST}:${PORT}`
);

void serveStdio(() => server);
```

## Player environment

The player does not put Foundry credentials into the MCP configuration.

Use:

```env
AI_ACTOR_UUID=Actor.INSERT_PAWN_ACTOR_ID_HERE
AI_AGENT_ID=player_pawn

PLAYER_CLIENT_BRIDGE_HOST=127.0.0.1
PLAYER_CLIENT_BRIDGE_PORT=3001
```

Then start the MCP runner through the MCP host or directly for testing:

```powershell
npx tsx player-mcp.ts
```

## AI command rules

The AI should follow this sequence:

```text
1. get_available_actions

2. inspect:
   state
   stateVersion
   actions[]

3. choose exactly one returned action_id

4. execute_action(
     action_id,
     matching state_version
   )

5. read the result

6. call get_available_actions again after state changes
```

Example:

```text
get_available_actions
  -> combat.attack: Longsword
  -> combat.cast_spell: Healing Word
  -> combat.move: E
  -> combat.move: NE
  -> combat.wait
  -> combat.end_turn

AI chooses combat.attack action_id

execute_action(action_id, state_version)
```

The AI should not fabricate:

```text
token coordinates
weapon IDs
spell IDs
target IDs
Foundry document IDs
movement permissions
damage rolls
attack rolls
resource consumption
```

Foundry and the D&D 5e system remain responsible for those mechanics.

## Supported command handlers

The browser-side script above has concrete handlers for:

| Action | Browser behavior |
| --- | --- |
| `combat.move` | Uses Foundry v14 `TokenDocument.move()`. |
| `combat.attack` | Uses the owned D&D 5e item/activity. |
| `combat.cast_spell` | Uses the owned spell item/activity. |
| `combat.use_ability` | Uses the owned item's selected activity. |
| `combat.use_item` | Uses the owned item/activity. |
| `combat.speak` | Creates a Foundry chat message as the Actor. |
| `combat.wait` | Successful no-op. |
| `combat.end_turn` | Calls Foundry's combat turn advancement after verifying it is this Actor's turn. |

Every handler re-checks ownership in the live browser session before it acts.

## Actions to add later

The existing affordance taxonomy also includes actions such as:

```text
combat.dash
combat.disengage
combat.dodge
combat.help
combat.hide
combat.search
combat.ready
combat.interact
combat.unarmed
combat.grapple
combat.shove
combat.escape_grapple
combat.equip
combat.unequip
combat.whisper
```

Do not advertise one of these to the AI until there is a tested Foundry-side handler for it.

## Transport compatibility note

Loopback WebSocket access from a secure Foundry page depends on browser local-network rules.

Modern Chromium supports explicit local/loopback address-space handling. Other browser/version combinations may require a secure localhost transport or a browser-extension/native-messaging transport.

That changes only the `PlayerClientTransport` implementation. It does **not** change the gateway, Actor binding, action model, or browser-side permission checks.

## Security requirements

- Bind the local companion to `127.0.0.1`, never `0.0.0.0`.
- Never expose the local player bridge to the public internet.
- Never export the Foundry browser cookie/session token to the MCP runner.
- Reject Actor IDs the logged-in user does not own.
- Reject actions whose `actorId` does not equal `AI_ACTOR_UUID`.
- Reject unknown action types.
- Never expose `eval`, `Function`, arbitrary macros, or general JavaScript execution as an AI command.
- Treat stale action IDs as invalid after state changes.
- Keep Foundry and the game system authoritative for movement, rolls, damage, resources, and permissions.

## Version notes

This reference targets the current project assumptions:

```text
Foundry VTT: v14
Game system: dnd5e
```

The core Foundry v14 APIs used here include document ownership, Token targeting, Token movement, ChatMessage creation, and Combat turn advancement.

The D&D 5e portion relies on the system's item/activity `use()` workflow. Test this part whenever the installed D&D 5e system version changes.

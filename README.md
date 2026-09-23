# Foundry VTT AI Gateway

A provider-neutral gateway architecture for connecting AI-controlled characters and assistants to Foundry Virtual Tabletop while keeping Foundry authoritative for state, permissions, and mechanics.

The project separates these concerns:

- **Gateway**: identity, capability checks, stale-state validation, idempotency, and command lifecycle.
- **Affordance resolver**: generates the legal actions an agent may choose from for the current filtered state.
- **Foundry adapter**: isolates Foundry VTT and game-system-specific behavior.
- **Player Client Bridge**: lets a remote player's AI share that player's already-authenticated Foundry browser session.
- **Ledger**: records requests, decisions, results, reconciliation, and event metadata without storing private model reasoning.
- **Canonical reference policy**: grounds Assistant DM world mutations in approved campaign, Foundry, rules, module, asset, or explicit GM references.

Foundry remains the authoritative source of game state and mechanical legality. AI agents choose from the legal affordances made available to them.

## Core contract

The public gateway surface stays intentionally small:

```text
getAvailableActions(agent_id, state_version?)
executeAction(agent_id, action_id, state_version, idempotency_key)
proposeAction(agent_id, proposal, state_version, idempotency_key)
reconcileAction(command_id, idempotency_key)
```

MCP, REST, WebSocket, or other transports should adapt to those same operations rather than implement separate game logic.

## Deployment modes

### Solo / local

Use this when Foundry and the AI tooling are running on the same machine or trusted local environment.

```text
AI / Pawn
  -> local MCP / gateway
  -> FoundryGameAdapter
  -> local FoundryBridge
  -> Foundry VTT
```

### Remote player shared-controller

Use this when Foundry is remote but the human player is already connected to the game in a browser.

The player and AI share the same authenticated Foundry client session:

```text
REMOTE FOUNDRY SERVER
        ^
        | normal authenticated game connection
        |
PLAYER BROWSER
  Foundry client + player-side module
        ^
        | local-only companion channel
        |
LOCAL MCP / PAWN RUNNER
        ^
        |
       AI
```

The human continues controlling their PC normally. The AI is bound to a second Actor that the same Foundry user can control.

Example:

```text
Foundry user: Alice
  controls -> Actor.AlicePC
  controls -> Actor.AlicePawn

Human -> Actor.AlicePC
AI    -> Actor.AlicePawn
```

The local runner only needs:

```env
AI_ACTOR_UUID=Actor.AlicePawn
```

The browser-side module must verify that the currently logged-in Foundry user can actually control that Actor.

**No Foundry password, API key, cookie, or browser session token is copied into the local MCP/Pawn runner.**

See:

- [docs/deployment-modes.md](docs/deployment-modes.md)
- [docs/player-client-setup.md](docs/player-client-setup.md)
- [docs/player-client-bridge.md](docs/player-client-bridge.md)

## Why the Player Client Bridge exists

A remote player already has an authenticated connection to the remote Foundry server in their browser. The AI does not need a second internet-facing API path just to control that player's Pawn.

Instead:

```text
AI
  -> local MCP
  -> PlayerClientBridge
  -> player-side Foundry module
  -> existing authenticated browser session
  -> remote Foundry server
```

The bridge should attach to Foundry's client/module layer, not screen-scrape pixels or automate DOM clicks.

The Player Client Bridge implementation is:

```text
packages/adapters/foundry/src/player-client-bridge.ts
```

It implements the existing `FoundryBridge` interface, so the gateway above it does not need a separate remote-player contract.

## Browser-side bridge responsibilities

The player-side Foundry module must expose a narrow local operation set:

```text
read_filtered_state
list_legal_actions
execute_action
reconcile_action
resolve_proposal   # optional
```

For every request, it must verify:

- the Foundry browser session is still authenticated,
- the configured AI Actor is controllable by the current `game.user`,
- the action is scoped to that Actor,
- the action is still legal for the current state and turn.

Do not expose arbitrary JavaScript execution to the AI.

## Design principles

- Do not expose raw Foundry documents as the public AI API.
- Separate visibility from authorization.
- Treat action IDs as ephemeral and state-bound.
- Treat events as ordered projections, not truth.
- Never blindly retry an action with an unknown execution status.
- Keep strategic choice with the AI agent; the gateway enforces the legal action space.
- Keep rolls, damage, saves, conditions, resource consumption, and similar consequences out of the agent's strategic command set.
- Use stable public IDs and keep Foundry implementation details inside the adapter boundary.
- Do not record hidden chain-of-thought.
- Keep secrets, local paths, prompts, private player data, and browser session credentials out of source control.
- In remote-player mode, keep the local companion endpoint loopback-only.

## Repository layout

```text
docs/
  architecture.md
  action-affordances.md
  gateway-contract.md
  execution-lifecycle.md
  failure-matrix.md
  privacy-and-ledger.md
  canonical-reference-policy.md
  dm-affordances.md
  deployment-modes.md
  player-client-setup.md
  player-client-bridge.md
  transport-adapters.md

packages/
  contracts/
  gateway/
  affordances/
  adapters/
    foundry/
      src/
        player-client-bridge.ts
    mock/
  ledger/
```

## Current status

The repository currently provides:

- provider-neutral contracts,
- capability-aware affordance resolution,
- execution lifecycle and idempotency,
- canonical-reference checks,
- in-memory ledger,
- mock adapter and tests,
- Foundry adapter boundary,
- Player Client Bridge contract and Actor-scope checks.

Still to implement for the shared-controller remote-player path:

1. the actual player-side Foundry module,
2. a loopback `PlayerClientTransport`,
3. the local MCP/Pawn runner that uses that transport.

The repository does **not** yet contain a finished one-command remote-player runner.

## Development

Requirements:

- Node.js 20+
- npm 10+

Install:

```bash
npm install
```

Run tests:

```bash
npm test
```

Type-check:

```bash
npm run typecheck
```

Run both:

```bash
npm run check
```

The current test suite does not require a real Foundry connection.

## Configuration

Copy `.env.example` to `.env` only for values needed by your deployment.

### Solo/local mode

Relevant settings include:

```text
GATEWAY_HOST
GATEWAY_PORT
GATEWAY_LOG_LEVEL
GATEWAY_AUTH_SECRET
FOUNDRY_BASE_URL
FOUNDRY_BRIDGE_SECRET
```

### Remote-player shared-controller mode

The important player-specific setting is:

```text
AI_ACTOR_UUID
```

The local companion defaults are documented as:

```text
PLAYER_CLIENT_BRIDGE_HOST=127.0.0.1
PLAYER_CLIENT_BRIDGE_PORT=3001
```

Those companion settings describe the future local transport implementation. The current `PlayerClientBridge` code is transport-agnostic.

Do not place Foundry browser passwords, cookies, session tokens, or API keys in the remote-player bridge configuration.

See [docs/configuration-and-secrets.md](docs/configuration-and-secrets.md).

## Minimum shared-controller wiring

The same gateway can use a browser-session bridge:

```ts
import { GatewayCore } from "@foundry-ai-gateway/gateway";
import { DefaultAffordanceResolver } from "@foundry-ai-gateway/affordances";
import { InMemoryActionLedger } from "@foundry-ai-gateway/ledger";
import { StaticIdentityProvider } from "@foundry-ai-gateway/adapter-mock";
import {
  FoundryGameAdapter,
  PlayerClientBridge,
  type PlayerClientTransport
} from "@foundry-ai-gateway/adapter-foundry";

const actorId = "Actor.AlicePawn";

const identityProvider = new StaticIdentityProvider([{
  agentId: "pawn_alice",
  actorId,
  policyVersion: 1,
  capabilities: [{ capability: "combat.*", scope: "self" }]
}]);

export function buildPlayerGateway(transport: PlayerClientTransport) {
  const bridge = new PlayerClientBridge(transport, { actorId });

  return new GatewayCore({
    identityProvider,
    resolver: new DefaultAffordanceResolver(),
    ledger: new InMemoryActionLedger(),
    adapter: new FoundryGameAdapter(bridge)
  });
}
```

The missing piece in that example is the real local transport connected to the player-side Foundry module.

## First remote-player vertical slice

Test one player and one Pawn first:

```text
combat.move
combat.attack
combat.wait
combat.end_turn
```

Then add the remaining combat/world actions.

Do not begin with Assistant DM world mutations. Canonical reference rules still apply to `dm.*` actions.

## Security

Do not expose the player-client bridge to the public internet.

For remote-player mode:

- keep the companion channel on loopback,
- keep browser authentication inside the Foundry browser session,
- verify Actor control on every operation,
- invalidate stale actions when state changes,
- do not expose arbitrary JavaScript execution,
- do not copy browser session credentials into the AI process.

See [SECURITY.md](SECURITY.md).

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

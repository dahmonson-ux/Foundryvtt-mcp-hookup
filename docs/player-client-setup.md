# Player Client Setup

This guide is for a remote human player who is connected to a Foundry world in a browser and wants an AI/Pawn to share that same player session.

Foundry itself is **not** running on the player's computer.

## The model

The player and AI share one authenticated Foundry client:

```text
REMOTE FOUNDRY SERVER
        ^
        | normal game connection
        |
PLAYER'S BROWSER
  Foundry client + player-side module
        ^
        | local-only companion channel
        |
LOCAL MCP / PAWN RUNNER
        ^
        |
       AI
```

The browser owns the authenticated Foundry session.

The MCP/Pawn runner does not need the player's Foundry password, API key, cookie, or session token.

## What the GM sets up

For each player:

1. Create/configure the normal Foundry user.
2. Give that user control of the player's human PC Actor.
3. Give the same user control of the player's Pawn Actor.
4. Enable the player-side bridge module in the world.

Example:

```text
Foundry user: Alice

controls:
  Actor.AlicePC
  Actor.AlicePawn
```

## What the player sets up

The player needs:

- their normal Foundry game URL and login,
- the local MCP/Pawn runner,
- the UUID of the Actor the AI should control.

The only player-specific configuration needed by the bridge is:

```env
AI_ACTOR_UUID=Actor.AlicePawn
```

The local companion should bind only to loopback:

```env
PLAYER_CLIENT_BRIDGE_HOST=127.0.0.1
PLAYER_CLIENT_BRIDGE_PORT=3001
```

No remote-player Foundry API credential belongs in this configuration.

## How the "shared controller" works

The human continues using the browser normally:

```text
mouse / keyboard
  -> Foundry browser client
  -> Actor.AlicePC
```

The AI uses the local companion path:

```text
AI
  -> local MCP
  -> PlayerClientBridge
  -> player-side Foundry module
  -> same Foundry browser client
  -> Actor.AlicePawn
```

Both paths terminate in the same authenticated player session.

## What the player-side module must verify

Before returning state or executing an action, the browser-side module must check:

1. `game.user` is authenticated.
2. `AI_ACTOR_UUID` resolves to a real Actor.
3. the current `game.user` can control that Actor.
4. the request is scoped to that Actor.
5. the action is still legal in the current state/turn.

Selecting an Actor UUID does not grant control over it.

## Do not screen scrape

The bridge should attach to the Foundry client/module layer, not to pixels or DOM clicks.

Use Foundry client APIs for:

- reading the current user-visible state,
- checking Actor ownership/control,
- listing legal actions,
- executing game-system actions,
- reconciling results.

The goal is to share the authenticated client session, not automate the visible UI.

## Local MCP / shell

The player still needs a local process that exposes the MCP tools to their AI unless that functionality is later packaged into an app.

For the first implementation, PowerShell can start the local runner:

```text
PowerShell
  -> starts Node MCP/Pawn runner
  -> runner listens only on localhost
  -> browser-side module pairs to it locally
```

PowerShell is just the launcher. It is not exposed to the internet and the remote Foundry server does not connect to PowerShell.

Later the runner can be packaged as:

- a desktop application,
- a tray application,
- a Windows service,
- or another local background process.

## Gateway operations

The local AI still sees the same small gateway surface:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

The bridge maps those to the browser-side module operations:

```text
read_filtered_state
list_legal_actions
execute_action
reconcile_action
resolve_proposal
```

## First test

Start with one player and one Pawn.

Limit the Pawn to:

```text
combat.move
combat.attack
combat.wait
combat.end_turn
```

Test order:

1. Player logs into the remote Foundry world normally.
2. Player-side module confirms it is active.
3. Player starts the local MCP/Pawn runner.
4. Module and runner establish the local companion connection.
5. Runner selects `AI_ACTOR_UUID`.
6. Module confirms the logged-in user can control that Actor.
7. AI requests available actions.
8. AI selects one action.
9. Foundry executes it through the existing browser session.
10. Repeat after the new state is read.

## Current repository status

The repository now contains the shared-controller bridge contract:

```text
packages/adapters/foundry/src/player-client-bridge.ts
```

The actual browser-side Foundry module transport and local MCP runner transport are the next implementation pieces.

Do not add a public relay/API-key path just to support remote players. Their existing browser session is the remote Foundry connection.

See also:

- [deployment-modes.md](deployment-modes.md)
- [player-client-bridge.md](player-client-bridge.md)
- [player-mcp-browser-script.md](player-mcp-browser-script.md)
- [configuration-and-secrets.md](configuration-and-secrets.md)

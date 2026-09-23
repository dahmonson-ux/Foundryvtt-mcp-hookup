# Deployment Modes

This project has two intended deployment modes. They share the same gateway and affordance rules, but the connection to Foundry is different.

## 1. Solo / local AI

Use this when Foundry and the AI tooling are running on the same machine or trusted local environment.

```text
AI / Pawn
  -> local MCP / gateway
  -> FoundryGameAdapter
  -> local FoundryBridge
  -> Foundry VTT
```

No player browser bridge is needed.

## 2. Remote player shared-controller mode

Use this when Foundry is running remotely but the human player is connected to that game in a browser on another computer.

The player and AI share the **same authenticated Foundry client session**:

```text
REMOTE FOUNDRY SERVER
        ^
        | normal authenticated Foundry connection
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

The player-side Foundry module runs inside the already-authenticated browser client. It does not copy the player's password, API key, cookie, or session token into the MCP process.

The local MCP/Pawn runner only asks the browser-side module to perform the gateway operations for the configured AI Actor.

## Shared-controller Actor model

A single Foundry user may control both a human PC and a Pawn.

```text
Foundry user: Player One
  controls -> Actor.PlayerOnePC
  controls -> Actor.PlayerOnePawn
```

The local AI configuration selects:

```text
AI_ACTOR_UUID=Actor.PlayerOnePawn
```

Human input continues to control the PC through the normal Foundry UI.

AI input is restricted to the configured Pawn Actor.

```text
             same Foundry browser session
                     |
             +-------+-------+
             |               |
         human input       AI input
             |               |
        PlayerOnePC     PlayerOnePawn
```

The Actor setting does not grant permission. The browser-side module must verify that the current Foundry user can actually control the configured Actor.

## Why this is preferred for remote players

This avoids building a second internet-facing control plane.

Remote players do not need:

- Foundry installed locally
- a second Foundry login
- a second public MCP server
- a separate Foundry REST relay
- a copied browser session cookie
- a copied Foundry API key

They need:

- normal access to the Foundry game URL
- the player-side Foundry module enabled
- a local MCP/Pawn runner
- the Actor UUID assigned to the AI

## Code path in this repository

The shared-controller bridge is:

```text
packages/adapters/foundry/src/player-client-bridge.ts
```

It provides:

- `PlayerClientBridge`
- `PlayerClientTransport`
- `PlayerClientSession`
- `loadPlayerClientBridgeConfig()`

The bridge implements the existing `FoundryBridge` interface so `GatewayCore` and `FoundryGameAdapter` do not need a separate remote-player contract.

## Browser-side responsibility

The player-side Foundry module must expose the following operations to the local companion channel:

```text
read_filtered_state
list_legal_actions
execute_action
reconcile_action
resolve_proposal   (optional)
```

For every request it must verify:

1. the browser still has an authenticated Foundry session,
2. the configured AI Actor is controllable by `game.user`,
3. the requested action is scoped to that Actor,
4. Foundry/game-system legality still allows the action.

The browser module is part of the authenticated Foundry client. It should use Foundry's client APIs rather than screen scraping or DOM clicking.

## Local companion channel

The browser-side module and local MCP/Pawn runner communicate only on the player's computer.

The transport is intentionally abstracted behind `PlayerClientTransport`. It can later be implemented with a localhost WebSocket or another local IPC mechanism that works reliably with the target browser.

The endpoint must stay loopback-only.

```text
127.0.0.1 only
```

Do not expose the player-client bridge to the public internet.

## Shared action policy

Local and remote-player modes use the same action model:

```text
AI chooses strategy
  -> offered action
  -> gateway/policy validation
  -> Foundry re-checks legality
  -> Foundry executes mechanics
```

For the first remote-player vertical slice, keep the Pawn to:

```text
combat.move
combat.attack
combat.wait
combat.end_turn
```

Do not begin with Assistant DM world mutations.

## Implementation order

1. Keep mock-adapter tests passing.
2. Implement the player-side Foundry module.
3. Implement a loopback `PlayerClientTransport`.
4. Pair one browser session with one local MCP/Pawn runner.
5. Verify the configured Pawn Actor is controllable by the logged-in Foundry user.
6. Test the four-operation bridge with a disposable world.
7. Test one Pawn with move, attack, wait, and end turn.
8. Add remaining actions.
9. Keep solo/local AI on the existing local bridge path.

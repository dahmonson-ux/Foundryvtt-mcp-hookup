# Player Client Bridge

The Player Client Bridge is the remote-player implementation of the existing `FoundryBridge` boundary.

It is designed for this case:

- Foundry runs on a remote server.
- The human player is already connected in a browser.
- The player controls both a human PC Actor and an AI/Pawn Actor.
- A local MCP/Pawn runner on the player's computer gives the AI access to the Pawn.
- The AI must share the player's authenticated Foundry client rather than creating a second internet-facing control path.

## Boundary

```text
AI
 |
local MCP / Pawn runner
 |
PlayerClientBridge
 |
PlayerClientTransport
 |
local-only companion channel
 |
player-side Foundry module
 |
authenticated Foundry browser session
 |
remote Foundry server
```

## Authentication

Authentication stays in the Foundry browser session.

The local MCP/Pawn runner must not require:

- Foundry password
- browser cookie
- session token
- player REST API key
- GM credential

The browser-side module identifies the current Foundry user through the Foundry client itself.

## Actor binding

The local runner is configured with:

```text
AI_ACTOR_UUID
```

For player-client mode, the gateway `AgentIdentity.actorId` should use that same Actor identifier.

Before any bridge operation, `PlayerClientBridge` checks:

1. the gateway identity is assigned to the configured Actor,
2. the current browser session reports that Actor as controllable.

The browser-side module must still perform its own authoritative permission check before execution.

## Session description

`PlayerClientTransport.getSession()` returns:

```ts
interface PlayerClientSession {
  sessionId: string;
  foundryUserId: string;
  worldId: string;
  controllableActorIds: string[];
}
```

This is capability metadata, not an exported browser credential.

## Request protocol

The local transport carries only the operations the bridge needs.

### Read filtered state

```text
read_filtered_state(actorId)
```

Return only state visible to the logged-in user and relevant to the configured Actor.

### List legal actions

```text
list_legal_actions(actorId, state)
```

Return legal Foundry/game-system actions for the current Actor and state.

### Execute action

```text
execute_action(actorId, action, commandId, idempotencyKey)
```

The browser-side module must re-check:

- Actor scope,
- ownership/control,
- state version,
- current turn,
- game-system legality.

### Reconcile action

```text
reconcile_action(actorId, commandId, idempotencyKey)
```

Used when the local runner cannot tell whether an operation completed.

### Resolve proposal

```text
resolve_proposal(actorId, proposal, state)
```

Optional.

## Transport

`PlayerClientTransport` intentionally does not choose a specific local IPC technology.

The first implementation may use a localhost WebSocket or another browser-compatible local transport.

Requirements:

- loopback only,
- no public listener,
- no browser session credentials copied into the runner,
- explicit pairing between the current browser client and local runner,
- reconnectable session semantics,
- bounded message schema,
- no arbitrary JavaScript execution channel.

## Browser-side module

The Foundry module should operate through Foundry client APIs, not screen automation.

It should provide adapters for:

- filtered state reads,
- legal action generation,
- execution,
- reconciliation,
- Actor permission checks.

The AI should never receive a general "run arbitrary JavaScript in the player's browser" capability.

## Human + AI concurrency

Human and AI input may coexist because they can target different Actors within the same Foundry user session.

Example:

```text
Human -> Actor.PlayerPC
AI    -> Actor.PlayerPawn
```

If the human manually takes over the Pawn, the module/runner should invalidate stale AI affordances and require a fresh state read before another AI action.

## Relationship to GatewayCore

No new public gateway contract is needed.

`PlayerClientBridge` implements the existing `FoundryBridge` interface, so the stack remains:

```text
GatewayCore
  -> FoundryGameAdapter
  -> PlayerClientBridge
  -> authenticated player browser
```

This keeps local/solo and remote-player modes aligned above the Foundry bridge boundary.

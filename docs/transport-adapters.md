# Transport Adapters

The project does not commit to a production remote-player transport until the Phase 1 connection spike.

Transport is an implementation detail beneath the Pawn Functional Contract.

## Rule

Transport code should be thin.

```text
AI / MCP / client
      ↓
GatewayCore
      ↓
FoundryGameAdapter
      ↓
chosen connection implementation
      ↓
Foundry
```

Do not put game strategy or a second legality engine into transport code.

## MCP

A model-facing MCP adapter should expose a small stable surface such as:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

The AI receives structured state/actions and chooses an action ID.

Do not create one MCP tool per weapon, spell, or item.

## REST / RPC / WebSocket

A connection implementation may use REST, RPC, WebSocket, a Foundry module, or another mechanism when appropriate.

Regardless of technology, it must preserve:

- Actor binding,
- player-level permissions,
- visible-state filtering,
- action freshness,
- execution results,
- uncertain-outcome reconciliation.

## Phase 1 connection spike

Evaluate candidate transports using:

### Simplicity

- How many components must the player run?
- How much configuration is required?
- Does it reuse access the player already has?

### Reliability

- Can it reconnect cleanly?
- Can it detect stale state?
- Can it distinguish failed vs unknown execution?
- Does it preserve player permissions?

### Role-playing quality

- Can it receive conversation/state updates promptly?
- Is latency low enough for natural table interaction?
- Can it provide the context needed for a Pawn to feel present?

The winning transport is the one that best serves the product, not the most elaborate architecture.

# Architecture

## Permanent boundary

```text
AI / human clients
        |
 REST / MCP / WebSocket adapters
        |
        v
+-----------------------------+
| Gateway                     |
| identity                    |
| capabilities                |
| visibility                  |
| stale-state validation      |
| idempotency                 |
| lifecycle / reconciliation  |
+-------------+---------------+
              |
              v
+-----------------------------+
| Affordance resolver         |
| legal choices for this      |
| actor, state, and turn      |
+-------------+---------------+
              |
              v
+-----------------------------+
| Foundry adapter             |
| Foundry + game-system       |
| implementation details      |
+-------------+---------------+
              |
              v
          Foundry VTT
       authoritative truth

Ledger observes the lifecycle and records accountability data.
```

The gateway owns the public contract. The adapter owns Foundry weirdness. The ledger owns accountability. Foundry owns truth.

## Canonical grounding for Assistant DM

Assistant DM world mutations must be grounded in canonical references. Read-only inspection and planning may proceed without references, but executable `dm.*` mutations are filtered out unless trusted resolver/reference code attaches at least one canonical source.

Canonical grounding and authorization are separate checks: a referenced action can still be denied by capability policy.

See [canonical-reference-policy.md](canonical-reference-policy.md) and [dm-affordances.md](dm-affordances.md).

## Query flow

1. Authenticate the caller at the transport boundary.
2. Resolve the agent identity to an actor and capability policy.
3. Read current authoritative state from Foundry.
4. Filter the state to what that agent is allowed to know.
5. Ask the affordance resolver for currently legal choices.
6. Return state-bound, ephemeral action affordances.

## Execution flow

1. Agent selects an offered `action_id`.
2. Gateway verifies identity, scope, visibility, state version, turn, expiry, and idempotency.
3. Adapter re-checks authoritative legality immediately before execution.
4. Foundry executes mechanics.
5. Gateway returns `SUCCEEDED`, `REJECTED`, `FAILED`, or `UNKNOWN`.
6. Unknown outcomes are reconciled before any retry.
7. Result events and ledger records are emitted.
8. If state changed, previous affordances expire and must be refreshed.

## Strategic autonomy

The resolver defines the legal move set. The agent owns the choice.

The gateway must not silently replace a selected action with a strategically preferred action. Ordinary autonomous play should not require human approval unless table policy says it does.

## Visibility is not authorization

Visibility controls what the agent may know.

Authorization controls what the agent may attempt.

An agent seeing another token does not imply permission to modify it. Rejection messages must also avoid leaking hidden information.

## Events are projections

Events are ordered notifications, not authoritative truth. Each event should include:

- stable event ID
- aggregate ID
- sequence number
- state version
- causation ID
- correlation ID
- event type
- payload safe for the receiving agent

On sequence gaps, clients request a snapshot or resume instead of guessing.

## Stable IDs

Public contracts use gateway-owned stable IDs for:

- agents
- actors
- tokens/entities
- turns
- snapshots
- commands
- idempotency keys
- results
- events
- ledger records

Foundry document IDs remain adapter metadata.

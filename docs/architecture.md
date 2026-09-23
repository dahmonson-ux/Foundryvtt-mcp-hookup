# Architecture

## Permanent gateway boundary

Above the Foundry bridge, local/solo and remote-player modes use the same gateway model.

```text
AI / human clients
        |
 REST / MCP / other thin adapters
        |
        v
+-----------------------------+
| GatewayCore                 |
| identity                    |
| capabilities                |
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
| FoundryGameAdapter          |
+-------------+---------------+
              |
              v
        FoundryBridge
```

The bridge implementation changes by deployment mode.

## Solo / local bridge

When Foundry and the AI tooling are in the same local environment:

```text
FoundryBridge
   |
local module/API/MCP integration
   |
Foundry VTT
```

## Remote-player shared-controller bridge

When Foundry is remote but a human player is already logged into the game in a browser:

```text
FoundryBridge
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

The browser session is the remote Foundry connection.

The local MCP/Pawn runner does not receive the player's Foundry password, cookie, API key, or browser session token.

## Shared-controller model

A single Foundry user may control both the human PC and AI Pawn:

```text
same Foundry user/session
        |
   +----+----+
   |         |
 human       AI
   |         |
 PC Actor  Pawn Actor
```

The AI is bound to one configured Actor.

The browser-side module must verify the current Foundry user can control that Actor before returning state or executing any action.

## Player Client Bridge contract

`PlayerClientBridge` implements the existing `FoundryBridge` interface.

That preserves the same four gateway-level operations:

```text
getAvailableActions
executeAction
proposeAction
reconcileAction
```

The browser-side companion protocol is narrower:

```text
read_filtered_state
list_legal_actions
execute_action
reconcile_action
resolve_proposal
```

The bridge does not provide arbitrary JavaScript execution.

## Query flow

### Local/solo

1. Authenticate the caller at the local transport boundary.
2. Resolve the agent identity to an Actor and capability policy.
3. Read authoritative state through the local Foundry bridge.
4. Filter state.
5. Resolve legal affordances.
6. Return state-bound actions.

### Remote player

1. Local MCP resolves the AI identity to the configured Pawn Actor.
2. `PlayerClientBridge` checks that identity matches the configured Actor.
3. The player-side Foundry module checks that the current `game.user` can control that Actor.
4. The module reads only state visible to the authenticated player.
5. Legal actions are derived for that Actor and current state.
6. Gateway returns state-bound actions to the AI.

## Execution flow

1. Agent selects an offered `action_id`.
2. Gateway verifies identity, Actor scope, state version, turn, expiry, capability, and idempotency.
3. The Foundry bridge re-checks authoritative legality.
4. In remote-player mode, the browser-side module re-checks current user control of the configured Actor.
5. Foundry executes the mechanics.
6. Gateway returns `SUCCEEDED`, `REJECTED`, `FAILED`, or `UNKNOWN`.
7. Unknown outcomes are reconciled before retry.
8. State changes expire prior affordances.

## Human and AI concurrency

Human and AI input may coexist when they operate different Actors.

If the human manually changes or operates the Pawn Actor, that state change must invalidate stale AI affordances.

The AI must request fresh state before acting again.

## Canonical grounding for Assistant DM

Assistant DM world mutations must be grounded in canonical references. Read-only inspection and planning may proceed without references, but executable `dm.*` mutations are filtered out unless trusted resolver/reference code attaches at least one canonical source.

Canonical grounding and authorization are separate checks: a referenced action can still be denied by capability policy.

See [canonical-reference-policy.md](canonical-reference-policy.md) and [dm-affordances.md](dm-affordances.md).

## Strategic autonomy

The resolver defines the legal move set. The agent owns the choice.

The gateway must not silently replace a selected action with a strategically preferred action.

## Visibility is not authorization

Visibility controls what the agent may know.

Authorization controls what the agent may attempt.

An agent seeing another token does not imply permission to modify it. Rejection messages must avoid leaking hidden information.

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

Public contracts use stable IDs for:

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

Foundry-specific document details remain inside the adapter/bridge boundary.

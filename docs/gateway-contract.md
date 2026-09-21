# Gateway Contract

The public gateway stays small and provider-neutral. Gameplay actions are data returned by the affordance resolver, not individual public endpoints.

## Operations

```ts
getAvailableActions(agentId, stateVersion?)
executeAction(agentId, actionId, stateVersion, idempotencyKey)
proposeAction(agentId, proposal, stateVersion, idempotencyKey)
reconcileAction(commandId, idempotencyKey)
```

Transport adapters may expose these over REST, MCP, WebSocket RPC, or another protocol, but they must call the same core implementation.

## getAvailableActions

Returns a filtered snapshot plus ephemeral action affordances valid for a specific state version.

Example:

```json
{
  "state_version": 733,
  "turn_id": "turn_204",
  "actions": [
    {
      "action_id": "act_01",
      "contract_version": 1,
      "type": "combat.attack",
      "actor_id": "actor_pawn",
      "target_id": "entity_hostile_7",
      "ability_id": "ability_longsword",
      "costs": { "action": 1 },
      "state_version": 733,
      "expires_at_state_version": 733,
      "approval": { "required": false }
    }
  ]
}
```

## executeAction

Executes only an action previously offered to this agent for the supplied state version.

Validation includes:

- authenticated agent identity
- actor ownership/scope
- capability policy
- visibility constraints
- state version
- turn identity when applicable
- action expiry
- idempotency key
- authoritative legality at execution time

The gateway does not choose a replacement action.

## proposeAction

Used for actions that cannot be represented by a currently offered affordance or that enter an approval/policy path.

Typical uses:

- improvised actions
- open-ended world tasks
- table-policy approval
- a client that only supports structured command mode

A proposal must resolve against the same underlying legality engine used by affordance generation. It must not create a second game-rules implementation.

## reconcileAction

Used when execution status is `UNKNOWN` or a client reconnects without a reliable final result.

Reconciliation uses:

- command ID
- idempotency key
- ledger evidence
- adapter execution receipt when available
- authoritative state observation

Never blindly replay a non-idempotent action to resolve uncertainty.

## Transport authentication

The four operations are core game operations, not an authentication protocol. REST/MCP/WebSocket adapters must authenticate callers before invoking them and must not trust a caller-supplied agent ID by itself.

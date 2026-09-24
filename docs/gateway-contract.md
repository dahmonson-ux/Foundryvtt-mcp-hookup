# Gateway Contract

The gateway is a small reliability and scope boundary around a Pawn's legitimate game actions.

It is not the role-playing engine. The AI and Character Profile determine how the character chooses among legitimate options.

## Operations

```ts
getAvailableActions(agentId, stateVersion?)
executeAction(agentId, actionId, stateVersion, idempotencyKey)
proposeAction(agentId, proposal, stateVersion, idempotencyKey)
reconcileAction(commandId, idempotencyKey)
```

A transport may expose these through MCP, REST, RPC, or another protocol.

## getAvailableActions

Returns:

- current visible state,
- optional role-playing context,
- current state version,
- legitimate ephemeral actions.

Action IDs are state-bound.

## executeAction

Executes only an action previously offered to this agent.

Validation includes:

- resolved agent identity,
- Actor scope,
- capability policy,
- state version,
- turn identity when applicable,
- action expiry,
- idempotency,
- authoritative legality at execution time.

The gateway does not silently replace the AI's chosen action with another strategy.

## proposeAction

Used when the AI wants to attempt something not represented by a current affordance.

Typical examples:

- improvised action,
- open-ended supported world task,
- table-policy approval path.

A proposal must resolve through the same Foundry/game-system authority. It does not create a second rules engine.

## reconcileAction

Used when execution may have happened but the caller did not receive a definitive result.

Never blindly repeat a consequential action to resolve uncertainty.

## Role-playing context

`VisibleState.roleplay` may carry:

- Character Profile,
- assigned player Actor,
- current player instruction,
- relevant conversation context,
- compact memory summary.

This context informs AI choice. The gateway does not interpret personality or decide dialogue/tactics.

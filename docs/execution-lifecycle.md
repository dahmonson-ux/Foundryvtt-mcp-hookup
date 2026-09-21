# Execution Lifecycle

Commands have a lifecycle rather than a single boolean outcome.

```text
PROPOSED
   |
AUTHORIZED
   |
VALIDATED
   |
EXECUTING
   +--> SUCCEEDED
   +--> REJECTED
   +--> FAILED
   +--> UNKNOWN
```

## States

### PROPOSED

The client selected or proposed an action against an observed state version.

### AUTHORIZED

Identity, capability, scope, and policy checks passed.

### VALIDATED

Turn, visibility, resource, target, range, expiry, and state/version checks passed.

### EXECUTING

The request was handed to the Foundry adapter.

### SUCCEEDED

Authoritative execution completed and a result is known.

### REJECTED

The command was intentionally not executed because a rule, scope, stale-state, approval, or policy check failed.

### FAILED

Execution is known not to have completed successfully.

### UNKNOWN

The gateway cannot safely determine whether Foundry executed the action.

A transport timeout after submission is not proof of failure.

## Unknown execution

Example:

1. Agent submits an attack with idempotency key `idem_01`.
2. Gateway hands it to Foundry.
3. Foundry performs the attack.
4. Connection disappears before confirmation.
5. Gateway records `UNKNOWN`.
6. A retry with `idem_01` does not perform another attack.
7. Gateway reconciles the original command and returns the original result when it can be established.

## Idempotency

Idempotency is command-type aware.

- Repeating a resolved attack, roll, spell, item use, or resource-consuming action returns the original result.
- Movement may be coalesced only when the adapter can prove doing so is safe.
- Duplicate suppression must be observable in the ledger.
- Reuse of an idempotency key for a materially different request is rejected.

## Staleness

Action IDs are ephemeral and state-bound. If a human, another agent, or Foundry changes relevant state, old affordances expire.

The correct response is to return a stale-state result and refresh affordances, not to reinterpret the old request against the new state.

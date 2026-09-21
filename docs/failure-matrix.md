# Failure Matrix

The first vertical slice is not complete until these behaviors are executable tests.

| Scenario | Expected behavior |
|---|---|
| Disconnect after `turn.started` | Client resumes from sequence or requests snapshot |
| Missed event | Sequence gap detected; no guessing from partial history |
| Human changes state before AI acts | Old affordance rejected as stale |
| Same idempotency key retried | Original result returned; no duplicate action |
| Same key reused for different action | Request rejected |
| Human and AI act concurrently | Authoritative state/version determines winner; stale command rejected |
| Foundry timeout before submission | Known failure; safe retry policy applies |
| Foundry timeout after submission | Mark `UNKNOWN`; reconcile before retry |
| Hidden target guessed by client | Generic invalid/unauthorized response without hidden detail |
| Agent attempts another actor's action | Scope rejection |
| Expired action ID | Stale/expired response and refreshed affordances |
| Reaction trigger disappears | Reaction affordance expires |
| Client reconnects with old sequence | Resume if retained; otherwise snapshot |
| Ledger storage unavailable | Execution policy explicitly decides fail-open vs fail-closed; never silently lose accountability |
| Adapter returns malformed result | Gateway fails safely and records adapter error |

## Required first vertical slice

```text
authenticate
 -> resolve identity/capabilities
 -> filtered snapshot
 -> turn event
 -> disconnect/reconnect
 -> refresh state
 -> choose legal affordance
 -> validate
 -> execute
 -> result or UNKNOWN
 -> reconcile
 -> event
 -> ledger
 -> refresh affordances
```

Initial implemented affordances:

- `combat.move`
- `combat.attack`
- `combat.cast_spell`
- `combat.use_ability`
- `combat.speak`
- `combat.wait`
- `combat.end_turn`

# Failure Matrix

Reliability is a product requirement.

| Scenario | Expected behavior |
|---|---|
| Human/world changes state before AI acts | Old action rejected as stale; AI refreshes |
| Same idempotency key retried | Original result returned; no duplicate action |
| Same key reused for different request | Reject |
| AI attempts another Actor's action | Reject scope |
| Expired action ID | Reject and refresh |
| Connection drops before submission | Known failure; safe retry allowed |
| Connection drops after possible execution | Mark UNKNOWN; reconcile before retry |
| Target/action disappears | Reject stale/invalid action; refresh |
| Actor/token temporarily unavailable | Fail clearly; no guessed substitute |
| Permission changes | Reject and refresh identity/capabilities |
| Human manually changes Pawn | Pending stale AI action must not override it |
| Rapid conversation updates | Preserve order or refresh context |
| Duplicate command arrives | Suppress duplicate execution |
| Adapter returns malformed result | Fail safely and record adapter error |
| Ledger unavailable | Follow explicit deployment policy; do not silently claim accountability |
| Character Profile missing | Pawn mechanics still work; role-playing context is reduced, not invented |

## First vertical slice reliability

The first playable slice should prove:

```text
resolve identity
→ read visible state
→ offer legal actions
→ choose
→ validate freshness/scope
→ execute
→ receive result or UNKNOWN
→ reconcile if needed
→ refresh state/actions
```

Test this flow before adding broad action coverage.

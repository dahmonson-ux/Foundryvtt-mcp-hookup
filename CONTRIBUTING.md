# Contributing

Contributions are welcome.

## Product rule

Every change should make the system simpler, more reliable, or improve the role-playing experience.

The project is building an AI player/Pawn first. Avoid expanding into Assistant DM/world-authoring work until the Pawn vertical slice is complete.

## Boundaries

1. The Pawn Functional Contract defines capabilities and context, not personality.
2. Character Profile data informs AI choices without scripting them.
3. Foundry remains authoritative for permissions and mechanics.
4. The AI should choose from legitimate current actions.
5. State-bound actions must fail safely when stale.
6. Transport-specific details belong below the Foundry adapter boundary.
7. Do not expose arbitrary JavaScript as a normal Pawn command.

## Development

```bash
npm install
npm run check
```

Add tests for behavior changes, particularly:

- Actor scope,
- stale actions,
- duplicate suppression,
- reconnect/UNKNOWN reconciliation,
- permission failures,
- conversation ordering/context,
- player/world changes while the AI is planning.

## Examples and privacy

Use synthetic identities and paths.

Do not commit:

- player-identifying data,
- credentials/tokens,
- session cookies,
- private campaign exports,
- absolute local paths,
- private prompts/chat logs,
- secrets or tunnel credentials.

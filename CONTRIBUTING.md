# Contributing

Contributions are welcome.

## Principles

Changes should preserve these architectural boundaries:

1. The gateway owns the public game contract and policy enforcement.
2. The affordance resolver describes currently available choices.
3. The adapter owns Foundry and game-system-specific behavior.
4. The ledger owns accountability and reconciliation records.
5. Foundry remains authoritative for game state and mechanical execution.

Do not expand the public gateway with one endpoint per game action. Add new gameplay choices as affordance types and resolver behavior.

## Development

```bash
npm install
npm run check
```

Please add tests for behavior changes, especially around visibility, staleness, duplicate suppression, reconnects, unknown execution outcomes, and hidden-information handling.

## Privacy

Use synthetic IDs and relative paths in examples and tests. Do not commit:

- personal names or player-identifying details unless intentionally public
- machine usernames
- absolute filesystem paths
- local IP addresses beyond documentation examples
- credentials, tokens, tunnel URLs, or secrets
- private prompts or chat logs
- exported Foundry world data unless it is explicitly licensed and intended for publication

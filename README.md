# Foundry VTT AI Gateway

A provider-neutral gateway architecture for connecting AI-controlled characters and assistants to Foundry Virtual Tabletop through a small, capability-scoped public contract.

The project separates four concerns:

- **Gateway**: public contract, identity, capability checks, visibility, stale-state validation, idempotency, and command lifecycle.
- **Affordance resolver**: generates the legal actions an agent may choose from for the current filtered state.
- **Foundry adapter**: contains Foundry VTT and game-system-specific behavior.
- **Ledger**: records requests, decisions, results, reconciliation, and event metadata without requiring private model reasoning.
- **Canonical reference policy**: prevents Assistant DM world mutations from executing unless they are grounded in approved campaign, Foundry, rules, module, asset, or explicit GM references.

Foundry remains the authoritative source of game state and mechanical legality. AI agents choose autonomously from the legal affordances made available to them.

## Core contract

The public surface is intentionally small:

```text
getAvailableActions(agent_id, state_version?)
executeAction(agent_id, action_id, state_version, idempotency_key)
proposeAction(agent_id, proposal, state_version, idempotency_key)
reconcileAction(command_id, idempotency_key)
```

REST, MCP, WebSocket, or other transports should adapt to these same core operations rather than implement separate game logic.

## Design principles

- Do not expose raw Foundry documents as the public API.
- Separate visibility from authorization.
- Treat action IDs as ephemeral and state-bound.
- Treat events as ordered projections, not truth.
- Never blindly retry an action with an unknown execution status.
- Keep strategic choice with the AI agent; the gateway enforces the lawful action space.
- Keep rolls, damage, saves, conditions, resource consumption, and similar consequences out of the agent's strategic command set.
- Use stable public IDs and keep Foundry document IDs inside the adapter.
- Do not record hidden chain-of-thought. Structured rationale is optional client-supplied metadata only.
- Keep secrets, local paths, prompts, and private player data out of source control.

## Repository layout

```text
docs/
  architecture.md
  action-affordances.md
  gateway-contract.md
  execution-lifecycle.md
  failure-matrix.md
  privacy-and-ledger.md
  canonical-reference-policy.md
  dm-affordances.md

packages/
  contracts/
  gateway/
  affordances/
  adapters/
    foundry/
    mock/
  ledger/
```

## Status

The repository currently provides the contract, resolver taxonomy, execution lifecycle, reference TypeScript implementation, a mock adapter, and tests for the first vertical slice. The Foundry adapter is intentionally isolated so Foundry-specific execution can evolve without changing the public gateway contract.

## Development

Requirements:

- Node.js 20+
- npm 10+

Install and run tests:

```bash
npm install
npm test
```

Type-check the workspace:

```bash
npm run typecheck
```

No machine-specific absolute paths are required. Configuration should be supplied through environment variables or relative paths.

## Security

Do not expose a development gateway directly to the public internet. Bind locally by default, authenticate every request, use per-agent credentials, and use a secure authenticated tunnel or reverse proxy for remote access.

See [SECURITY.md](SECURITY.md), [docs/privacy-and-ledger.md](docs/privacy-and-ledger.md), and [docs/configuration-and-secrets.md](docs/configuration-and-secrets.md).

All security-sensitive or machine-specific values in the repository are placeholders. Real passwords, API keys, tokens, tunnel credentials, private addresses, and local paths belong in your local environment or secret manager, never in source control.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

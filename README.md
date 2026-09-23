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

## Configure it for your setup

This repository intentionally does **not** contain a user's Foundry address, credentials, machine paths, agent keys, tunnel information, or private campaign data. Those values must be supplied locally.

The current repository is also a **gateway core/reference implementation**, not a complete one-command Foundry server. Filling in the environment variables is only the configuration step. A real deployment must also provide a Foundry bridge and a transport such as MCP, REST, or WebSocket.

### 1. Create your local environment file

Copy `.env.example` to a local `.env` file.

macOS/Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Replace the `INSERT_...` placeholders that apply to your setup.

| Setting | Where to set it | Required? | What you provide |
| --- | --- | --- | --- |
| `GATEWAY_AUTH_SECRET` | local `.env` | **Yes** | A long random secret used by the gateway for authentication/signing. |
| `GATEWAY_HOST` | local `.env` | No | Bind address. Defaults to `127.0.0.1`. |
| `GATEWAY_PORT` | local `.env` | No | Gateway port. Defaults to `3001`. |
| `GATEWAY_LOG_LEVEL` | local `.env` | No | Logging level. Defaults to `info`. |
| `FOUNDRY_BASE_URL` | local `.env` | Needed for a real Foundry connection | The URL your bridge uses to reach your Foundry instance, for example your local/LAN Foundry URL. |
| `FOUNDRY_BRIDGE_SECRET` | local `.env` | Only if your bridge requires it | Shared secret/token expected by your Foundry-side bridge or module. |
| `AGENT_X_API_KEY`, `AGENT_Y_API_KEY`, etc. | local `.env` or secret manager | Only if your transport uses per-agent keys | Unique credentials for each AI agent. Rename/add entries to match your actual agents. The reference gateway config does not consume these automatically; your transport/auth layer must wire them in. |
| `REMOTE_GATEWAY_URL` | local `.env` | Only for remote access | Public/tunnel/reverse-proxy URL used by your client. |
| `REMOTE_GATEWAY_TOKEN` | local `.env` | Only for remote access | Credential required by that remote-access layer, if any. |

Do **not** commit the real `.env` file.

The reference loader in `packages/gateway/src/config.ts` reads values from `process.env`. This repository does not currently include a standalone launcher that automatically loads `.env`, so your eventual server/transport process must load those variables itself, for example through its process manager, container configuration, secret manager, or an environment-file-aware Node launcher.

### 2. Implement the bridge to your Foundry installation

The Foundry-facing seam is:

```text
packages/adapters/foundry/src/types.ts
```

Your integration must provide a concrete implementation of the `FoundryBridge` interface and connect it to the Foundry module/API mechanism you choose.

It must implement:

```text
readFilteredState(...)
listLegalActions(...)
executeAction(...)
reconcileAction(...)
```

It may also implement:

```text
resolveProposal(...)
```

The provided `FoundryGameAdapter` in `packages/adapters/foundry/src/state-reader.ts` delegates to that bridge. In other words, this is where your setup-specific Foundry communication is plugged in. Keep Foundry document IDs, world-specific details, module-specific calls, and private paths inside this adapter/bridge boundary rather than putting them in the public gateway contract.

### 3. Add the transport your AI client will call

The repository defines the gateway operations, but it does not currently ship a standalone MCP/REST/WebSocket server entry point.

Wire your chosen transport to the same four gateway operations:

```text
getAvailableActions
executeAction
proposeAction
reconcileAction
```

For MCP, the recommended public tools are:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

See `docs/transport-adapters.md` for the mapping rules.

Your AI client's MCP/API configuration should then point to **your running transport**, using the host/port or remote URL you assigned above. Do not point the model directly at raw Foundry documents or expose a separate tool for every spell, attack, or world action.

### 4. Define your agents and permissions

Your deployment must decide which authenticated identity corresponds to each AI-controlled player, Pawn, Assistant DM, or other agent, and which capabilities that identity receives.

Per-agent API keys are transport-specific. If you use them, create unique credentials locally and map each credential to one verified identity before calling the gateway core. Do not trust an `agent_id` supplied only in an unverified request body.

For Assistant DM world-building actions, also follow `docs/canonical-reference-policy.md` and `docs/dm-affordances.md`. World mutations are expected to carry approved references rather than inventing ungrounded campaign facts.

### 5. Verify before connecting a live world

Run:

```bash
npm run check
```

That runs the TypeScript check and test suite.

A practical integration order is:

```text
mock adapter
  -> local transport
  -> real Foundry bridge
  -> authenticated AI client
  -> remote/tunnel access only if needed
```

This keeps setup-specific failures separate and makes it easier to determine whether a problem is in the gateway core, transport, authentication, or Foundry bridge.

For more detail, see [docs/configuration-and-secrets.md](docs/configuration-and-secrets.md), [docs/transport-adapters.md](docs/transport-adapters.md), and [docs/architecture.md](docs/architecture.md).

## Security

Do not expose a development gateway directly to the public internet. Bind locally by default, authenticate every request, use per-agent credentials, and use a secure authenticated tunnel or reverse proxy for remote access.

See [SECURITY.md](SECURITY.md), [docs/privacy-and-ledger.md](docs/privacy-and-ledger.md), and [docs/configuration-and-secrets.md](docs/configuration-and-secrets.md).

All security-sensitive or machine-specific values in the repository are placeholders. Real passwords, API keys, tokens, tunnel credentials, private addresses, and local paths belong in your local environment or secret manager, never in source control.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

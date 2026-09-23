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

This is **not yet a complete Foundry + MCP install**. There is no standalone MCP/REST/WebSocket server process, no automatic `.env` loader, and no concrete `FoundryBridge` implementation that opens a connection to a running world.

## Deployment modes

There are now two intended deployment paths:

### Solo / local

If you are running Foundry and the AI tooling yourself on the same computer or trusted local environment, keep everything local:

```text
AI / Pawn
  -> local gateway / existing local scripts
  -> FoundryGameAdapter
  -> local FoundryBridge
  -> Foundry VTT
```

You do **not** need the remote player relay, a player-scoped relay API key, or a public MCP tunnel for this mode.

### Remote player + AI Pawn

The internet relay path is only needed for a player running their Pawn/AI from another computer.

Give that player's Foundry user control of both their human PC Actor and their Pawn Actor. The player's AI integration then uses a **separate player-scoped API key** through the existing Foundry REST relay and selects which owned Actor is the Pawn:

```text
Remote player's AI
  -> existing player/Pawn scripts
  -> PlayerRelayClient
  -> player-scoped relay API key
  -> existing Foundry REST relay
  -> Foundry user permissions
  -> selected Pawn Actor
```

The Actor selection does not create permission. Foundry's existing user/Actor ownership remains authoritative.

See [docs/deployment-modes.md](docs/deployment-modes.md) for the architecture and [docs/remote-player-setup.md](docs/remote-player-setup.md) for the player-facing setup guide.

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

The current test suite does not require any `.env` values.

No machine-specific absolute paths are required. Configuration should be supplied through environment variables or relative paths.

## Configure it for your setup

This repository intentionally does **not** contain a user's Foundry address, credentials, machine paths, agent keys, tunnel information, or private campaign data.

`.env.example` now separates **local/solo gateway values** from **remote-player relay values**.

For local/solo use, copying `.env.example` to `.env` still does **not** change runtime behavior by itself because nothing in this repository currently starts a server or automatically loads `.env`.

For remote-player use, the reusable client helper reads `FOUNDRY_RELAY_URL`, `FOUNDRY_RELAY_API_KEY`, and `AI_ACTOR_UUID` when the existing player/Pawn scripts call `loadPlayerRelayConfig()`.

### What is required at each stage

| Stage | Required configuration |
| --- | --- |
| Run the current tests | Nothing in `.env` |
| Solo/local AI on the Foundry host | Existing local Foundry/MCP/bridge path; no player relay key required |
| Write/start your own gateway server | `GATEWAY_AUTH_SECRET` plus whatever host/port settings your server uses |
| Connect a local Foundry bridge | `FOUNDRY_BASE_URL` plus whatever credentials that bridge actually requires |
| Remote player + AI Pawn | `FOUNDRY_RELAY_URL`, a player-scoped `FOUNDRY_RELAY_API_KEY`, and `AI_ACTOR_UUID` |
| Use a shared-secret local Foundry module/bridge | `FOUNDRY_BRIDGE_SECRET`, only if your implementation uses one |
| Authenticate agents on a custom transport | Transport-owned credentials such as the `AGENT_*_API_KEY` examples |
| Expose your own custom gateway remotely | `REMOTE_GATEWAY_URL` / `REMOTE_GATEWAY_TOKEN`, only if you deliberately use that path |

The `AGENT_*_API_KEY` values are examples in `.env.example`; they are **not read by `loadGatewayConfig()`**. Your transport/authentication layer owns those credentials and must map an authenticated credential to an `IdentityProvider` result before the request reaches `GatewayCore`.

For the remote-player relay path, use a separate integration key scoped to that player's Foundry user and world. The remote client deliberately does not send `userId` or `clientId` overrides.

### 1. Create a local environment template

Copy `.env.example` to a local `.env` file if you want a local place to track the values your future server will need.

macOS/Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Replace only the placeholders that apply to your deployment.

| Setting | Current owner | When it matters | What you provide |
| --- | --- | --- | --- |
| `GATEWAY_AUTH_SECRET` | gateway/server | Once you write a server | A long random secret used for gateway authentication/signing. |
| `GATEWAY_HOST` | gateway/server | Once you write a server | Bind address. Defaults to `127.0.0.1`. |
| `GATEWAY_PORT` | gateway/server | Once you write a server | Gateway port. Defaults to `3001`. |
| `GATEWAY_LOG_LEVEL` | gateway/server | Once you write a server | Logging level. Defaults to `info`. |
| `FOUNDRY_BASE_URL` | your Foundry bridge | Once you connect Foundry | The URL your bridge uses to reach the running Foundry instance. |
| `FOUNDRY_BRIDGE_SECRET` | your Foundry bridge | Only if your bridge uses a shared secret | The credential expected by your Foundry-side module/client. |
| `AGENT_X_API_KEY`, `AGENT_Y_API_KEY`, etc. | your transport/auth layer | Only if you use per-agent keys | Unique credentials mapped to verified agent identities. |
| `REMOTE_GATEWAY_URL` | remote-access layer | Only for remote access | Public/tunnel/reverse-proxy URL used by the client. |
| `REMOTE_GATEWAY_TOKEN` | remote-access layer | Only for remote access | Credential required by that remote-access layer, if any. |

Do **not** commit the real `.env` file.

The reference loader in `packages/gateway/src/config.ts` reads from `process.env`. This repository does not currently include a launcher or `dotenv` bootstrap. Your eventual server process must inject/load those variables itself through its process manager, container configuration, secret manager, shell environment, or an environment-file-aware Node launcher.

### 2. Implement the Foundry bridge

The interface is defined in:

```text
packages/adapters/foundry/src/types.ts
```

Your setup must provide a concrete `FoundryBridge` implementation with exactly these required methods:

```text
readFilteredState(...)
listLegalActions(...)
executeAction(...)
reconcileAction(...)
```

`resolveProposal(...)` is optional.

Wrap your implementation with:

```text
packages/adapters/foundry/src/state-reader.ts
FoundryGameAdapter
```

The important missing runtime piece is still a Foundry-side module or authenticated client that actually performs those bridge calls against a running world.

**Setting `FOUNDRY_BASE_URL` and `FOUNDRY_BRIDGE_SECRET` does not create that connection.** Those values only become meaningful after your bridge implementation consumes them.

Keep Foundry document IDs, world-specific details, module-specific calls, and private paths inside this bridge/adapter boundary rather than exposing them through the public gateway contract.

### 3. Wire authentication to identities

`GatewayCore` receives an `IdentityProvider` through its dependencies.

The reference/mock implementation is:

```text
packages/adapters/mock/src/index.ts
StaticIdentityProvider
```

That is useful for tests and local wiring examples. A real MCP/REST/WebSocket transport should authenticate its credential first, then resolve that caller to the correct `AgentIdentity` and capabilities before invoking the gateway. Do not treat an unverified request-body `agent_id` as proof of identity.

### Remote-player helper

For players connecting from another computer, the repository now includes:

```text
packages/adapters/foundry/src/player-relay-client.ts
```

It provides `PlayerRelayClient` and `loadPlayerRelayConfig()` for existing player/Pawn scripts. The helper attaches the player's scoped API key, keeps the Pawn bound to `AI_ACTOR_UUID`, and leaves Foundry permissions authoritative.

This helper is intentionally small. It does not create a second public MCP server and it does not replace the existing player scripts.

The current `main` branch does **not** contain the older player/Pawn runner scripts themselves. Those should be recovered/imported and wired to this helper rather than rewritten.

### 4. Hook your transport to GatewayCore

The core implementation is:

```text
packages/gateway/src/gateway.ts
GatewayCore
```

Your MCP, REST, or WebSocket process should call the same four operations:

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

See `docs/transport-adapters.md` for mapping rules.

Your AI client's configuration should point to **your running transport**, not directly to raw Foundry documents.

### Minimum wiring example

The constructors already in this repository are enough to show the seam between the mock path and a real Foundry bridge:

```ts
import { GatewayCore } from "@foundry-ai-gateway/gateway";
import { DefaultAffordanceResolver } from "@foundry-ai-gateway/affordances";
import { InMemoryActionLedger } from "@foundry-ai-gateway/ledger";
import {
  MockGameAdapter,
  StaticIdentityProvider
} from "@foundry-ai-gateway/adapter-mock";
import {
  FoundryGameAdapter,
  type FoundryBridge
} from "@foundry-ai-gateway/adapter-foundry";

const identityProvider = new StaticIdentityProvider([{
  agentId: "pawn_1",
  actorId: "actor_pawn",
  policyVersion: 1,
  capabilities: [{ capability: "combat.*", scope: "self" }]
}]);

const common = {
  identityProvider,
  resolver: new DefaultAffordanceResolver(),
  ledger: new InMemoryActionLedger()
};

export const mockGateway = new GatewayCore({
  ...common,
  adapter: new MockGameAdapter({ actorId: "actor_pawn" })
});

export function buildFoundryGateway(bridge: FoundryBridge) {
  return new GatewayCore({
    ...common,
    adapter: new FoundryGameAdapter(bridge)
  });
}
```

The second constructor does not create the bridge. Your code must still supply the concrete `FoundryBridge` that talks to the running Foundry world.

### 5. Verify in this order

Use the mock path first, then narrow the live surface:

1. Run `npm test` against the mock adapter.
2. Recover/import the existing player/Pawn scripts.
3. For remote players, wire those scripts to `PlayerRelayClient` and a disposable/test world.
4. Test one remote Pawn with only `move`, `attack`, `wait`, and `end_turn`.
5. Connect a real remote player.
6. Keep solo/local AI on the local bridge/MCP path.
7. Connect a live campaign last.

Do not begin integration testing with Assistant DM world mutations. The canonical reference policy intentionally rejects ungrounded `dm.*` writes even when the bridge itself is functioning.

For Assistant DM behavior, see `docs/canonical-reference-policy.md` and `docs/dm-affordances.md`.

For more detail, see [docs/configuration-and-secrets.md](docs/configuration-and-secrets.md), [docs/transport-adapters.md](docs/transport-adapters.md), and [docs/architecture.md](docs/architecture.md).

## Security

Do not expose a development gateway directly to the public internet. Bind locally by default, authenticate every request, use per-agent credentials, and use a secure authenticated tunnel or reverse proxy for remote access.

See [SECURITY.md](SECURITY.md), [docs/privacy-and-ledger.md](docs/privacy-and-ledger.md), and [docs/configuration-and-secrets.md](docs/configuration-and-secrets.md).

All security-sensitive or machine-specific values in the repository are placeholders. Real passwords, API keys, tokens, tunnel credentials, private addresses, and local paths belong in your local environment or secret manager, never in source control.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

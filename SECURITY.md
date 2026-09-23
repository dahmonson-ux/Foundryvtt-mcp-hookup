# Security Policy

## Scope

This project is a capability boundary between AI clients and Foundry VTT. Treat it as security-sensitive infrastructure.

## Shared-controller security model

For remote players, the preferred architecture shares the player's already-authenticated Foundry browser session rather than copying that authentication into the AI process.

```text
AI
  -> local MCP/Pawn runner
  -> loopback PlayerClientTransport
  -> player-side Foundry module
  -> authenticated Foundry browser session
```

The local runner must not receive:

- Foundry passwords
- browser cookies
- session tokens
- GM credentials
- player REST API keys solely for the purpose of sharing the browser session

## Safe defaults

- Bind local companion services to loopback only.
- Never expose the Player Client Bridge directly to the public internet.
- Pair the current browser client and local runner explicitly.
- Generate temporary pairing material at runtime when needed.
- Do not reuse browser authentication as local pairing material.
- Bind the AI to one configured Actor.
- Verify the current Foundry user can control that Actor on every bridge operation.
- Re-check Actor scope before execution.
- Reject stale, expired, duplicated, or out-of-scope actions.
- Reconcile unknown execution outcomes before any retry.
- Invalidate stale AI affordances when the human or Foundry changes the Pawn state.
- Filter state before it reaches the AI.
- Keep visibility checks separate from authorization checks.
- Do not expose arbitrary JavaScript execution to the AI.
- Keep Foundry implementation details inside the adapter/bridge boundary.
- Do not store API keys, passwords, session data, absolute local paths, private prompts, or private player information in the repository.

## Browser-side module

The browser-side module is trusted to operate within the permissions of the currently authenticated Foundry user.

It must:

- derive the user from the active Foundry client rather than an AI-supplied identifier,
- verify `AI_ACTOR_UUID` is controllable by that user,
- reject requests for other Actors,
- re-check current game-system legality before execution,
- avoid leaking GM-only or otherwise hidden state,
- expose only the bounded bridge operations.

## Custom public transports

If a deployment deliberately exposes a separate public REST/MCP/WebSocket gateway, that transport must use normal remote-service protections such as authentication and TLS.

That is separate from the preferred remote-player shared-controller architecture.

## Ledger sensitivity

The action ledger can contain gameplay state, hidden-state decisions, secret rolls, user identifiers, and optional structured rationale.

Deployments should define retention, redaction, export, and access controls before enabling persistent storage.

Private chain-of-thought should not be requested or stored. Record only visible client requests, optional structured rationale supplied by the client, gateway decisions, authoritative results, and the state/version metadata needed for accountability.

## Reporting vulnerabilities

Use the repository's private security reporting feature when available. Do not include secrets or unrelated personal information in public issues.

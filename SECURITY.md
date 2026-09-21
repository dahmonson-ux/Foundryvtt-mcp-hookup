# Security Policy

## Scope

This project is a capability boundary between AI clients and a Foundry VTT instance. Treat it as security-sensitive infrastructure.

## Safe defaults

- Bind development services to loopback by default.
- Authenticate every remote request.
- Use separate credentials per agent.
- Rotate and revoke credentials independently.
- Do not expose the gateway directly to the public internet.
- Use TLS through an authenticated reverse proxy or secure tunnel for remote access.
- Filter state before it reaches an agent.
- Keep visibility checks separate from authorization checks.
- Reject stale, expired, duplicated, or out-of-scope actions.
- Reconcile unknown execution outcomes before any retry.
- Keep Foundry document IDs and implementation details inside the adapter.
- Do not store API keys, passwords, tunnel credentials, absolute local paths, private prompts, or private player information in the repository.

## Ledger sensitivity

The action ledger can contain gameplay state, hidden-state decisions, secret rolls, user identifiers, and optional structured rationale. Deployments should define retention, redaction, export, and access controls before enabling persistent storage.

Private chain-of-thought should not be requested or stored. Record only visible client requests, optional structured rationale supplied by the client, gateway decisions, authoritative results, and the state/version metadata needed for accountability.

## Reporting vulnerabilities

Use the repository's private security reporting feature when available. Do not include secrets or unrelated personal information in public issues.

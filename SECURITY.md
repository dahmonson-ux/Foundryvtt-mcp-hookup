# Security Policy

## Scope

Humans and AI Pawns are separate Foundry players.

The security model relies on both Foundry permissions and the AI gateway's expected identity/Actor binding.

## Access separation

```text
Human account → Human Actor
AI account    → Pawn Actor
```

The human and AI should not share:

- Foundry credentials,
- login/session,
- Actor ownership,
- command channels.

## Core rules

- Give each AI Pawn a dedicated AI Foundry user.
- Bind the AI agent to the expected Pawn Actor.
- Verify Actor scope before execution.
- Let Foundry permissions remain authoritative.
- Filter state before it reaches the AI.
- Reject stale, expired, duplicated, or out-of-scope actions.
- Reconcile uncertain execution before retrying consequential actions.
- Do not expose arbitrary JavaScript/eval as a normal Pawn capability.
- Do not give the Pawn GM/world-authoring authority in Version 1.
- Keep Cloudflare, human-account, AI-account, and gateway credentials out of source control.

## Required negative tests

At minimum:

```text
AI User A → Human Actor A → denied
AI User A → Pawn B       → denied unless explicitly granted
```

If a human account is not intentionally granted control of the Pawn, the human route should likewise not gain that authority by accident.

## Cloudflare MCP route

The AI route must protect:

- AI-player identity,
- Cloudflare authentication material,
- Foundry authentication/session material,
- Pawn Actor scope,
- reconnect/session state,
- command/result integrity.

The MCP route should not broaden the AI user's Foundry permissions.

## Human route

The human/player access path is independent of the AI gateway.

The AI service should not require or store human login credentials merely to accompany the human character.

## Role-playing data

Character Profiles and campaign memory may contain private player-created material.

Deployments should define:

- storage location,
- readers/access control,
- retention/export behavior,
- memory persistence.

## Ledger

The ledger may store visible commands, Actor IDs, action types, state versions, results, and reconciliation/error metadata.

Do not request or store private chain-of-thought.

## Reporting vulnerabilities

Use GitHub's private security reporting feature when available. Do not include live credentials in reports.

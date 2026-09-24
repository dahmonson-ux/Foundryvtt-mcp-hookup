# Security Policy

## Scope

This project gives an AI the ability to act as one player-controlled character in Foundry VTT. Treat the Actor/action boundary as security-sensitive.

## Core rules

- Bind the AI to one explicit Pawn Actor.
- Verify Actor scope before execution.
- Let Foundry/player permissions remain authoritative.
- Filter state before it reaches the AI.
- Reject stale, expired, duplicated, or out-of-scope actions.
- Reconcile uncertain execution before retrying consequential actions.
- Do not expose arbitrary JavaScript/eval as a normal Pawn capability.
- Do not give the Pawn GM/world-authoring authority in Version 1.
- Keep transport credentials and session data out of source control.

## Transport

The production transport is not fixed yet.

Any candidate connection must protect:

- player identity,
- Foundry credentials/session data,
- Actor scope,
- local/private endpoints,
- reconnect state.

Do not choose a transport merely because it is convenient if it expands the AI's authority beyond the Pawn contract.

## Role-playing data

Character Profiles and campaign memory can contain player-created private material.

Deployments should define:

- where profile data is stored,
- who can read it,
- retention/export behavior,
- whether campaign memory is persisted.

## Ledger

The ledger may store:

- visible commands,
- Actor IDs,
- action types,
- state versions,
- execution results,
- error/reconciliation metadata.

Do not request or store private chain-of-thought.

## Reporting vulnerabilities

Use GitHub's private security reporting feature when available. Do not include unrelated personal information or live credentials in reports.

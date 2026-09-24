# Privacy and Ledger Design

The ledger exists to support reliability and accountability, not to capture private model reasoning.

## Record

A ledger entry may include:

- command ID,
- agent/Actor stable IDs,
- state/turn versions,
- selected action,
- authorization result,
- execution status,
- adapter result identifiers,
- consequence summaries,
- reconciliation outcome,
- timestamps/correlation IDs,
- optional short structured rationale supplied by the client.

## Do not record by default

- hidden chain-of-thought,
- raw secrets/API keys,
- passwords/session tokens,
- complete prompts when a smaller record is sufficient,
- full Character Profiles unless explicitly required,
- private campaign memory unrelated to debugging the command,
- unrelated personal information.

## Character data

Character Profiles and campaign memory may contain private player-authored content.

Keep them logically separate from the action ledger.

The ledger may record a profile/version identifier when useful without duplicating the complete profile.

## Hidden information

Player-visible exports must not leak GM-only or otherwise hidden state through error text or audit metadata.

## Reliability

The ledger should make these events visible:

- duplicate suppression,
- stale rejection,
- unknown execution,
- reconciliation,
- adapter failures.

## Retention

Persistent deployments should define:

- retention duration,
- access control,
- export/redaction rules,
- expiration/deletion,
- backup handling.

## Source control

Use synthetic identifiers and examples. Deployment credentials, private profiles, campaign exports, and machine-specific paths belong outside source control.

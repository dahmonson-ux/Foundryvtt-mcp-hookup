# Privacy and Ledger Design

The ledger is valuable precisely because it can become sensitive. Treat it as security-sensitive data.

## Record

A ledger entry may include:

- ledger record ID
- command ID
- event IDs
- agent and actor stable IDs
- state and turn versions
- selected action or visible proposal
- optional structured rationale supplied by the client
- capability/policy version
- authorization and validation outcomes
- execution status
- adapter result identifiers
- consequence summaries
- reconciliation outcome
- timestamps and correlation/causation IDs

## Do not record by default

- private chain-of-thought
- raw secrets or API keys
- authentication tokens
- machine usernames
- absolute local filesystem paths
- tunnel credentials
- unrelated personal information
- complete prompts when a smaller structured record is sufficient

## Hidden-state handling

Some ledger records may need to mention that hidden-state checks occurred. Separate operator/GM audit data from player-visible exports so a player cannot infer secret tokens, notes, rolls, or map data from the audit trail.

## Retention

Persistent deployments should define:

- retention duration
- who can inspect each record class
- export rules
- redaction behavior
- deletion/expiration behavior
- backup handling
- whether optional rationale is retained
- whether hidden-state audit fields are retained separately

## Reconciliation

The ledger should make duplicate suppression and unknown-state reconciliation visible. A duplicate request should not silently disappear; it should resolve to the original command/result relationship.

## Source control privacy

Repository examples use synthetic identifiers and relative paths. Deployment-specific credentials, local addresses, private prompts, world exports, and machine-specific paths belong outside version control.

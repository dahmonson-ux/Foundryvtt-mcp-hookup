# Changelog

## Unreleased

Shared-controller remote-player architecture:

- replaced the remote REST-relay client plan with a browser-session `PlayerClientBridge`
- remote players now share their already-authenticated Foundry browser client with the AI
- added Actor-scope checks against the current player session
- removed the relay API client and relay-specific credentials
- added player-client setup, protocol, transport, security, and deployment documentation
- kept the local/solo Foundry bridge path unchanged
- removed legacy remote-gateway configuration fields from the reference config loader

## 0.1.0

Initial public architecture scaffold:

- Apache-2.0 licensing
- provider-neutral four-operation gateway contract
- state-bound action affordance schema
- combat, conditional, and world affordance taxonomy
- capability-aware resolver
- command lifecycle with explicit `UNKNOWN`
- idempotency and reconciliation reference implementation
- privacy-aware in-memory ledger
- Foundry adapter boundary
- mock adapter and first vertical-slice tests
- security, failure-matrix, privacy, and transport documentation

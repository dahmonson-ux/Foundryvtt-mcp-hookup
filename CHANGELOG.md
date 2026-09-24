# Changelog

## Unreleased

Dual-player access model:

- human and AI participants now use separate Foundry accounts and separate access routes
- human route uses normal human/player API access
- AI route uses Cloudflare MCP
- AI Foundry account owns the Pawn; human account owns the human PC
- removed shared-control/browser-loopback assumptions from the active architecture
- reframed assigned-player behavior as role-playing association rather than shared technical authority
- Phase 1 now validates simultaneous human + AI sessions and cross-Actor permission denial

Product-goals revamp:

- refocused the repository on one playable AI Pawn before architecture generalization
- added a product North Star: simpler, more reliable, better role-playing
- separated the Pawn Functional Contract from the player-authored Character Profile
- defined default companion behavior for exploration and natural conversation participation
- moved Assistant DM/world-authoring work out of Version 1 scope

## 0.1.0

Initial public architecture scaffold:

- Apache-2.0 licensing
- provider-neutral four-operation gateway contract
- state-bound action affordance schema
- capability-aware resolver
- command lifecycle with explicit `UNKNOWN`
- idempotency and reconciliation reference implementation
- privacy-aware in-memory ledger
- Foundry adapter boundary
- mock adapter and tests

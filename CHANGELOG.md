# Changelog

## Unreleased

Product-goals revamp:

- refocused the repository on one playable AI Pawn before architecture generalization
- added a product North Star: simpler, more reliable, better role-playing
- separated the Pawn Functional Contract from the player-authored Character Profile
- defined default companion behavior for exploration and natural conversation participation
- added a phased vertical-slice implementation plan
- made the remote-player connection a Phase 1 engineering decision instead of a fixed browser/relay architecture
- moved Assistant DM/world-authoring work out of Version 1 scope
- added a Character Profile example

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

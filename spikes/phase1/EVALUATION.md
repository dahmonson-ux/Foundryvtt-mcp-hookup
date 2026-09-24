# Phase 1 Connection Evaluation

Use the same test scene and Pawn for every candidate.

## Required evidence

| Check | Pass condition | Result |
|---|---|---|
| Player identity | Connection is operating as the logged-in player, not silently as GM | |
| Pawn binding | One explicit Actor UUID is used | |
| Scope rejection | Unowned Actor cannot be controlled | |
| Actor state | Assigned Actor state can be read | |
| Scene state | Pawn position and visible nearby tokens can be read | |
| Conversation | Visible chat reaches the connection promptly | |
| Private chat | Messages invisible to the player are not exported | |
| Speak | Pawn can create a normal in-character chat message | |
| Move | Pawn can move through Foundry's normal movement path | |
| Result confirmation | Updated state can be observed after a write | |
| Disconnect | Connection loss is obvious and recoverable | |
| Remote-host test | Works in the actual remote Foundry deployment | |

## Candidate scorecard

Use 1–5 only after running the acceptance test.

| Candidate | Simplicity | Reliability | Role-playing responsiveness | Notes |
|---|---:|---:|---:|---|
| Player-browser loopback | | | | |
| Existing player-level API (if available) | | | | |
| Other tested path | | | | |

## Decision rule

Do not select a permanent transport from documentation or theory alone.

Select a path only after it has driven the same Pawn through the Phase 1 acceptance test.

The winning path should be the least complicated one that is reliable enough for actual play and responsive enough for natural role-playing.

# Phase 1 Evaluation — Human Route + AI Route

Use one human user, one AI user, one Human Actor, and one Pawn Actor.

## Identity and separation

| Check | Pass condition | Result |
|---|---|---|
| Human account | Human route authenticates as intended human Foundry user | |
| AI account | Cloudflare MCP route authenticates as intended AI Foundry user | |
| Human Actor | Human user controls Human Actor | |
| Pawn Actor | AI user controls Pawn | |
| AI → Human Actor | Denied | |
| AI → unrelated Pawn | Denied unless explicitly granted | |
| Simultaneous sessions | Human and AI can stay connected together | |

## AI route

| Check | Pass condition | Result |
|---|---|---|
| Pawn state | AI reads assigned Pawn state | |
| Scene state | AI reads permitted relevant scene state | |
| Conversation | Relevant visible dialogue reaches AI promptly | |
| Private/hidden data | Data unavailable to AI user is not exposed | |
| Speak | AI Pawn can create normal in-character dialogue | |
| Move | AI can move the Pawn through legitimate Foundry mechanics | |
| Result confirmation | AI observes the post-action state | |
| Reconnect | Cloudflare/AI session loss is recoverable | |

## Human route

| Check | Pass condition | Result |
|---|---|---|
| Normal play | Human movement/chat/actions work normally | |
| AI independence | Human does not need AI gateway running to control Human Actor | |
| No overlap | AI actions do not take control of Human Actor/session | |

## Role-playing responsiveness

Record:

- conversation delay,
- time from human movement to Pawn context update,
- time from AI decision to visible Pawn speech/action,
- any context missing that would make role-playing unnatural.

## Decision rule

The architecture passes Phase 1 when the two routes are demonstrably independent, the AI can function as a real separate player, and the shared Foundry world supplies enough context for responsive role-playing.

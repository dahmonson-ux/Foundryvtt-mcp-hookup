# Implementation Plan

Build vertically around the two-player model.

## Phase 0 — Product contract

Complete.

The product now assumes:

- separate human and AI Foundry identities,
- separate access routes,
- separate Actor ownership,
- shared world/context,
- role-playing relationship rather than shared control.

## Phase 1 — Dual-route connection validation

### Human route

Prove the human can:

- connect through the intended human/player API access path,
- play their own Actor normally,
- remain independent of the AI gateway.

### AI route

Prove the AI can:

- connect through Cloudflare MCP,
- authenticate as the dedicated AI Foundry user,
- identify the assigned Pawn,
- read permitted Actor/scene state,
- receive relevant visible conversation,
- speak as the Pawn,
- move the Pawn,
- observe the resulting state,
- fail cleanly when attempting an unowned human Actor.

Exit criterion: one human and one AI Pawn can be connected simultaneously and independently in the same world.

## Phase 2 — Social + movement slice

Add:

- associated-human relationship/context,
- accompany/follow behavior,
- relevant conversation context,
- Pawn speech,
- explicit player instruction.

Exit criterion: the human walks to an NPC through the human route while the Pawn independently accompanies them and can participate through the AI route.

## Phase 3 — Combat slice

Add to the AI route:

- combat detection,
- own-turn detection,
- legal action retrieval,
- movement,
- targeting,
- weapon attack,
- spell/ability path,
- item use,
- result observation,
- end turn.

Exit criterion: the human plays their own turns normally and the Pawn independently completes its own turn.

## Phase 4 — Character role layer

Load Character Profile with live state.

Test multiple profiles against the same scene.

Exit criterion: different profiles produce meaningfully different plausible role-playing choices without infrastructure changes.

## Phase 5 — Instruction + continuity

Add:

- player-to-Pawn current instruction,
- temporary independent tasks,
- return-to-companion behavior,
- character/campaign memory.

Exit criterion: the Pawn can follow a temporary instruction while remaining an independent AI player.

## Phase 6 — Reliability hardening

Test:

- Cloudflare MCP reconnect,
- AI Foundry session reconnect,
- stale-state recovery,
- duplicate suppression,
- unknown execution reconciliation,
- permission changes,
- unowned-Actor attempts,
- rapid conversation updates.

## Phase 7 — Player setup

Target table setup:

```text
HUMAN
1. create/connect human Foundry account
2. assign Human Actor
3. open human player session

AI PAWN
1. create AI Foundry account
2. assign Pawn Actor
3. configure Character Profile
4. connect AI through Cloudflare MCP
5. start AI player
```

Exit criterion: a table can add a human + AI Pawn pair from documentation without developer assistance.

## Phase 8 — Generalize proven needs

Only after one pair works:

- multiple human/AI pairs,
- additional actions,
- additional game systems,
- packaging/automation.

## First end-to-end demo

```text
HUMAN WINDOW                         AI ROUTE
Human walks into inn                Pawn sees party context
Human talks to NPC                  Pawn receives dialogue
                                    Pawn decides whether to speak
                                    Pawn speaks through AI account

Combat begins
Human plays Human Actor             AI waits for Pawn turn
                                    AI reads legal actions
                                    AI acts through Cloudflare MCP
Foundry resolves both players normally
```

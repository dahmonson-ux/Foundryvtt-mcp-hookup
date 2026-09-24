# Implementation Plan

Build vertically. Each phase should end with something demonstrably playable.

## Phase 0 — Freeze the product contract

Deliver:

- `PRODUCT.md`
- Pawn Functional Contract
- Character Profile schema
- exploration/conversation rules
- initial command vocabulary
- Version 1 non-goals

Exit criterion: another engineer can explain what the Pawn is supposed to do without inventing a universal personality policy.

## Phase 1 — Connection spike

Goal: prove the smallest real player-level connection that can operate one Pawn.

Test practical connection options available in the target deployment. Do not commit to a large networking architecture before this spike.

The winning path should best satisfy:

1. simplicity,
2. reliability,
3. role-playing responsiveness.

Minimum proof:

```text
identify one Pawn
read Actor state
read relevant scene state
speak
move
```

Exit criterion: one test Pawn can perceive, speak, and move through legitimate Foundry functionality.

## Phase 2 — Social + movement slice

Add:

- assigned-player association,
- accompany/follow behavior,
- relevant conversation context,
- Pawn speech,
- explicit player instruction.

Exit criterion: in a town scene the player can walk to an NPC, start a conversation, and the Pawn can naturally remain with the player and participate.

## Phase 3 — Combat slice

Add:

- combat detection,
- own-turn detection,
- legal action retrieval,
- movement,
- targeting,
- one weapon attack path,
- one spell/ability path,
- one item-use path,
- result observation,
- end turn.

Exit criterion: the Pawn can complete a full combat turn without the human choosing each action.

## Phase 4 — Character role layer

Add Character Profile loading and provide it to the AI alongside live state.

Test at least two substantially different profiles against the same scenarios.

Exit criterion: the same mechanics produce meaningfully different, plausible role-playing choices without changing infrastructure code.

## Phase 5 — Instruction + continuity

Add:

- current player instruction,
- temporary independent tasks,
- return-to-companion behavior,
- useful character/campaign memory.

Exit criterion: the Pawn can follow a temporary task, remain in character, and resume normal party participation.

## Phase 6 — Reliability hardening

Add/test:

- stale-state recovery,
- reconnect handling,
- duplicate suppression,
- uncertain execution reconciliation,
- permission failures,
- unavailable Actor/token,
- rapid conversation updates,
- human changes during AI planning.

Exit criterion: ordinary failures do not cause duplicate or out-of-scope actions.

## Phase 7 — Player setup

Target flow:

```text
1. install/start companion component
2. connect to Foundry through the supported player path
3. choose Pawn Actor
4. add/select Character Profile
5. connect preferred AI/model
6. play
```

Exit criterion: a new player can set up from documentation without developer assistance.

## Phase 8 — Generalize only proven needs

Only after the vertical slice works:

- abstract transport differences,
- add additional actions,
- support additional game systems,
- support multiple remote players,
- improve packaging.

Do not generalize guessed requirements.

## First end-to-end demo

### Town

```text
Human walks to inn
→ Pawn accompanies human
NPC greets party
→ Pawn receives conversation
→ Pawn responds or stays quiet according to character/context
```

### Combat

```text
combat begins
→ Pawn detects turn
→ reads legal state/actions
→ chooses as its character
→ Foundry executes mechanics
→ Pawn observes result
→ Pawn ends turn
```

That is the first product milestone.

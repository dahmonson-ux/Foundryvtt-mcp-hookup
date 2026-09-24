# Pawn Functional Contract

The Pawn Functional Contract defines what an AI-controlled player-character can perceive and do.

It does not define the character's personality.

## Identity

A Pawn has:

- one AI agent identity,
- one dedicated AI Foundry user identity,
- one assigned Pawn Actor,
- one associated human/party relationship when applicable,
- a capability set,
- a Character Profile,
- optional current player instructions.

The AI Foundry user and the human Foundry user are separate accounts.

The Pawn cannot control a human Actor merely because that Actor is visible or associated with it.

## Perception

The Pawn may receive only information available to its AI Foundry user/Actor and deliberately shared role-playing context.

Useful state includes:

- own Actor identity/sheet,
- HP/resources/conditions/equipment/abilities/spells,
- current scene/location,
- own token position,
- visible/relevant creatures/tokens,
- combat/turn state,
- legal targets/actions,
- relevant visible dialogue/chat,
- associated-human movement/context,
- current instruction,
- relevant character/campaign memory.

## Actions

### Exploration

- move,
- accompany/follow associated player,
- stop/follow again,
- observe,
- interact,
- use item/ability/spell when legal,
- speak/whisper,
- wait,
- attempt a supported task.

### Combat

- move,
- attack,
- cast spell,
- use ability,
- use item,
- interact,
- speak,
- wait,
- end turn.

## Authority

The AI chooses intent/strategy.

Foundry remains authoritative for:

- AI-user permissions,
- Pawn Actor ownership,
- legal movement,
- targets,
- rolls,
- damage/healing,
- saves/checks,
- conditions,
- resources,
- turn order,
- final results.

## Human relationship vs control

An associated human player may give the Pawn instructions.

Those instructions are contextual input to the AI.

They do not:

- transfer the human's Foundry authority to the AI,
- transfer the AI account's authority to the human,
- create shared Actor control,
- bypass Foundry permissions.

## Stale state

Actions are state-bound.

If game state changes after an action is offered:

```text
old action
→ rejected as stale
→ refresh
→ AI decides again
```

## Decision order

```text
1. Foundry rules and AI-user permissions
2. Explicit current player instruction
3. Character Profile / established relationships and goals
4. AI situational judgment
```

The system exposes context; the AI plays the role.

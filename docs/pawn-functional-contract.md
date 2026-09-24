# Pawn Functional Contract

The Pawn Functional Contract defines what an AI-controlled character can perceive and do. It does **not** define who the character is.

> The interface defines capabilities, context, and game boundaries. It must not prescribe personality, dialogue style, tactics, motivations, or role-playing decisions beyond what is required for valid participation in the game.

## Identity

A Pawn has:

- one AI identity,
- one assigned Foundry Actor,
- one current player association when applicable,
- a capability set,
- a Character Profile,
- optional current player instructions.

The Pawn cannot control another Actor merely because that Actor is visible.

Reassignment must be explicit.

## Perception

The Pawn may receive only information the relevant player/Actor is allowed to know.

Useful state includes:

- own Actor identity and sheet state,
- HP, AC, resources, conditions, inventory, equipment, abilities, and spells,
- current scene/location,
- own token position,
- visible/relevant creatures and tokens,
- current combat and turn state,
- legal targets and action options,
- relevant chat and dialogue,
- assigned player's nearby movement/context,
- current explicit player instruction,
- relevant character/campaign memory when available.

The exact transport may differ by deployment. The functional meaning should not.

## Actions

The Pawn may be offered bounded game actions such as:

### Exploration

- move
- accompany/follow assigned player
- stop/follow again
- observe
- interact
- use item
- use ability
- cast spell
- speak
- whisper
- wait
- attempt a supported task

### Combat

- move
- attack
- cast spell
- use ability
- use item
- interact
- speak
- wait
- end turn

The first playable slice does not need every action above.

## Authority

The AI chooses intent and strategy.

Foundry and the installed game system remain authoritative for:

- permissions,
- legal movement,
- target validity,
- attack rolls,
- damage,
- saving throws,
- ability checks,
- conditions,
- spell slots,
- item/resource consumption,
- turn order,
- final outcomes.

The AI should not fabricate a mechanical result when the game can resolve it.

## Stale state

Actions are state-bound.

If the human, another participant, or Foundry changes relevant state after an action is offered, the old action must expire.

The correct behavior is:

```text
old action
→ rejected as stale
→ refresh current state/actions
→ AI decides again
```

Do not reinterpret a stale action against a new state.

## Explicit player instructions

A player may give the Pawn a current instruction, for example:

- "Stay with me."
- "Talk to the blacksmith."
- "Watch the door."
- "Heal Monica if she goes down."
- "Go ask what happened at the docks."

Instructions provide current priorities. They do not grant new Foundry permissions or bypass game legality.

## Decision order

When choosing among legitimate actions, the expected priority is:

```text
1. Foundry rules and permissions
2. Explicit current player instruction
3. Character Profile and established relationships/goals
4. AI situational judgment
```

The system should expose context. It should not hard-code the final role-playing choice.

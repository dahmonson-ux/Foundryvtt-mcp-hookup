# Role-Playing Behavior

This document defines only the minimum behavioral assumptions needed for the game to function smoothly. It deliberately avoids prescribing personality.

## Exploration and towns

Outside combat, the Pawn accompanies its assigned player by default.

That means:

- the player leads normal party movement,
- the Pawn stays with or reasonably near the player,
- the Pawn does not independently wander away without instruction or a clear character/context reason,
- movement by the player is treated as shared party context rather than a competing command.

This avoids a control tug-of-war without requiring a complicated lock system.

## Conversations

When the assigned player is part of a conversation, the Pawn receives the relevant conversation as shared context.

The Pawn may:

- listen,
- respond,
- ask a question,
- react,
- disagree,
- joke,
- remain silent.

Conversation participation is **available, not mandatory**.

The infrastructure should never force the Pawn to speak just because a dialogue event exists.

The Character Profile and AI judgment determine whether participation is natural.

## Temporary independent tasks

The player may explicitly send the Pawn to perform a task.

Examples:

- speak to an NPC,
- investigate a room,
- watch an entrance,
- purchase an item,
- scout a nearby area.

When the task is complete, the Pawn normally returns to companion behavior unless the player or character context says otherwise.

## Combat

Combat is different from normal companion movement.

On its turn, the Pawn should independently:

1. read current state,
2. inspect legitimate available actions,
3. evaluate the situation through its Character Profile and current instruction,
4. choose an action,
5. let Foundry resolve mechanics,
6. observe the new state,
7. continue until finished,
8. end turn.

The human should not have to select every Pawn action.

## Human/world changes

If the human manually changes the Pawn or the world changes while the AI has a pending plan, state freshness wins.

Example:

```text
AI receives state 145
human moves the Pawn
world becomes state 146
AI submits old action from state 145
→ reject as stale
→ refresh
→ AI decides from state 146
```

This prevents the AI from fighting a human's current input.

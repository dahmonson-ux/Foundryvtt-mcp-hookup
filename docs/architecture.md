# Architecture

The architecture exists to support a playable AI Pawn, not to dictate how every deployment must connect to Foundry.

## Product boundary

```text
Character Profile
        +
Live Game Context
        +
Current Player Instruction
        ↓
       AI
        ↓
state-bound legal action
        ↓
GatewayCore
        ↓
Foundry adapter
        ↓
chosen player-level connection
        ↓
Foundry VTT
```

The connection below the Foundry adapter is intentionally replaceable.

## Responsibilities

### AI

The AI owns:

- role-playing interpretation,
- tactical judgment,
- dialogue,
- choice among legitimate actions.

The AI does not own mechanical outcomes.

### Character Profile

The Character Profile supplies:

- backstory,
- personality,
- values,
- goals,
- fears,
- bonds,
- flaws,
- speech style,
- combat tendencies,
- freeform player guidance.

It informs decisions without scripting them.

### GatewayCore

The gateway owns:

- agent/Actor binding,
- capability checks,
- action freshness,
- offered-action validation,
- idempotency,
- uncertain-outcome reconciliation.

It should remain small.

### Affordance resolver

The resolver filters current candidate actions into choices valid for:

- this Actor,
- this state,
- this turn,
- this capability set.

### Foundry adapter

The adapter translates between the project contract and the installed Foundry/game-system behavior.

Foundry remains authoritative for game state, permissions, and mechanics.

### Connection implementation

The connection implementation is not yet fixed.

Phase 1 should prove the simplest viable player-level path for the actual target setup.

Possible implementations may include:

- an existing player API,
- a client/module bridge,
- another supported integration.

Do not let the public Pawn contract depend on transport-specific details.

## State freshness

Actions are ephemeral.

```text
state 145
→ action offered
→ human/world changes state
→ state 146
→ old action rejected
→ refresh
```

This is the primary mechanism for avoiding human/AI tug-of-war.

## Role-playing context

The state path should eventually provide:

- assigned Pawn state,
- relevant scene state,
- visible entities,
- combat/turn state,
- relevant conversation,
- assigned-player context,
- current player instruction,
- Character Profile,
- relevant memory.

The gateway does not decide how the AI interprets that context.

## Version 1 boundary

Version 1 is about an AI player/Pawn.

Assistant DM/world-authoring capabilities are intentionally outside this architecture until the Pawn experience works end to end.

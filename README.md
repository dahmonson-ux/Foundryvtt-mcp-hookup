# Foundry VTT AI Pawn

A project for letting an AI legitimately play a character alongside a human player in Foundry VTT.

## North Star

> Every technical decision should make the system simpler, more reliable, or improve the role-playing experience.

The target experience is straightforward:

```text
Human plays their character.

AI Pawn accompanies them,
participates in the adventure,
joins conversations,
and independently plays its own turns in combat.
```

This repository is intentionally shifting away from architecture-first development. The first priority is one complete, playable Pawn. Transport and deployment abstractions should follow what the working vertical slice proves we actually need.

## Product model

There are three distinct layers:

```text
PAWN FUNCTIONAL CONTRACT
What the Pawn may perceive and do
        +
CHARACTER PROFILE
Who the Pawn is
        +
LIVE GAME CONTEXT
What is happening now
        ↓
AI DECISION
        ↓
LEGITIMATE FOUNDRY ACTION
```

The functional layer does **not** define a universal Pawn personality.

The player can provide a Character Profile containing backstory, personality, values, goals, fears, bonds, flaws, speech style, combat tendencies, role-playing notes, and freeform context.

Foundry remains authoritative for game permissions and mechanics.

## Core behavior

### Outside combat

The Pawn accompanies its assigned player by default.

If the player enters a conversation, the Pawn receives relevant conversation context and may participate naturally according to its Character Profile and judgment.

The Pawn may act independently when explicitly instructed or when the role/context clearly calls for it.

### In combat

The Pawn independently plays its own turn:

```text
read current state
→ inspect legitimate actions
→ decide as the character
→ execute through Foundry
→ observe result
→ continue if appropriate
→ end turn
```

The human should not need to pick every Pawn action.

## Foundry stays authoritative

The AI chooses strategy and intent.

Foundry and the installed game system determine:

- permissions,
- legal movement,
- target validity,
- rolls,
- damage/healing,
- saving throws/checks,
- conditions,
- spell slots/resources,
- item consumption,
- turn order,
- final mechanical outcomes.

The AI should not invent a result Foundry can resolve.

## First playable slice

Do not start by solving every deployment case.

The first milestone is one real Pawn that can:

- identify its assigned Actor,
- read relevant Actor/scene state,
- accompany its player,
- receive conversation context,
- speak,
- move,
- recognize its combat turn,
- inspect legitimate actions,
- attack,
- use one spell/ability path,
- use one item path,
- observe results,
- end its turn.

Once that works, generalize only what the working implementation proves necessary.

## Connection strategy

The transport is deliberately **not locked yet**.

Phase 1 is a connection spike. Test the practical player-level connection paths available in the target Foundry setup and choose the one that best satisfies:

1. simplicity,
2. reliability,
3. role-playing responsiveness.

Possible implementations may use an existing player API, a Foundry client/module bridge, or another supported integration. The product contract should not depend on which transport wins.

## Core gateway contract

The existing state-bound affordance gateway remains useful because it prevents guessed or stale actions:

```text
getAvailableActions(agent_id, state_version?)
executeAction(agent_id, action_id, state_version, idempotency_key)
proposeAction(agent_id, proposal, state_version, idempotency_key)
reconcileAction(command_id, idempotency_key)
```

The AI should choose from actions actually available in the current state.

If the human or world changes state first, an old action expires and the AI refreshes rather than fighting the new state.

## Documentation

Start here:

- [PRODUCT.md](PRODUCT.md) — product goals and Version 1 definition of done
- [docs/pawn-functional-contract.md](docs/pawn-functional-contract.md) — what a Pawn can perceive and do
- [docs/character-profile.md](docs/character-profile.md) — player-authored identity/backstory layer
- [docs/roleplaying-behavior.md](docs/roleplaying-behavior.md) — exploration, conversation, and combat assumptions
- [docs/implementation-plan.md](docs/implementation-plan.md) — phased vertical-slice roadmap
- [docs/action-affordances.md](docs/action-affordances.md) — game-action vocabulary
- [docs/execution-lifecycle.md](docs/execution-lifecycle.md) — stale state, idempotency, and reconciliation
- [docs/failure-matrix.md](docs/failure-matrix.md) — reliability cases

Example profile:

- [examples/character-profile.example.json](examples/character-profile.example.json)

## Repository layout

```text
PRODUCT.md
docs/
examples/
packages/
  contracts/
  gateway/
  affordances/
  adapters/
    foundry/
    mock/
  ledger/
```

The packages are intentionally transport-neutral. A connection implementation should sit behind the Foundry adapter boundary after the connection spike identifies the simplest viable path.

## Current implementation

The code currently provides:

- provider-neutral contracts,
- Actor-scoped identities/capabilities,
- state-bound action affordances,
- stale-action rejection,
- idempotency/duplicate suppression,
- uncertain execution reconciliation,
- action ledger,
- Foundry adapter boundary,
- mock vertical-slice tests.

What it does **not** yet provide is a finished production connection to a live Foundry player session. That is the next engineering milestone.

## Development

Requirements:

- Node.js 20+
- npm 10+

```bash
npm install
npm run check
```

The current tests run against synthetic/mock state and do not require a real Foundry world.

## First-version scope

In scope:

- AI player/Pawn
- player-authored Character Profile
- exploration companion behavior
- conversation participation
- autonomous combat turns
- legitimate Foundry mechanics
- remote-player support after the connection spike proves the path

Not in scope yet:

- Assistant DM world building/editing
- arbitrary JavaScript execution
- every Foundry game system
- universal behavior scripting
- large multi-agent orchestration

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

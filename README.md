# Foundry VTT AI Pawn

This project lets a human player and an AI Pawn play in the same Foundry VTT world as **separate players with separate accounts and separate control paths**.

## The player experience

From the table's perspective, there are simply two players:

```text
                         SAME FOUNDRY WORLD
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
           HUMAN PLAYER                   AI PLAYER
                 │                             │
          Human access                    Cloudflare MCP
            / API                              │
                 │                             │
       Human Foundry account           AI Foundry account
                 │                             │
          Human character                  AI Pawn
```

The human and AI do **not** share a Foundry account, browser session, or Actor.

That means there is no normal control overlap:

```text
Human account → Human Actor
AI account    → Pawn Actor
```

Both can be connected to the same world at the same time in their own sessions/windows.

## What the human player does

The human plays normally.

They:

- sign in through the human/player access route,
- control their own Foundry character,
- move, roll, talk, and interact normally,
- give the Pawn instructions when they want to,
- role-play with the Pawn like another party member.

The human does not need to drive the Pawn's combat turn.

## What the AI player does

The AI has its own Foundry player identity and its own Pawn Actor.

Its decision context can include:

- Character Profile,
- backstory/personality,
- current player instruction,
- visible Foundry state,
- current combat state,
- relevant conversation context,
- campaign/character memory.

The AI then uses the Cloudflare MCP route to perform legitimate actions available to its Foundry account.

```text
Character Profile
Player Instruction
Foundry-visible state
Conversation context
        │
        ▼
       AI
        │
        ▼
Cloudflare MCP
        │
        ▼
AI Foundry account
        │
        ▼
      Pawn Actor
```

## Why the two-route model matters

The human and AI are separate participants instead of two controllers fighting over one session.

This gives us a cleaner authority model:

- Foundry already knows which user owns which Actor.
- The human keeps complete control of the human PC.
- The AI keeps control of the Pawn.
- The gateway can still validate expected AI-user/Actor binding.
- A bad or stale AI action cannot silently become control of the human's Actor.
- The Pawn relationship to the human is role-playing context, not shared technical control.

## Role-playing behavior

### Exploration and towns

The human leads their own character normally.

The Pawn is a separate player, but its default companion behavior is to accompany the associated human character unless instructed otherwise or character/context gives it a reason to act independently.

### Conversations

When the human is part of a conversation, relevant dialogue can be included in the AI Pawn's context.

The Pawn may:

- listen,
- respond,
- ask a question,
- disagree,
- joke,
- react,
- remain silent.

The infrastructure does not force dialogue. The Character Profile and AI decide what is natural.

### Combat

On the Pawn's turn:

```text
AI reads state
→ sees legitimate current actions
→ decides as the character
→ sends action through Cloudflare MCP
→ Foundry resolves mechanics as the AI user
→ AI observes the result
→ continues or ends turn
```

The human continues playing the human PC through the human route.

## Character Profile

The functional contract defines what the Pawn can perceive and do.

The Character Profile defines who the Pawn is.

Players can provide:

- name,
- backstory,
- personality,
- values/beliefs,
- goals,
- fears,
- bonds/relationships,
- flaws,
- likes/dislikes,
- speech style,
- attitude toward the associated human/party,
- combat tendencies,
- freeform role-playing notes.

Profiles inform decisions without turning the Pawn into a fixed behavior script.

## Foundry remains authoritative

The AI chooses intent and strategy.

Foundry and the installed game system determine:

- permissions,
- Actor ownership,
- legal movement,
- target validity,
- rolls,
- damage/healing,
- saving throws/checks,
- conditions,
- resources,
- turn order,
- final mechanical outcomes.

The AI should not invent a result Foundry can resolve.

## Current architecture

The permanent code keeps a small provider-neutral core:

```text
AI decision
   ↓
GatewayCore
   ↓
state-bound legal action
   ↓
Foundry adapter
   ↓
Cloudflare MCP / AI-player route
   ↓
AI Foundry account
   ↓
Pawn
```

The human route does not pass through the AI gateway:

```text
Human
  ↓
Human API/player access
  ↓
Human Foundry account
  ↓
Human Actor
```

Both routes meet inside the same Foundry world.

## Current engineering phase

**Phase 1 now validates the two-player access model.**

The previous shared-browser/loopback spike has been retired.

Phase 1 must prove:

### Human route

- human signs in as the human Foundry user,
- human controls only the intended human Actor(s),
- normal player behavior is unaffected by the AI route.

### AI route

- AI connects through Cloudflare MCP,
- AI authenticates as a dedicated AI Foundry user,
- AI user owns the intended Pawn,
- AI can read its permitted game state,
- AI can receive relevant visible conversation,
- AI can speak,
- AI can move,
- Foundry rejects attempts to control the human Actor or another unowned Actor.

See [spikes/phase1/README.md](spikes/phase1/README.md).

## Core gateway contract

The gateway remains useful on the AI route for state freshness, scope, idempotency, and uncertain execution:

```text
getAvailableActions(agent_id, state_version?)
executeAction(agent_id, action_id, state_version, idempotency_key)
proposeAction(agent_id, proposal, state_version, idempotency_key)
reconcileAction(command_id, idempotency_key)
```

It is not responsible for controlling the human player's character.

## Documentation

Start here:

- [PRODUCT.md](PRODUCT.md) — product goals and Version 1 definition of done
- [docs/player-perspective.md](docs/player-perspective.md) — human and AI player experience
- [docs/architecture.md](docs/architecture.md) — dual-route architecture
- [docs/pawn-functional-contract.md](docs/pawn-functional-contract.md) — AI Pawn capabilities/boundaries
- [docs/character-profile.md](docs/character-profile.md) — player-authored identity/backstory
- [docs/roleplaying-behavior.md](docs/roleplaying-behavior.md) — exploration, conversation, and combat behavior
- [docs/implementation-plan.md](docs/implementation-plan.md) — phased roadmap
- [spikes/phase1/README.md](spikes/phase1/README.md) — current Cloudflare MCP validation plan

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
spikes/
  phase1/
```

## Current implementation

The code currently provides:

- Character/Profile role-play contracts,
- Actor-scoped agent identities,
- state-bound action affordances,
- stale-action rejection,
- idempotency/duplicate suppression,
- uncertain execution reconciliation,
- action ledger,
- Foundry adapter boundary,
- mock vertical-slice tests.

The Cloudflare MCP → dedicated AI Foundry user integration is the next live integration target.

## Development

Requirements:

- Node.js 20+
- npm 10+

```bash
npm install
npm run check
```

## North Star

> Every technical decision should make the system simpler, more reliable, or improve the role-playing experience.

If the Pawn feels like another character at the table rather than a macro, second DM, or scripted chatbot, the project is achieving its goal.

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).

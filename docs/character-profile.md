# Character Profile

The Character Profile is the player-authored layer that tells the AI **who the Pawn is**.

The functional contract defines what the Pawn can perceive and do. The Character Profile supplies identity, history, motivations, relationships, and style.

```text
Functional Contract
        +
Character Profile
        +
Live Game Context
        +
Current Player Instruction
        ↓
AI decision
        ↓
Legitimate Foundry action
```

## Recommended fields

- **Name** — character identity.
- **Backstory** — freeform history and formative events.
- **Personality** — temperament, habits, social style.
- **Values / beliefs** — what the character considers important.
- **Goals** — short- and long-term aims.
- **Fears** — things the character avoids or struggles with.
- **Bonds / relationships** — connections to the player, party, NPCs, factions, places.
- **Flaws** — blind spots, contradictions, bad habits.
- **Likes / dislikes** — preferences that color choices.
- **Speech style** — vocabulary, humor, formality, cadence.
- **Attitude toward assigned player** — trust, rivalry, mentorship, affection, skepticism, etc.
- **Combat tendencies** — preferences, not mandatory tactics.
- **Role-playing notes** — player guidance that does not fit elsewhere.
- **Additional context** — freeform character material.

## Profiles inform; they do not script

A Character Profile should influence decisions without becoming deterministic rules.

Bad:

```text
skeptical_of_authority = true
→ always challenge guards
```

Preferred:

```text
character is skeptical of authority
+
guard gives a suspicious answer
+
party needs information
→ AI decides whether/how the character responds
```

The AI remains responsible for interpreting the role in context.

## Example

See `examples/character-profile.example.json`.

## Profile evolution

A future implementation may allow a profile to evolve through campaign events, but the player-authored profile remains distinct from runtime memory.

Useful separation:

```text
Character Profile
= who this character is intended to be

Campaign memory
= what this character has experienced

Current instruction
= what the player wants right now
```

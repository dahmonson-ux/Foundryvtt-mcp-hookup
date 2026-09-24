# Product Direction

## North Star

Build an AI companion that legitimately plays a character in Foundry VTT alongside a human player.

Every technical decision should make the system **simpler**, **more reliable**, or **improve the role-playing experience**. If it does none of those, it should not be in the first version.

The target experience is:

```text
Human plays their character.

AI Pawn accompanies them,
participates in the adventure,
joins conversations,
and independently plays its own turns in combat.
```

## End goals

1. One AI-controlled Pawn can be assigned to a human player.
2. The human controls their normal character while the AI controls its own Pawn.
3. Remote players can use the system when Foundry is hosted elsewhere.
4. Reuse legitimate player-level access instead of creating unnecessary parallel control planes.
5. The AI controls only its assigned Pawn unless explicitly reassigned.
6. Foundry remains authoritative for permissions, legal mechanics, rolls, resources, targeting, movement, and outcomes.
7. The AI receives enough player-visible state to make informed decisions.
8. The AI uses bounded, legitimate game actions rather than unrestricted Foundry or JavaScript access.
9. Outside combat, the Pawn accompanies its assigned player by default.
10. When the player enters a conversation, the Pawn receives that conversation as shared context and may participate naturally.
11. Explicit player instructions can temporarily change normal companion behavior.
12. In combat, the Pawn independently evaluates the situation and plays its own turn.
13. A player-authored Character Profile shapes role-playing and tactical choices.
14. Player setup should eventually be close to: connect, choose Pawn Actor, add Character Profile, connect AI, play.
15. Local/solo play should remain simpler than remote play.
16. Start with one complete Pawn before generalizing.
17. Assistant DM functionality is a later, separate scope.

## Product boundaries

The system defines **functions and boundaries**, not a universal personality.

It should define:

- what the Pawn can perceive,
- which Actor it is assigned to,
- which legal actions it can take,
- what game context it receives,
- how stale state and failures are handled,
- which system is authoritative.

It should not prescribe:

- personality,
- morality,
- tactical style,
- loyalty,
- speech style,
- motivations,
- emotional responses,
- whether the Pawn speaks in a given moment.

Those belong to the Character Profile and the AI's interpretation of the live game state.

## First-version non-goals

- Assistant DM world editing
- arbitrary JavaScript execution for the AI
- support for every Foundry game system
- universal Pawn behavior rules
- large multi-agent orchestration
- AI-authored mechanical outcomes when Foundry can determine them

## Definition of done for Version 1

Version 1 is complete when one real player can run one AI Pawn through a normal session and:

- the Pawn is bound to one Actor,
- the Pawn understands its current character and game state,
- the Pawn accompanies its player outside combat,
- the Pawn receives and can participate in relevant conversations,
- a player-authored Character Profile influences choices,
- the Pawn can move, speak, attack, use a spell/ability or item, and end its turn through legitimate Foundry mechanics,
- the Pawn independently chooses actions in combat,
- Foundry resolves mechanics and outcomes,
- explicit player instructions can guide current priorities,
- stale/conflicting actions fail cleanly and force a refresh,
- a normal player can set it up from documentation.

If the Pawn feels like another character at the table rather than a macro, second DM, or scripted chatbot, the project is achieving its goal.

# Product Direction

## North Star

Build an AI companion that legitimately plays a character in Foundry VTT alongside human players.

Every technical decision should make the system **simpler**, **more reliable**, or **improve the role-playing experience**.

## Player model

Humans and AI are separate Foundry players.

```text
                         FOUNDRY WORLD
                              │
              ┌───────────────┴───────────────┐
              │                               │
        HUMAN PLAYER ROUTE               AI PLAYER ROUTE
              │                               │
      Human API/access                  Cloudflare MCP
              │                               │
    Human Foundry account              AI Foundry account
              │                               │
       Human Actor                         Pawn Actor
```

The routes share the world, not control.

A human player does not lend their Foundry session to the AI.

An AI Pawn uses its own Foundry player account and owns its own Actor.

## End goals

1. Every human player uses their own Foundry identity and controls their own character.
2. Every AI Pawn uses a dedicated AI Foundry identity and controls its assigned Pawn.
3. Human and AI players may be connected to the same world simultaneously in separate sessions/windows.
4. Human access and AI access remain separate routes.
5. The AI route uses Cloudflare MCP.
6. The human route uses the normal human/player API access path.
7. Foundry permissions remain the first authority for which account can control which Actor.
8. The gateway additionally binds the expected AI identity to the expected Pawn.
9. The AI receives only state appropriate to its Foundry user/Actor.
10. Foundry remains authoritative for mechanics and outcomes.
11. Outside combat, the Pawn normally accompanies its associated human player as a role-playing behavior, not because they share control.
12. Relevant conversations involving the associated human/party can become Pawn context.
13. The AI may naturally participate in dialogue according to Character Profile and judgment.
14. Explicit player instructions can guide current Pawn priorities.
15. In combat, the Pawn independently plays its own turns.
16. A player-authored Character Profile shapes choices without scripting them.
17. Start with one human + one AI Pawn pair before generalizing.
18. Assistant DM functionality remains a later, separate scope.

## Product boundaries

The system defines:

- AI-user/Pawn identity binding,
- what the Pawn can perceive,
- legitimate Pawn actions,
- role-playing context,
- state freshness,
- execution/reconciliation behavior.

It does not prescribe:

- universal personality,
- morality,
- tactics,
- loyalty,
- dialogue frequency,
- motivations,
- emotional responses.

Those belong to the Character Profile and AI interpretation.

## First-version non-goals

- sharing the human's login/session with the AI,
- shared Actor control,
- browser-loopback control of a human session,
- Assistant DM world editing,
- arbitrary JavaScript execution,
- every Foundry game system,
- universal Pawn behavior rules,
- large multi-agent orchestration.

## Definition of done for Version 1

Version 1 is complete when a human player and an AI Pawn can participate in the same normal session and:

- each uses a separate Foundry account/session,
- the human route controls the human Actor,
- the Cloudflare MCP route controls the Pawn through the AI account,
- attempts by the AI account to control the human Actor are rejected,
- the Pawn receives permitted game state and conversation context,
- Character Profile influences decisions,
- the Pawn accompanies the human in exploration by default,
- the Pawn can speak and role-play,
- the Pawn can move, attack, cast/use an ability or item, and end its turn,
- the Pawn independently chooses its combat actions,
- Foundry resolves mechanics,
- stale/duplicate/uncertain actions are handled safely.

If the table experiences the Pawn as another player-character rather than shared automation, the product is working.

# Deployment and Access Model

The target deployment has two player routes into the same Foundry world.

## Human player route

```text
Human player
→ human/player API access
→ Human Foundry account
→ Human Actor
```

The human keeps a normal independent player session.

Human play should not depend on the AI gateway.

## AI player route

```text
AI
→ Cloudflare MCP
→ AI Foundry account
→ Pawn Actor
```

The AI account is a real separate Foundry player identity.

It should own only the Actor(s) intentionally assigned to that AI player.

## Simultaneous play

Human and AI sessions can be open at the same time.

Example:

```text
World
├── Human User A → Human Character A
├── AI User A    → Pawn A
├── Human User B → Human Character B
└── AI User B    → Pawn B
```

There is no requirement for one browser/session to proxy another player's authority.

## Permission model

Foundry permissions are the first boundary.

The AI route must also validate the expected AI-user/Pawn binding.

Required negative test:

```text
AI User A
→ attempts Human Character A
→ denied
```

Also test:

```text
AI User A
→ attempts Pawn B
→ denied unless intentionally granted
```

## Phase 1 target

Phase 1 no longer evaluates browser-loopback control.

It validates the selected two-route deployment:

- human player through human API access,
- AI player through Cloudflare MCP,
- separate Foundry identities,
- separate Actors,
- simultaneous participation.

The AI route must prove:

```text
authenticate as AI user
→ identify Pawn
→ read permitted state
→ receive relevant visible conversation
→ speak
→ move
→ confirm state
→ fail to control an unowned human Actor
```

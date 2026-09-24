# Phase 1 — Dual-Route Connection Validation

Phase 1 now validates the selected access model rather than comparing shared-browser transports.

The previous browser-loopback experiment is retired.

## Target model

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

## What Phase 1 must prove

### Human player

- signs in through the intended human/player access path,
- controls the intended human Actor,
- can play normally while the AI is connected.

### AI player

- connects through Cloudflare MCP,
- authenticates as a dedicated AI Foundry user,
- controls the intended Pawn,
- reads permitted Pawn/scene state,
- receives relevant visible conversation,
- speaks as the Pawn,
- moves the Pawn,
- observes the resulting state.

### Separation

Required negative tests:

```text
AI user → Human Actor → DENIED
```

```text
Human user → Pawn Actor → not granted unless intentionally configured
```

```text
AI User A → Pawn B → DENIED unless intentionally granted
```

## Acceptance scenario

### Town

```text
Human window:
Human enters tavern and speaks to NPC

AI route:
Pawn receives relevant dialogue
Pawn decides whether to respond
Pawn speaks through AI Foundry account
Pawn moves independently to accompany Human Actor
```

### State confirmation

After any AI write:

```text
action
→ Foundry resolves as AI user
→ state is reread
→ result is confirmed
```

## What this phase does not require

- browser-loopback proxying,
- shared human/AI login,
- shared Actor control,
- Assistant DM permissions,
- complete combat,
- multiple AI players,
- permanent packaging.

## Implementation note

Do not invent a Cloudflare MCP protocol in this repository until the actual MCP interface/commands are available.

Phase 1 integration code should be written against the real Cloudflare MCP surface and the dedicated AI-user permissions.

## Exit criterion

One human and one AI Pawn can remain connected simultaneously, act independently through their own routes, interact in the same world, and Foundry rejects cross-account Actor control.

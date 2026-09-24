# Architecture

The architecture has two access routes into one Foundry world.

## Top-level model

```text
                         FOUNDRY WORLD
                              │
              ┌───────────────┴───────────────┐
              │                               │
          HUMAN ROUTE                     AI ROUTE
              │                               │
      Human API/access                  Cloudflare MCP
              │                               │
    Human Foundry account              AI Foundry account
              │                               │
       Human Actor                         Pawn Actor
```

The routes share game state through Foundry but do not share account/session/Actor control.

## Human route

The human route is intentionally outside the AI gateway.

```text
Human
  ↓
human/player API access
  ↓
Human Foundry user
  ↓
Human Actor
```

Humans play normally.

The AI architecture must not make ordinary human play dependent on the AI gateway.

## AI route

```text
Character Profile
Current Player Instruction
Foundry-visible state
Conversation context
Relevant memory
        │
        ▼
       AI
        │
        ▼
 GatewayCore
        │
        ▼
Foundry adapter
        │
        ▼
Cloudflare MCP
        │
        ▼
AI Foundry user
        │
        ▼
Pawn Actor
```

## Identity boundary

The expected binding is:

```text
AI agent
→ dedicated AI Foundry user
→ assigned Pawn Actor
```

Foundry user permissions are authoritative.

The gateway still validates that the agent is acting through the expected Pawn identity and current legitimate actions.

## Why there is no normal control overlap

The human and AI do not share:

- Foundry login,
- browser/session,
- Actor ownership,
- command channel.

The human may give the Pawn instructions as game/role-playing context, but that is not technical co-control of the Pawn.

## Role-playing relationship

The associated human character is context for the Pawn:

- who it normally accompanies,
- whose conversations are often relevant,
- who may give it current instructions,
- who may have a relationship represented in Character Profile.

This association does not grant the human route access to the AI route or vice versa.

## Gateway responsibilities

The gateway on the AI route owns:

- AI-agent/Pawn binding,
- capability checks,
- action freshness,
- offered-action validation,
- idempotency,
- uncertain-outcome reconciliation.

It does not own:

- human character control,
- personality interpretation,
- tactical strategy,
- mechanical outcomes.

## Foundry adapter

The Foundry adapter translates the project contract into the action/state behavior exposed through the AI route.

Foundry remains authoritative for:

- user permissions,
- Actor ownership,
- game state,
- legal mechanics,
- results.

## State freshness

Actions are ephemeral:

```text
AI receives state 145
→ action offered
→ world changes to 146
→ old action rejected
→ AI refreshes and decides again
```

This protects against changing world state. It is no longer primarily a human-vs-AI shared-control mechanism because the human and AI own different Actors.

## Version 1 boundary

Version 1 is an AI player/Pawn system.

Assistant DM/world-authoring remains separate.

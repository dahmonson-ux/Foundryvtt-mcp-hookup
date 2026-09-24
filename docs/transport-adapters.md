# Transport Adapters

The access model is now explicit:

- humans use the normal human/player API route,
- AI Pawns use the Cloudflare MCP route,
- both authenticate as separate Foundry users.

## Human route

The human route is not part of the AI transport stack.

```text
Human player
→ human/player API access
→ Human Foundry account
→ Human Actor
```

Human play should continue normally even if the AI gateway is offline.

## AI route

```text
AI
→ GatewayCore
→ FoundryGameAdapter
→ Cloudflare MCP
→ AI Foundry account
→ Pawn Actor
```

The Cloudflare MCP layer should remain transport/thin-integration infrastructure.

Do not place:

- character personality logic,
- tactical decision making,
- a second game-rules engine,

inside the transport.

## AI-facing command surface

The stable model-facing surface can remain small:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

The AI chooses from structured legal options.

Do not create one MCP command per weapon, spell, or item unless the actual MCP interface requires it.

## Required properties

The AI transport must preserve:

- dedicated AI-user identity,
- Pawn Actor binding,
- Foundry permissions,
- visible-state filtering,
- state freshness,
- execution results,
- uncertain-outcome reconciliation.

## Phase 1

Phase 1 no longer compares generic transports.

It validates the real selected access model:

```text
Human → human access → Human user → Human Actor

AI → Cloudflare MCP → AI user → Pawn
```

The key test is not whether Cloudflare MCP can reach Foundry in general.

The key test is whether the AI can behave as a legitimate separate player while Foundry continues to enforce account and Actor boundaries.

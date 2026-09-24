# Deployment Modes

Deployment comes after the product contract.

The first engineering task is a connection spike, not a commitment to one transport.

## Local / solo

If Foundry and the AI tooling are in the same trusted environment, use the simplest local connection available.

Do not force remote-player plumbing into local play.

## Remote player

If Foundry is hosted elsewhere, the Pawn still needs legitimate player-level access to:

- its assigned Actor,
- relevant player-visible state,
- legal game actions,
- conversation context.

The exact connection is deliberately undecided until tested.

Possible candidates may include:

- an existing player API,
- a Foundry client/module integration,
- another supported player-level route.

## Selection criteria

Choose the connection that best satisfies:

1. **Simplicity** — fewest moving parts and least player configuration.
2. **Reliability** — predictable reconnects, permissions, state freshness, and execution results.
3. **Role-playing quality** — low enough latency and rich enough context for natural conversation and play.

## Non-negotiable behavior

Regardless of transport:

- the AI is bound to one Pawn Actor,
- Foundry permissions remain authoritative,
- the AI receives only appropriate player-visible context,
- stale actions expire,
- Foundry resolves game mechanics,
- arbitrary JavaScript is not a normal Pawn capability.

## Phase 1 exit criterion

The winning connection must prove one Pawn can:

```text
identify its Actor
read state
read relevant scene/context
speak
move
```

Only then should the project commit to a production transport.

# Phase 1 Connection Spike

This directory is intentionally disposable.

The purpose of Phase 1 is to **select a connection, not design a permanent architecture**.

Nothing in this directory should be promoted into `packages/` until it proves the first real Pawn connection.

## Acceptance test

One assigned Pawn must be able to:

```text
identify its Actor
→ read Actor state
→ read relevant scene state
→ receive relevant conversation context
→ speak through Foundry
→ move through Foundry
→ confirm the resulting state
```

No combat engine, packaging, multi-player framework, or permanent MCP transport is part of this spike.

## Candidate A: player-browser loopback

The first executable candidate in this spike is:

```text
local probe server
      ↑↓ WebSocket
temporary Foundry player-client module
      ↓
current logged-in player's Foundry permissions
```

The module runs in the player's browser session and intentionally performs all Foundry writes through that user's normal client permissions.

The local server binds to `127.0.0.1` only and exposes a tiny HTTP test surface.

This is **not** a proposed production architecture. It exists to answer whether the player browser can provide the state, dialogue responsiveness, and legitimate movement/speech path we need with acceptably little friction.

## Why this candidate is useful

It tests the hardest product requirement directly:

> Can a normal logged-in player lend an AI one assigned Pawn without giving the AI GM/world authority?

The spike validates Actor ownership before every Pawn operation.

## Setup

### 1. Install the temporary Foundry module

Copy:

```text
spikes/phase1/player-client-module/
```

into the Foundry data directory as:

```text
Data/modules/ai-pawn-phase1-spike/
```

Restart Foundry and enable **AI Pawn — Phase 1 Connection Spike** in the test world.

### 2. Configure the player client

While logged in as the player who owns the Pawn:

**Game Settings → Configure Settings → Module Settings**

Set:

- **Enable Phase 1 Spike:** on
- **Pawn Actor UUID:** the Actor UUID assigned to the AI
- **Local Bridge URL:** `ws://127.0.0.1:3001/foundry`

Reload the client.

### 3. Start the local probe server

```bash
cd spikes/phase1/local-probe
npm install
npm start
```

It listens only on:

```text
http://127.0.0.1:3001
```

### 4. Run the acceptance checks

Status:

```bash
curl http://127.0.0.1:3001/status
```

Snapshot:

```bash
curl http://127.0.0.1:3001/snapshot
```

Speak:

```bash
curl -X POST http://127.0.0.1:3001/speak \
  -H "content-type: application/json" \
  -d '{"text":"Testing the Pawn connection."}'
```

Move:

```bash
curl -X POST http://127.0.0.1:3001/move \
  -H "content-type: application/json" \
  -d '{"x":1000,"y":800}'
```

Recent conversation events:

```bash
curl http://127.0.0.1:3001/events
```

## What to verify manually

### Actor scope

- Use the Pawn's Actor UUID: commands work if the player owns it.
- Use an Actor the player does not own: the module refuses the operation.

### Actor state

`GET /snapshot` returns the assigned Actor's own system state plus current token/scene information.

### Conversation

Have another participant send a normal visible chat message.

The module should push a sanitized conversation event to the local probe server.

Private messages not visible to the current user must not be included.

### Speech

`POST /speak` should create a chat message using the Pawn as the speaker.

### Movement

`POST /move` should move the Pawn token using Foundry's normal TokenDocument movement path.

If Foundry rejects the move, the spike must report the failure rather than fabricating success.

## Evaluation rule

Score the candidate only on:

1. **Simplicity** — setup steps, extra components, configuration.
2. **Reliability** — ownership, reconnects, state/result accuracy.
3. **Role-playing responsiveness** — conversation latency and usable context.

Do not reward the candidate for having a broader API.

## Stop conditions

Do not turn this spike into production code.

Stop and record the result if any of these are true:

- the browser blocks the loopback connection in the target remote-hosting setup,
- player-level permissions cannot perform the required operations,
- conversation events are too delayed/unreliable for play,
- setup burden is clearly worse than another available player-level path.

If the candidate passes, Phase 2 can promote only the pieces that the evidence justifies.

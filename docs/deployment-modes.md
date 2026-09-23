# Deployment Modes

This project supports two deployment patterns. They share the same gateway and affordance concepts, but they do not need the same network plumbing.

## 1. Solo / local AI

Use this when Foundry and the AI tooling are running on the same computer or trusted local environment.

```text
AI / Pawn
  -> local gateway / existing local scripts
  -> FoundryGameAdapter
  -> local FoundryBridge
  -> Foundry VTT
```

No player-facing relay API key is required for this mode.

The local integration may use the existing MCP/module/bridge setup already available on the host machine. There is no reason to send local-only traffic out through the public player relay just to bring it back to the same Foundry instance.

## 2. Remote player with an AI Pawn

Use this only when a human player and their AI/Pawn are running on another computer over the internet.

The recommended permission model is:

1. The GM creates/configures the player's normal Foundry user.
2. That Foundry user receives control of the human PC Actor and the Pawn Actor.
3. The player receives a separate API key for the AI integration, scoped by the existing player-facing REST relay to that player's Foundry user and target world.
4. On the player's computer, the player selects which Actor UUID is the AI-controlled Pawn.
5. The local Pawn/player script uses the scoped relay key to read and act through the same Foundry permission boundary as that player.
6. Foundry remains authoritative about what that player can read or modify.

```text
REMOTE PLAYER COMPUTER

Human player
  -> normal Foundry access

AI / Pawn
  -> existing player/Pawn scripts
  -> PlayerRelayClient
  -> player-scoped API key
  -> existing Foundry REST relay
  -> Foundry user permissions
  -> selected Pawn Actor
```

The remote AI does not need a separate public MCP tunnel when the player-facing relay already provides the internet path.

## Actor ownership model

A player may control more than one Actor in Foundry.

Example:

```text
Foundry user: Player One
  OWNER -> Actor.PlayerOnePC
  OWNER -> Actor.PlayerOnePawn
```

The player's local configuration then selects:

```text
AI_ACTOR_UUID=Actor.PlayerOnePawn
```

The client selection does not grant permission. It only chooses from the Actors the scoped Foundry user is already allowed to control.

The server/relay/Foundry permission checks remain authoritative.

## Remote-player configuration

On the remote player's computer:

```text
FOUNDRY_RELAY_URL=https://<existing-player-relay>
FOUNDRY_RELAY_API_KEY=<player-scoped-integration-key>
AI_ACTOR_UUID=Actor.<pawn-id>
```

The API key should be scoped to the player's Foundry user and world by the relay. The client should not send user or world overrides to escape that scope.

A separate key for the AI integration is preferred over reusing another player utility's key so it can be revoked independently.

## Code path in this repository

The helper for remote-player scripts is:

```text
packages/adapters/foundry/src/player-relay-client.ts
```

It provides:

- `loadPlayerRelayConfig()`
- `PlayerRelayClient`
- automatic `x-api-key` attachment
- an assigned-Actor read through `/get?uuid=<AI_ACTOR_UUID>`
- a generic authenticated `request()` helper for existing player scripts

It deliberately does **not**:

- create new Foundry permissions
- impersonate another Foundry user
- send `clientId` or `userId` overrides
- expose a helper for arbitrary `execute-js`
- replace the gateway/affordance rules
- implement a full Pawn runner

## Existing player scripts

The current `main` branch of this repository does not contain the older player/Pawn runner scripts.

The plan is to **reuse those existing scripts rather than rewrite them**. When they are brought into this repository, they should call `PlayerRelayClient` for remote-player transport and keep their existing action logic above it.

For local/solo use, those same action scripts can continue using the local Foundry/MCP/bridge path without the relay.

## Shared action policy

Whether the Pawn is local or remote, the intended action model remains:

```text
AI chooses strategy
  -> legal affordance/action
  -> gateway/policy validation
  -> Foundry executes authoritative mechanics
```

The network route should not change the allowed action model.

For the first remote vertical slice, limit the Pawn to:

```text
combat.move
combat.attack
combat.wait
combat.end_turn
```

After that path is proven, add the remaining combat and world actions.

Do not use Assistant DM world mutations as the first remote integration test. Canonical reference checks still apply to `dm.*` actions.

## Implementation order

1. Keep the current mock-adapter tests passing.
2. Recover/import the existing player/Pawn scripts.
3. Make those scripts accept `FOUNDRY_RELAY_URL`, `FOUNDRY_RELAY_API_KEY`, and `AI_ACTOR_UUID`.
4. Use `PlayerRelayClient` as the remote transport helper.
5. Verify the selected Pawn Actor is readable through the scoped key.
6. Test one remote Pawn in a disposable world.
7. Test the combat slice: move, attack, wait, end turn.
8. Connect a real remote player.
9. Leave solo/local play on the local bridge path.

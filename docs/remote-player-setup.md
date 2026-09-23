# Remote Player + AI Pawn Setup

This guide is for a **human player on another computer** who wants an AI/Pawn to control one of the Foundry Actors that the same Foundry user is already allowed to control.

If you are running the AI and Foundry locally on the same machine, you do not need this relay setup. Use the local bridge/MCP path instead.

## What "piggybacking on the player's API" means

The AI does **not** take over the player's browser session and it does not remotely control PowerShell.

Instead, the AI runner uses the same existing player-facing Foundry REST relay that the player can use, but with a **separate integration API key** scoped to that player's Foundry user and world.

```text
REMOTE PLAYER COMPUTER

Human player
  -> normal Foundry browser connection

AI / Pawn runner
  -> same player-facing REST relay URL
  -> separate player-scoped API key
  -> same Foundry user permission boundary
  -> selected Pawn Actor
```

The relay/API key establishes which Foundry user/world the integration belongs to. Foundry permissions still decide which Actors that user may read or modify.

The player may therefore own both:

```text
Human PC Actor
Pawn Actor
```

and configure the AI runner to use only the Pawn Actor UUID.

## What the player needs from the GM

Give the player:

1. Normal access to the Foundry world.
2. Ownership/control of their human PC Actor.
3. Ownership/control of their Pawn Actor.
4. The existing player-facing relay URL.
5. A **separate API key for the AI integration**, scoped to that player's Foundry user and world.
6. The UUID of the Pawn Actor they want the AI to control.

Do not give a normal player a GM-scoped key.

## What runs on the player's computer

With the current plan, a small local **Pawn runner** runs on the player's computer.

That runner is responsible for:

- talking to the AI/model,
- asking Foundry for the current allowed state/actions,
- translating the AI's selected action into the approved Foundry API call,
- using the player's scoped relay key,
- keeping the AI assigned to the configured Pawn Actor.

The PowerShell window is only one way to **start** that runner.

```text
PowerShell
  -> starts local Pawn runner
  -> Pawn runner talks HTTPS to the relay
  -> relay talks to Foundry
```

No one on the internet gets PowerShell access.

Later, the same runner could be packaged as a desktop app, tray app, Windows service, or other background process. A visible shell is not an architectural requirement.

## Does a local shell have to be used?

**For the repository as planned today: yes, the simplest setup is a local Node process started from PowerShell.**

A shell is not required if the AI platform itself can securely call the player-scoped relay API and safely hold the player's integration key. In that design, the AI service could call the relay directly.

For this project, the safer default is to keep the player's relay key on the player's computer and let a local runner make the Foundry calls.

## Player configuration

The player's local environment needs only the remote-player values:

```env
FOUNDRY_RELAY_URL=INSERT_FOUNDRY_RELAY_URL_HERE
FOUNDRY_RELAY_API_KEY=INSERT_PLAYER_SCOPED_API_KEY_HERE
AI_ACTOR_UUID=INSERT_AI_ACTOR_UUID_HERE
```

The helper in this repository is:

```text
packages/adapters/foundry/src/player-relay-client.ts
```

It exports:

```text
loadPlayerRelayConfig()
PlayerRelayClient
```

The client attaches the scoped API key to relay requests and does not send `userId` or `clientId` overrides.

## First-time PowerShell setup

Once the player/Pawn runner is restored/imported into this repository, the intended setup is:

```powershell
git clone https://github.com/dahmonson-ux/Foundryvtt-mcp-hookup.git
cd Foundryvtt-mcp-hookup
npm install
Copy-Item .env.example .env
notepad .env
```

The player fills in only:

```env
FOUNDRY_RELAY_URL=...
FOUNDRY_RELAY_API_KEY=...
AI_ACTOR_UUID=Actor....
```

The exact Pawn-runner start command is **not documented yet because the older player/Pawn runner scripts are not currently present on `main`**. Do not invent a command such as `npm run pawn` until that runner is actually restored.

## Quick API-key/Actor check from PowerShell

Before involving the AI, the player can verify that the scoped key can see the selected Pawn Actor.

Set the three values for the current PowerShell session:

```powershell
$env:FOUNDRY_RELAY_URL = "https://YOUR-RELAY"
$env:FOUNDRY_RELAY_API_KEY = "YOUR-PLAYER-SCOPED-KEY"
$env:AI_ACTOR_UUID = "Actor.YOURPAWNACTORID"
```

Then test the assigned Actor:

```powershell
$headers = @{
  "x-api-key" = $env:FOUNDRY_RELAY_API_KEY
}

$uri = "$($env:FOUNDRY_RELAY_URL.TrimEnd('/'))/get?uuid=$([uri]::EscapeDataString($env:AI_ACTOR_UUID))"

Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
```

If the scoped key and Actor assignment are correct, the relay should return the Actor data the player's Foundry permissions allow.

If it fails, fix the player/API/Actor permission path **before** adding the AI.

## Runtime flow

Once the Pawn runner is available:

```text
1. Player starts Foundry normally.

2. Player starts the local Pawn runner.

3. Runner loads:
   FOUNDRY_RELAY_URL
   FOUNDRY_RELAY_API_KEY
   AI_ACTOR_UUID

4. Runner verifies the Pawn Actor is accessible.

5. AI requests current state/actions.

6. Runner presents only the allowed action surface.

7. AI selects an action.

8. Runner sends the approved API request through the player's scoped relay key.

9. Foundry applies the action if that user/Actor is permitted.

10. Runner reads the new state and continues.
```

## Permission model

Example:

```text
Foundry user: Alice

OWNER:
  Actor.AlicePC
  Actor.AlicePawn

Local AI configuration:
  AI_ACTOR_UUID=Actor.AlicePawn
```

`AI_ACTOR_UUID` does **not** grant permission. It only tells the local runner which Actor to use.

If Alice's Foundry user does not have permission to modify that Actor, the relay/Foundry path should reject the operation.

## Initial action scope

For the first remote test, keep the AI to:

```text
combat.move
combat.attack
combat.wait
combat.end_turn
```

Do not begin with Assistant DM world mutations or arbitrary JavaScript execution.

## Local/solo setup is different

When one person is running Foundry and the AI locally:

```text
AI
  -> local scripts / MCP
  -> local Foundry bridge
  -> Foundry
```

There is no reason to route that traffic through the public player relay.

See also:

- [deployment-modes.md](deployment-modes.md)
- [configuration-and-secrets.md](configuration-and-secrets.md)
- [transport-adapters.md](transport-adapters.md)

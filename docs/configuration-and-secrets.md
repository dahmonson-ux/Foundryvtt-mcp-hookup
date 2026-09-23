# Configuration and Secrets

This repository intentionally keeps credentials, browser sessions, machine paths, and private player data out of source control.

The important distinction is that **remote-player shared-controller mode does not copy Foundry authentication into the local MCP/Pawn runner**.

## Solo / local mode

A custom local gateway/server may use:

```text
GATEWAY_HOST
GATEWAY_PORT
GATEWAY_LOG_LEVEL
GATEWAY_AUTH_SECRET
FOUNDRY_BASE_URL
FOUNDRY_BRIDGE_SECRET
```

Only provide values actually required by your local bridge/server implementation.

`GATEWAY_AUTH_SECRET` is required by the reference `loadGatewayConfig()` loader.

## Remote-player shared-controller mode

The player is already authenticated to the remote Foundry world in their browser.

The local AI bridge should **not** require:

```text
Foundry password
Foundry API key
browser cookie
session token
GM credential
remote relay token
```

Authentication remains in the browser.

The player-specific bridge configuration is:

```text
AI_ACTOR_UUID=Actor.<pawn>
```

The planned local companion endpoint is:

```text
PLAYER_CLIENT_BRIDGE_HOST=127.0.0.1
PLAYER_CLIENT_BRIDGE_PORT=3001
```

Those host/port values describe the future local transport. The current `PlayerClientBridge` code is transport-agnostic.

## Local pairing

The browser-side Foundry module and local MCP/Pawn runner should use an explicit local pairing handshake.

If the transport requires a temporary pairing secret, generate it at runtime rather than committing it to the repository.

Do not reuse the Foundry browser session credential as the pairing credential.

## Local setup

Copy:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Then replace only the values needed for your deployment.

Do not commit `.env`.

## What should never be committed

- passwords
- API keys
- bearer tokens
- browser cookies
- Foundry session tokens
- tunnel credentials
- private signing keys
- personally identifying player data
- private prompts or logs
- local usernames
- absolute filesystem paths
- private Foundry world paths
- temporary player-client pairing tokens

## Agent credentials

Custom server transports may use per-agent credentials:

```text
AGENT_X_API_KEY=INSERT_AGENT_X_API_KEY_HERE
AGENT_Y_API_KEY=INSERT_AGENT_Y_API_KEY_HERE
```

Those are optional transport-owned values.

They are **not** required for the preferred remote-player shared-controller path because the browser session already establishes the Foundry user and `AI_ACTOR_UUID` binds the AI to one controllable Actor.

## Placeholder behavior

The reference config loaders reject required values that still begin with `INSERT_`.

That prevents example placeholders from accidentally becoming deployment credentials.

## Production secrets

Where secrets are required, prefer process environment injection or a secret manager over plaintext files.

The player-client bridge should avoid needing Foundry secrets at all.

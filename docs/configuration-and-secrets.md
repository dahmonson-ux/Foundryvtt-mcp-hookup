# Configuration and Secrets

Configuration should remain minimal until a concrete connection implementation proves it needs additional values.

## Current reference settings

The example environment contains:

```text
GATEWAY_HOST
GATEWAY_PORT
GATEWAY_LOG_LEVEL
GATEWAY_AUTH_SECRET
AI_ACTOR_UUID
FOUNDRY_BASE_URL
FOUNDRY_BRIDGE_SECRET
```

Not every deployment needs every setting.

## Actor assignment

`AI_ACTOR_UUID` identifies the Pawn Actor for a runtime that chooses to configure Actor assignment through environment variables.

Actor assignment does not grant permission.

The chosen Foundry connection must still enforce player/Actor authority.

## Transport-specific configuration

The production remote-player transport is intentionally undecided.

Do not add speculative credential/tunnel/session configuration to the public template.

Add transport-specific values only after the connection spike proves they are required.

## Never commit

- passwords,
- API keys,
- bearer tokens,
- browser cookies/session tokens,
- tunnel credentials,
- private signing keys,
- temporary pairing credentials,
- personal player data,
- private prompts/chat logs,
- absolute local paths,
- private campaign exports.

## Character Profile data

Character Profiles may contain private player-authored material.

A deployment should decide whether profiles are:

- local files,
- Foundry data,
- application data,
- ephemeral session input.

Do not silently publish profile/backstory content.

## Placeholder behavior

Reference loaders may reject required values that still begin with `INSERT_` so examples cannot accidentally become live credentials.

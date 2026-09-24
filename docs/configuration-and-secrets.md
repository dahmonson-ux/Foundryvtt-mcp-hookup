# Configuration and Secrets

Humans and AI use separate Foundry identities and separate access paths.

## Human credentials

Human player credentials belong only to the human/player access route.

Do not copy human credentials into the AI configuration.

## AI credentials

The AI route uses Cloudflare MCP and a dedicated AI Foundry user.

The runtime may need configuration for:

- Cloudflare MCP connection/authentication,
- AI Foundry user identity,
- assigned Pawn Actor,
- gateway authentication,
- deployment-specific Foundry connection information.

Exact Cloudflare MCP environment-variable names should be added only when the real deployed MCP interface is known.

Do not invent placeholder protocol details that may not match the actual service.

## Current reference settings

The repository still contains generic gateway/development values such as:

```text
GATEWAY_HOST
GATEWAY_PORT
GATEWAY_LOG_LEVEL
GATEWAY_AUTH_SECRET
AI_ACTOR_UUID
FOUNDRY_BASE_URL
FOUNDRY_BRIDGE_SECRET
```

These are development/reference values, not a claim that the final Cloudflare MCP integration uses all of them.

## Actor assignment

`AI_ACTOR_UUID` identifies the intended Pawn Actor when that configuration style is used.

Actor assignment is not authorization.

Authorization comes from the dedicated AI Foundry user's actual permissions plus gateway scope checks.

## Never commit

- human passwords/API credentials,
- AI account credentials,
- Cloudflare tokens/secrets,
- bearer tokens,
- browser/session cookies,
- private signing keys,
- personal player data,
- private prompts/chat logs,
- absolute local paths,
- private campaign exports.

## Character Profile data

Character Profiles may contain private player-authored content.

Keep profile/backstory storage explicit and separate from credentials.

Do not silently publish it in source control or logs.

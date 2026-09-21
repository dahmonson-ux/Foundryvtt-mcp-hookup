# Configuration and Secrets

This repository intentionally contains placeholders instead of personal credentials, passwords, tokens, machine paths, or private network details.

## Rule

If a value is private, machine-specific, deployment-specific, or security-sensitive, the public repository should contain only a clearly named placeholder such as:

```text
INSERT_GATEWAY_AUTH_SECRET_HERE
INSERT_AGENT_X_API_KEY_HERE
INSERT_FOUNDRY_BASE_URL_HERE
INSERT_FOUNDRY_BRIDGE_SECRET_HERE
INSERT_REMOTE_GATEWAY_URL_HERE
INSERT_REMOTE_GATEWAY_TOKEN_HERE
```

Real values belong in a local `.env` file or a deployment secret manager.

## Local setup

Copy:

```bash
cp .env.example .env
```

Then replace only the values needed for your deployment.

Do not commit `.env`.

## What should never be committed

- passwords
- API keys
- bearer tokens
- tunnel credentials
- session cookies
- private signing keys
- personally identifying player data
- private prompts or logs
- local usernames
- absolute filesystem paths
- private Foundry world paths
- machine-specific addresses that are not intentionally public

## Required vs optional

`GATEWAY_AUTH_SECRET` is required by the reference configuration loader.

Other values are optional until the relevant transport or Foundry bridge implementation needs them.

The loader rejects unchanged `INSERT_...` placeholders for required values so an example secret cannot accidentally become a real deployment secret.

## Agent credentials

Per-agent keys should be unique and revocable. For example:

```text
AGENT_X_API_KEY=INSERT_AGENT_X_API_KEY_HERE
AGENT_Y_API_KEY=INSERT_AGENT_Y_API_KEY_HERE
AGENT_Z_API_KEY=INSERT_AGENT_Z_API_KEY_HERE
```

Do not hard-code these into source files.

## Deployment secrets

Production deployments should preferably inject secrets through the hosting environment or a secret manager rather than storing them in plaintext files.

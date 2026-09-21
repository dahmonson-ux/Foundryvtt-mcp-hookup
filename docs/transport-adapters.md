# Transport Adapters

REST, MCP, WebSocket, and future transports should be thin adapters over the same gateway core.

## Rule

Transport code must not implement game strategy or a separate legality engine.

```text
REST ---------\
MCP -----------+--> GatewayCore --> Resolver --> Foundry adapter
WebSocket ----/
```

## REST

A REST adapter can map the core operations to a small surface such as:

```text
GET  /v1/agents/:agentId/actions
POST /v1/actions/:actionId/execute
POST /v1/actions/propose
POST /v1/actions/:commandId/reconcile
```

The authenticated credential, not an untrusted request body, should establish the caller's agent identity.

## MCP

Expose the same four operations as MCP tools. Do not generate one MCP tool per spell, weapon, combat maneuver, or world action.

Recommended MCP tools:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

The model sees action affordances as structured data and chooses an `action_id`.

## WebSocket

WebSocket is primarily useful for ordered event delivery:

- turn started
- state changed
- action result
- actor changed
- combat ended
- approval requested/resolved

Events should include sequence and state version. Clients reconnect with a resume cursor. If retained history cannot fill a sequence gap, request a fresh snapshot.

## Authentication

Each transport is responsible for authenticating the caller before invoking the core gateway. The core should receive a verified identity rather than treating a claimed `agent_id` as proof of identity.

For remote deployments, use an authenticated encrypted tunnel or reverse proxy. Do not expose an unauthenticated local development port directly to the internet.

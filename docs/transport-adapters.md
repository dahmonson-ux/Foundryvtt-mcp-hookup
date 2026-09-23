# Transport Adapters

REST, MCP, WebSocket, and future transports should stay thin over the same gateway core.

## Rule

Transport code must not implement game strategy or a separate legality engine.

```text
REST ---------\
MCP -----------+--> GatewayCore --> Resolver --> Foundry adapter
WebSocket ----/
```

## MCP

Expose the same four gateway operations:

```text
get_available_actions
execute_action
propose_action
reconcile_action
```

Do not generate one MCP tool per spell, weapon, maneuver, or world action.

The model receives structured affordances and selects an `action_id`.

## REST

A custom REST adapter can map the core operations to a small surface such as:

```text
GET  /v1/agents/:agentId/actions
POST /v1/actions/:actionId/execute
POST /v1/actions/propose
POST /v1/actions/:commandId/reconcile
```

For custom remote deployments, authenticate the caller before invoking `GatewayCore`.

## Remote-player mode is different

The preferred remote-player architecture does **not** expose the local MCP server to the internet.

The player is already connected to the remote Foundry world through their browser.

```text
AI
  -> local MCP
  -> PlayerClientBridge
  -> local PlayerClientTransport
  -> player-side Foundry module
  -> authenticated browser session
  -> remote Foundry server
```

The internet-facing Foundry connection belongs to the browser, not the MCP server.

## PlayerClientTransport

`PlayerClientTransport` is the local companion transport between:

- the local MCP/Pawn runner,
- the player-side Foundry module running in the browser.

It must remain local-only.

The exact technology is intentionally not fixed yet. It may be a localhost WebSocket or another browser-compatible IPC mechanism.

Requirements:

- bind only to loopback,
- use an explicit pairing handshake,
- do not expose a public listener,
- do not copy browser credentials into the runner,
- carry only the bounded bridge message schema,
- support reconnect/session replacement,
- do not provide arbitrary JavaScript execution.

## Browser-side operations

The player-side Foundry module should implement:

```text
read_filtered_state
list_legal_actions
execute_action
reconcile_action
resolve_proposal
```

Those operations are internal to the bridge. The AI still sees the four gateway-level MCP operations.

## WebSocket/event delivery

WebSocket may still be useful for ordered local event delivery:

- turn started
- state changed
- action result
- actor changed
- combat ended
- approval requested/resolved

Events should include sequence and state version.

If a sequence gap cannot be recovered, request a fresh state snapshot.

## Authentication and identity

### Custom server mode

A custom public transport must authenticate the caller and supply a verified identity to the gateway.

### Player-client mode

The Foundry user identity comes from the already-authenticated browser client.

The local MCP identity is bound to `AI_ACTOR_UUID`.

The player-side module must verify that the current Foundry user can control that Actor before servicing bridge operations.

No Foundry password, API key, browser cookie, or session token should be exported to the MCP process.

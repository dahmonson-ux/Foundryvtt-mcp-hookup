import { describe, expect, it, vi } from "vitest";
import {
  loadPlayerRelayConfig,
  PlayerRelayClient
} from "./player-relay-client.js";

describe("loadPlayerRelayConfig", () => {
  it("loads remote-player values without affecting local mode", () => {
    expect(
      loadPlayerRelayConfig({
        FOUNDRY_RELAY_URL: "https://relay.example/",
        FOUNDRY_RELAY_API_KEY: "player-key",
        AI_ACTOR_UUID: "Actor.pawn123"
      })
    ).toEqual({
      baseUrl: "https://relay.example/",
      apiKey: "player-key",
      actorUuid: "Actor.pawn123"
    });
  });
});

describe("PlayerRelayClient", () => {
  it("uses the scoped API key and assigned actor UUID", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ name: "Pawn" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    ) as unknown as typeof fetch;

    const client = new PlayerRelayClient({
      baseUrl: "https://relay.example",
      apiKey: "player-key",
      actorUuid: "Actor.pawn123",
      fetchImpl
    });

    await client.getAssignedActor();

    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [input, init] = fetchImpl.mock.calls[0]!;
    const url = input instanceof URL ? input : new URL(String(input));
    const headers = new Headers(init?.headers);

    expect(url.pathname).toBe("/get");
    expect(url.searchParams.get("uuid")).toBe("Actor.pawn123");
    expect(headers.get("x-api-key")).toBe("player-key");
    expect(url.searchParams.has("userId")).toBe(false);
    expect(url.searchParams.has("clientId")).toBe(false);
  });
});

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
    let capturedUrl: URL | undefined;
    let capturedInit: RequestInit | undefined;

    const fetchMock: typeof fetch = vi.fn(async (input, init) => {
      capturedUrl = input instanceof URL ? input : new URL(String(input));
      capturedInit = init;

      return new Response(JSON.stringify({ name: "Pawn" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });

    const client = new PlayerRelayClient({
      baseUrl: "https://relay.example",
      apiKey: "player-key",
      actorUuid: "Actor.pawn123",
      fetchImpl: fetchMock
    });

    await client.getAssignedActor();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(capturedUrl).toBeDefined();

    const headers = new Headers(capturedInit?.headers);

    expect(capturedUrl!.pathname).toBe("/get");
    expect(capturedUrl!.searchParams.get("uuid")).toBe("Actor.pawn123");
    expect(headers.get("x-api-key")).toBe("player-key");
    expect(capturedUrl!.searchParams.has("userId")).toBe(false);
    expect(capturedUrl!.searchParams.has("clientId")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { loadGatewayConfig } from "./config.js";

describe("loadGatewayConfig", () => {
  it("rejects a missing gateway secret", () => {
    expect(() => loadGatewayConfig({})).toThrow(
      "Missing required environment variable: GATEWAY_AUTH_SECRET"
    );
  });

  it("rejects an unchanged INSERT placeholder", () => {
    expect(() =>
      loadGatewayConfig({
        GATEWAY_AUTH_SECRET: "INSERT_GATEWAY_AUTH_SECRET_HERE"
      })
    ).toThrow("still contains an example placeholder");
  });

  it("accepts local secrets without exposing them elsewhere", () => {
    const config = loadGatewayConfig({
      GATEWAY_AUTH_SECRET: "local-test-secret",
      GATEWAY_PORT: "3001",
      FOUNDRY_BASE_URL: "http://127.0.0.1:30000"
    });

    expect(config.authSecret).toBe("local-test-secret");
    expect(config.port).toBe(3001);
    expect(config.foundryBaseUrl).toBe("http://127.0.0.1:30000");
  });
});

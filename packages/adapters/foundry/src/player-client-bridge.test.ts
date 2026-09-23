import { describe, expect, it } from "vitest";
import type {
  ActionAffordance,
  AgentIdentity,
  VisibleState
} from "@foundry-ai-gateway/contracts";
import {
  loadPlayerClientBridgeConfig,
  PlayerClientBridge,
  type PlayerClientRequest,
  type PlayerClientSession,
  type PlayerClientTransport
} from "./player-client-bridge.js";

class RecordingTransport implements PlayerClientTransport {
  readonly requests: PlayerClientRequest[] = [];

  constructor(private readonly session: PlayerClientSession) {}

  async getSession(): Promise<PlayerClientSession> {
    return structuredClone(this.session);
  }

  async request<T>(request: PlayerClientRequest): Promise<T> {
    this.requests.push(structuredClone(request));

    if (request.operation === "read_filtered_state") {
      return {
        stateVersion: 1,
        turnId: "turn_1",
        mode: "combat",
        data: { self: { actorId: request.actorId } }
      } as T;
    }

    if (request.operation === "list_legal_actions") {
      return [] as T;
    }

    if (request.operation === "execute_action") {
      return {
        status: "SUCCEEDED",
        stateVersionAfter: 2
      } as T;
    }

    if (request.operation === "reconcile_action") {
      return {
        status: "SUCCEEDED",
        stateVersionAfter: 2
      } as T;
    }

    return undefined as T;
  }
}

const identity: AgentIdentity = {
  agentId: "pawn_1",
  actorId: "Actor.pawn",
  policyVersion: 1,
  capabilities: [{ capability: "combat.*", scope: "self" }]
};

describe("loadPlayerClientBridgeConfig", () => {
  it("requires only the assigned AI Actor", () => {
    expect(
      loadPlayerClientBridgeConfig({
        AI_ACTOR_UUID: "Actor.pawn"
      })
    ).toEqual({
      actorId: "Actor.pawn"
    });
  });
});

describe("PlayerClientBridge", () => {
  it("uses the authenticated browser session instead of API credentials", async () => {
    const transport = new RecordingTransport({
      sessionId: "session_1",
      foundryUserId: "user_player",
      worldId: "world_1",
      controllableActorIds: ["Actor.pc", "Actor.pawn"]
    });

    const bridge = new PlayerClientBridge(transport, {
      actorId: "Actor.pawn"
    });

    const state = await bridge.readFilteredState(identity);

    expect(state.data).toEqual({
      self: { actorId: "Actor.pawn" }
    });
    expect(transport.requests).toEqual([
      {
        operation: "read_filtered_state",
        actorId: "Actor.pawn"
      }
    ]);
  });

  it("rejects an Actor the current Foundry user cannot control", async () => {
    const transport = new RecordingTransport({
      sessionId: "session_1",
      foundryUserId: "user_player",
      worldId: "world_1",
      controllableActorIds: ["Actor.pc"]
    });

    const bridge = new PlayerClientBridge(transport, {
      actorId: "Actor.pawn"
    });

    await expect(bridge.readFilteredState(identity)).rejects.toThrow(
      "Configured AI Actor is not controllable"
    );
  });

  it("rejects actions targeting a different Actor", async () => {
    const transport = new RecordingTransport({
      sessionId: "session_1",
      foundryUserId: "user_player",
      worldId: "world_1",
      controllableActorIds: ["Actor.pc", "Actor.pawn"]
    });

    const bridge = new PlayerClientBridge(transport, {
      actorId: "Actor.pawn"
    });

    const action: ActionAffordance = {
      actionId: "act_1",
      contractVersion: 1,
      type: "combat.wait",
      actorId: "Actor.pc",
      stateVersion: 1,
      expiresAtStateVersion: 1
    };

    await expect(
      bridge.executeAction(identity, action, "cmd_1", "idem_1")
    ).rejects.toThrow("Action is not scoped to the configured AI Actor.");
  });

  it("passes current state to the browser-side legal-action resolver", async () => {
    const transport = new RecordingTransport({
      sessionId: "session_1",
      foundryUserId: "user_player",
      worldId: "world_1",
      controllableActorIds: ["Actor.pawn"]
    });

    const bridge = new PlayerClientBridge(transport, {
      actorId: "Actor.pawn"
    });

    const state: VisibleState = {
      stateVersion: 7,
      turnId: "turn_7",
      mode: "combat",
      data: {}
    };

    await bridge.listLegalActions(identity, state);

    expect(transport.requests.at(-1)).toEqual({
      operation: "list_legal_actions",
      actorId: "Actor.pawn",
      state
    });
  });
});

import { describe, expect, it } from "vitest";
import { DefaultAffordanceResolver } from "@foundry-ai-gateway/affordances";
import type { AgentIdentity } from "@foundry-ai-gateway/contracts";
import {
  MockGameAdapter,
  StaticIdentityProvider
} from "@foundry-ai-gateway/adapter-mock";
import { InMemoryActionLedger } from "@foundry-ai-gateway/ledger";
import { GatewayCore } from "./gateway.js";

function identity(): AgentIdentity {
  return {
    agentId: "agent_x",
    actorId: "actor_pawn",
    policyVersion: 1,
    capabilities: [{ capability: "combat.*", scope: "self" }]
  };
}

function createHarness() {
  const adapter = new MockGameAdapter();
  const ledger = new InMemoryActionLedger();
  const gateway = new GatewayCore({
    identityProvider: new StaticIdentityProvider([identity()]),
    adapter,
    resolver: new DefaultAffordanceResolver(),
    ledger
  });

  return { gateway, adapter, ledger };
}

describe("GatewayCore vertical slice", () => {
  it("returns only state-bound first-slice affordances", async () => {
    const { gateway } = createHarness();

    const available = await gateway.getAvailableActions("agent_x");

    expect(available.state.stateVersion).toBe(1);
    expect(available.actions.map((action) => action.type)).toEqual([
      "combat.move",
      "combat.attack",
      "combat.cast_spell",
      "combat.use_ability",
      "combat.speak",
      "combat.wait",
      "combat.end_turn"
    ]);

    for (const action of available.actions) {
      expect(action.stateVersion).toBe(1);
      expect(action.expiresAtStateVersion).toBe(1);
      expect(action.actorId).toBe("actor_pawn");
    }
  });

  it("executes an offered action and suppresses an exact duplicate", async () => {
    const { gateway, adapter, ledger } = createHarness();
    const available = await gateway.getAvailableActions("agent_x");
    const attack = available.actions.find(
      (action) => action.type === "combat.attack"
    )!;

    const first = await gateway.executeAction({
      agentId: "agent_x",
      actionId: attack.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_attack_1",
      rationale: { summary: "Protect the nearby ally." }
    });

    const duplicate = await gateway.executeAction({
      agentId: "agent_x",
      actionId: attack.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_attack_1",
      rationale: { summary: "Protect the nearby ally." }
    });

    expect(first.status).toBe("SUCCEEDED");
    expect(duplicate.status).toBe("SUCCEEDED");
    expect(duplicate.duplicateOfCommandId).toBe(first.commandId);
    expect(adapter.executionCount).toBe(1);

    const records = await ledger.all();
    expect(records.some((record) => record.status === "DUPLICATE_SUPPRESSED")).toBe(true);
  });

  it("rejects a stale affordance after external state changes", async () => {
    const { gateway, adapter } = createHarness();
    const available = await gateway.getAvailableActions("agent_x");
    const move = available.actions.find(
      (action) => action.type === "combat.move"
    )!;

    adapter.simulateExternalChange();

    const result = await gateway.executeAction({
      agentId: "agent_x",
      actionId: move.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_stale_1"
    });

    expect(result.status).toBe("REJECTED");
    expect(result.code).toBe("STALE_STATE");
    expect(adapter.executionCount).toBe(0);
  });

  it("does not execute an action ID that was never offered", async () => {
    const { gateway, adapter } = createHarness();

    const result = await gateway.executeAction({
      agentId: "agent_x",
      actionId: "act_guessed_hidden_target",
      stateVersion: 1,
      idempotencyKey: "idem_hidden_1"
    });

    expect(result.status).toBe("REJECTED");
    expect(result.code).toBe("ACTION_NOT_OFFERED");
    expect(result.message).not.toContain("hostile");
    expect(adapter.executionCount).toBe(0);
  });

  it("marks uncertain execution UNKNOWN and reconciles without replay", async () => {
    const { gateway, adapter, ledger } = createHarness();
    const available = await gateway.getAvailableActions("agent_x");
    const attack = available.actions.find(
      (action) => action.type === "combat.attack"
    )!;

    adapter.setUnknownNextExecution();

    const uncertain = await gateway.executeAction({
      agentId: "agent_x",
      actionId: attack.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_unknown_1"
    });

    expect(uncertain.status).toBe("UNKNOWN");
    expect(adapter.executionCount).toBe(1);

    const retry = await gateway.executeAction({
      agentId: "agent_x",
      actionId: attack.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_unknown_1"
    });

    expect(retry.status).toBe("UNKNOWN");
    expect(adapter.executionCount).toBe(1);

    const reconciled = await gateway.reconcileAction(
      uncertain.commandId,
      "idem_unknown_1"
    );

    expect(reconciled.status).toBe("SUCCEEDED");
    expect(reconciled.result?.status).toBe("SUCCEEDED");
    expect(adapter.executionCount).toBe(1);

    const records = await ledger.all();
    expect(records.some((record) => record.status === "RECONCILED")).toBe(true);
  });

  it("rejects reuse of an idempotency key for a different request", async () => {
    const { gateway, adapter } = createHarness();
    const available = await gateway.getAvailableActions("agent_x");

    const move = available.actions.find((action) => action.type === "combat.move")!;
    const speak = available.actions.find((action) => action.type === "combat.speak")!;

    const first = await gateway.executeAction({
      agentId: "agent_x",
      actionId: move.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_reuse_1"
    });

    expect(first.status).toBe("SUCCEEDED");

    const second = await gateway.executeAction({
      agentId: "agent_x",
      actionId: speak.actionId,
      stateVersion: available.state.stateVersion,
      idempotencyKey: "idem_reuse_1"
    });

    expect(second.status).toBe("REJECTED");
    expect(second.code).toBe("IDEMPOTENCY_KEY_REUSED");
    expect(adapter.executionCount).toBe(1);
  });
});

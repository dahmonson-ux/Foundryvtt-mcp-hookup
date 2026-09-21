import type {
  ActionAffordance,
  AgentIdentity,
  CommandId,
  IdempotencyKey
} from "@foundry-ai-gateway/contracts";
import type { AdapterExecutionResult } from "@foundry-ai-gateway/gateway";
import type { FoundryBridge } from "./types.js";

/**
 * Thin helper that keeps execution delegated to the injected Foundry bridge.
 * The bridge is responsible for the final authoritative legality check and for
 * preserving idempotency/reconciliation evidence across transport uncertainty.
 */
export async function executeFoundryAffordance(
  bridge: FoundryBridge,
  identity: AgentIdentity,
  action: ActionAffordance,
  commandId: CommandId,
  idempotencyKey: IdempotencyKey
): Promise<AdapterExecutionResult> {
  return bridge.executeAction(identity, action, commandId, idempotencyKey);
}

import type { ActionResult } from "@foundry-ai-gateway/contracts";

export function needsReconciliation(result: ActionResult): boolean {
  return result.status === "UNKNOWN";
}

export function isTerminalResult(result: ActionResult): boolean {
  return ["SUCCEEDED", "REJECTED", "FAILED"].includes(result.status);
}

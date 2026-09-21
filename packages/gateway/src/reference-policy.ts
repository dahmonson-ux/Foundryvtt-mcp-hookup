import type {
  ActionAffordance,
  GatewayDecision
} from "@foundry-ai-gateway/contracts";

/**
 * Read-only inspection/planning affordances may operate without a canon
 * reference because they do not mutate world state. All other dm.* actions
 * must carry at least one trusted canonical reference produced by the
 * resolver/reference layer.
 */
export function requiresCanonicalReference(type: string): boolean {
  if (!type.startsWith("dm.")) return false;
  if (type.startsWith("dm.inspect.")) return false;
  if (type.startsWith("dm.plan.")) return false;
  return true;
}

export function validateCanonicalReferences(
  action: ActionAffordance
): GatewayDecision {
  if (!requiresCanonicalReference(action.type)) {
    return { allowed: true };
  }

  const references = action.references ?? [];

  if (references.length === 0) {
    return {
      allowed: false,
      code: "CANONICAL_REFERENCE_REQUIRED",
      reason:
        "DM world mutations require at least one canonical reference."
    };
  }

  if (references.some((reference) => reference.canonical !== true)) {
    return {
      allowed: false,
      code: "NONCANONICAL_REFERENCE",
      reason:
        "A DM mutation included a reference that was not validated as canonical."
    };
  }

  return { allowed: true };
}

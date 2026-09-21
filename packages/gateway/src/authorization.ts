import type {
  ActionAffordance,
  AgentIdentity,
  GatewayDecision
} from "@foundry-ai-gateway/contracts";

function normalizedCapability(type: string): string {
  if (!type.startsWith("conditional.")) return type;
  return `combat.${type.slice("conditional.".length)}`;
}

export class CapabilityAuthorizer {
  authorize(identity: AgentIdentity, action: ActionAffordance): GatewayDecision {
    if (action.actorId !== identity.actorId) {
      return {
        allowed: false,
        code: "ACTOR_SCOPE_DENIED",
        reason: "The action is not scoped to this actor.",
        policyVersion: identity.policyVersion
      };
    }

    const needed = normalizedCapability(action.type);
    const [family] = needed.split(".");

    const rule = identity.capabilities.find((capability) =>
      capability.capability === "*" ||
      capability.capability === needed ||
      capability.capability === `${family}.*`
    );

    if (!rule) {
      return {
        allowed: false,
        code: "CAPABILITY_DENIED",
        reason: "The capability policy does not permit this action.",
        policyVersion: identity.policyVersion
      };
    }

    if (action.approval?.required || rule.requiresApproval) {
      return {
        allowed: true,
        code: "APPROVAL_REQUIRED",
        reason: action.approval?.reason ?? "Table policy requires approval.",
        policyVersion: identity.policyVersion
      };
    }

    return {
      allowed: true,
      policyVersion: identity.policyVersion
    };
  }
}

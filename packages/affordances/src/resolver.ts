import type {
  ActionAffordance,
  AgentIdentity,
  VisibleState
} from "@foundry-ai-gateway/contracts";

export interface AffordanceResolver {
  resolve(
    identity: AgentIdentity,
    state: VisibleState,
    candidates: readonly ActionAffordance[]
  ): ActionAffordance[];
}

function capabilityForAction(type: string): string {
  const [family, verb] = type.split(".");
  if (!family || !verb) return type;

  if (family === "conditional") {
    return `combat.${verb}`;
  }

  return type;
}

function capabilityMatches(identity: AgentIdentity, action: ActionAffordance): boolean {
  const required = capabilityForAction(action.type);

  return identity.capabilities.some((rule) => {
    if (rule.capability === "*" || rule.capability === required) return true;

    const [requiredFamily] = required.split(".");
    return rule.capability === `${requiredFamily}.*`;
  });
}

export class DefaultAffordanceResolver implements AffordanceResolver {
  resolve(
    identity: AgentIdentity,
    state: VisibleState,
    candidates: readonly ActionAffordance[]
  ): ActionAffordance[] {
    return candidates
      .filter((action) => action.actorId === identity.actorId)
      .filter((action) => action.stateVersion === state.stateVersion)
      .filter((action) => action.expiresAtStateVersion === state.stateVersion)
      .filter((action) => !action.turnId || action.turnId === state.turnId)
      .filter((action) => capabilityMatches(identity, action))
      .map((action) => ({
        ...action,
        contractVersion: action.contractVersion || 1
      }));
  }
}

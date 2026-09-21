import type { Consequence } from "@foundry-ai-gateway/contracts";

export interface FoundryConsequenceInput {
  type: string;
  data?: Record<string, unknown>;
}

/**
 * Consequences describe what Foundry resolved. They are not strategic
 * affordances offered to the AI.
 */
export function mapConsequences(
  inputs: readonly FoundryConsequenceInput[]
): Consequence[] {
  return inputs.map((input) => ({
    type: input.type,
    data: input.data
  }));
}

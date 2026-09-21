import { describe, expect, it } from "vitest";
import type { ActionAffordance } from "@foundry-ai-gateway/contracts";
import {
  requiresCanonicalReference,
  validateCanonicalReferences
} from "./reference-policy.js";

function action(
  type: string,
  references?: ActionAffordance["references"]
): ActionAffordance {
  return {
    actionId: "act_test",
    contractVersion: 1,
    type,
    actorId: "assistant_dm",
    stateVersion: 1,
    expiresAtStateVersion: 1,
    references
  };
}

describe("Assistant DM canonical reference policy", () => {
  it("requires references for DM world mutations", () => {
    expect(requiresCanonicalReference("dm.build.wall_create")).toBe(true);

    const decision = validateCanonicalReferences(
      action("dm.build.wall_create")
    );

    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("CANONICAL_REFERENCE_REQUIRED");
  });

  it("allows a grounded DM mutation", () => {
    const decision = validateCanonicalReferences(
      action("dm.build.wall_create", [
        {
          referenceId: "ref_map_1",
          sourceType: "campaign_document",
          sourceId: "campaign_map",
          locator: "Dungeon level 1",
          authority: "campaign-canon",
          canonical: true
        }
      ])
    );

    expect(decision.allowed).toBe(true);
  });

  it("does not require canon references for read-only inspection/planning", () => {
    expect(validateCanonicalReferences(action("dm.inspect.scene")).allowed).toBe(true);
    expect(validateCanonicalReferences(action("dm.plan.build")).allowed).toBe(true);
  });

  it("does not apply the DM canon rule to Pawn actions", () => {
    expect(validateCanonicalReferences(action("combat.attack")).allowed).toBe(true);
  });
});

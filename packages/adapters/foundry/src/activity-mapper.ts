export type FoundryActivityFamily =
  | "attack"
  | "cast"
  | "check"
  | "damage"
  | "enchant"
  | "forward"
  | "heal"
  | "save"
  | "summon"
  | "teleport"
  | "transform"
  | "utility"
  | "use"
  | "movement"
  | "communication"
  | "system";

export interface ActivityMapping {
  family: FoundryActivityFamily;
  note?: string;
}

/**
 * This is a semantic mapping only. Exact Foundry/dnd5e API calls belong in
 * the bridge implementation and may vary by system version.
 */
export function mapAffordanceType(type: string): ActivityMapping {
  if (type === "combat.attack") return { family: "attack" };

  if (type === "combat.grapple" || type === "combat.shove") {
    return {
      family: "attack",
      note: "Resolve through the applicable Unarmed Strike/activity mechanics."
    };
  }

  if (type.endsWith(".cast_spell") || type === "conditional.cast_reaction_spell") {
    return { family: "cast" };
  }

  if (type.includes("summon")) return { family: "summon" };
  if (type.includes("teleport")) return { family: "teleport" };
  if (type.includes("transform")) return { family: "transform" };
  if (type.includes("heal")) return { family: "heal" };

  if (
    type.includes(".move") ||
    type.includes(".dash") ||
    type.includes(".mount") ||
    type.includes(".dismount") ||
    type.includes(".jump") ||
    type.includes(".climb") ||
    type.includes(".swim") ||
    type.includes(".crawl") ||
    type.includes(".fly") ||
    type.includes(".burrow")
  ) {
    return { family: "movement" };
  }

  if (
    type.includes(".speak") ||
    type.includes(".whisper") ||
    type.includes(".ask_") ||
    type.includes(".answer")
  ) {
    return { family: "communication" };
  }

  if (type.includes(".use_item") || type.includes(".utilize")) {
    return { family: "use" };
  }

  if (type.includes(".search") || type.includes(".study") || type.includes(".investigate")) {
    return { family: "check" };
  }

  return { family: "utility" };
}

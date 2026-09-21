export const CONDITIONAL_AFFORDANCE_TYPES = [
  "conditional.bonus_action",
  "conditional.reaction",
  "conditional.opportunity_attack",
  "conditional.readied_reaction",
  "conditional.feature_reaction",
  "conditional.extra_attack",
  "conditional.offhand_attack",
  "conditional.weapon_mastery_choice",
  "conditional.cast_reaction_spell",
  "conditional.use_reaction_ability",
  "conditional.decline_reaction",
  "conditional.teleport",
  "conditional.summon",
  "conditional.transform",
  "conditional.heal",
  "conditional.select_target",
  "conditional.select_area",
  "conditional.select_spell_level",
  "conditional.select_damage_type",
  "conditional.select_mode"
] as const;

export type ConditionalAffordanceType =
  (typeof CONDITIONAL_AFFORDANCE_TYPES)[number];

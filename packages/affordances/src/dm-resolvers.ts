export const DM_AFFORDANCE_TYPES = [
  // Read-only inspection and planning.
  "dm.inspect.scene",
  "dm.inspect.selection",
  "dm.inspect.walls",
  "dm.inspect.lighting",
  "dm.inspect.tokens",
  "dm.inspect.modules",
  "dm.inspect.tags",
  "dm.plan.build",
  "dm.plan.encounter",

  // Scenes.
  "dm.scene.create",
  "dm.scene.update",
  "dm.scene.activate",
  "dm.scene.clone",

  // Basic scene construction.
  "dm.build.wall_create",
  "dm.build.wall_update",
  "dm.build.wall_delete",
  "dm.build.wall_chain_create",
  "dm.build.door_create",
  "dm.build.door_set_state",
  "dm.build.tile_place",
  "dm.build.tile_move",
  "dm.build.tile_resize",
  "dm.build.tile_hide",
  "dm.build.tile_delete",
  "dm.build.light_create",
  "dm.build.light_update",
  "dm.build.light_delete",
  "dm.build.sound_create",
  "dm.build.sound_update",
  "dm.build.sound_delete",
  "dm.build.region_create",
  "dm.build.region_update",
  "dm.build.region_delete",
  "dm.build.note_place",
  "dm.build.drawing_create",
  "dm.build.create_room",
  "dm.build.place_tiles",
  "dm.build.place_lights",
  "dm.build.populate_scene",
  "dm.build.clone_selection",
  "dm.build.delete_selection",

  // Content.
  "dm.content.journal_create",
  "dm.content.journal_update",
  "dm.content.actor_create",
  "dm.content.actor_update",
  "dm.content.item_create",
  "dm.content.rolltable_create",
  "dm.content.compendium_import",

  // Encounters.
  "dm.encounter.token_spawn",
  "dm.encounter.token_move",
  "dm.encounter.token_hide",
  "dm.encounter.token_reveal",
  "dm.encounter.create",
  "dm.encounter.start",
  "dm.encounter.end",
  "dm.encounter.loot_create",
  "dm.encounter.trap_create",
  "dm.encounter.ambush_create",

  // Tagger.
  "dm.module.tagger.add",
  "dm.module.tagger.remove",
  "dm.module.tagger.find",
  "dm.module.tagger.list",

  // Trigger automation.
  "dm.module.trigger.create",
  "dm.module.trigger.enable",
  "dm.module.trigger.disable",
  "dm.module.trigger.test",
  "dm.module.trigger.delete",

  // Glyph-style recipes.
  "dm.module.glyph.create_trigger",
  "dm.module.glyph.apply_recipe",
  "dm.module.glyph.run_trigger",

  // Loot and merchants.
  "dm.module.item_piles.create_loot",
  "dm.module.item_piles.create_container",
  "dm.module.item_piles.create_merchant",
  "dm.module.item_piles.add_items",
  "dm.module.item_piles.transfer_items",

  // Scene links.
  "dm.module.stairways.create",
  "dm.module.stairways.link",
  "dm.module.stairways.remove",

  // Visual/audio effects.
  "dm.module.sequencer.play_effect",
  "dm.module.sequencer.stop_effect",
  "dm.module.sequencer.play_sequence",
  "dm.module.fxmaster.weather_set",
  "dm.module.fxmaster.weather_clear",
  "dm.module.fxmaster.filter_set",
  "dm.module.fxmaster.filter_clear",
  "dm.module.scenery.list_variations",
  "dm.module.scenery.set_variation"
] as const;

export type DmAffordanceType = (typeof DM_AFFORDANCE_TYPES)[number];

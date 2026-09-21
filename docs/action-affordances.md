# Action Affordances

Affordances are resolver output. They are not separate public gateway endpoints.

## Common envelope

Every action should carry, as applicable:

- `action_id`: ephemeral identifier
- `contract_version`
- `type`
- `actor_id`
- `target_id`
- `ability_id`
- `item_id`
- destination or path parameters
- costs
- requirements
- visibility/scope metadata
- `state_version`
- `turn_id`
- `expires_at_state_version`
- optional approval metadata
- canonical references for Assistant DM world mutations

## Combat resolver families

### Movement

- `combat.move`
- `combat.stand`
- `combat.drop_prone`
- `combat.jump`
- `combat.climb`
- `combat.swim`
- `combat.crawl`
- `combat.fly`
- `combat.burrow`
- `combat.mount`
- `combat.dismount`

Movement, mounting, and dismounting consume movement resources as dictated by the game system. They are not automatically treated as normal Actions.

### Standard tactical actions

- `combat.dash`
- `combat.disengage`
- `combat.dodge`
- `combat.help`
- `combat.hide`
- `combat.search`
- `combat.study`
- `combat.influence`
- `combat.ready`
- `combat.utilize`
- `combat.interact`

### Attacks and contested actions

- `combat.attack`
- `combat.unarmed`
- `combat.grapple`
- `combat.shove`
- `combat.escape_grapple`
- `combat.release_grapple`

`combat.grapple` and `combat.shove` are convenient affordance types. Their mechanical implementation should route through the applicable Unarmed Strike/activity mechanics of the game system.

### Magic, features, and equipment

- `combat.cast_spell`
- `combat.use_ability`
- `combat.use_item`
- `combat.equip`
- `combat.unequip`

### Communication and autonomy

- `combat.speak`
- `combat.whisper`
- `combat.ask_human`
- `combat.wait`
- `combat.decline`
- `combat.end_turn`

### Catch-all

- `combat.improvise`

Improvised actions enter the proposal/resolution path and are resolved by the table/game system rather than by inventing a second rules engine in the gateway.

## Conditional combat resolver families

Emit these only when their trigger or resource makes them legal:

- `conditional.bonus_action`
- `conditional.reaction`
- `conditional.opportunity_attack`
- `conditional.readied_reaction`
- `conditional.feature_reaction`
- `conditional.extra_attack`
- `conditional.offhand_attack`
- `conditional.weapon_mastery_choice`
- `conditional.cast_reaction_spell`
- `conditional.use_reaction_ability`
- `conditional.decline_reaction`
- `conditional.teleport`
- `conditional.summon`
- `conditional.transform`
- `conditional.heal`
- `conditional.select_target`
- `conditional.select_area`
- `conditional.select_spell_level`
- `conditional.select_damage_type`
- `conditional.select_mode`

Selection affordances are useful when an action requires a second structured choice.

## World resolver families

### Movement, travel, and navigation

- `world.move`
- `world.follow`
- `world.stop`
- `world.jump`
- `world.climb`
- `world.swim`
- `world.crawl`
- `world.fly`
- `world.mount`
- `world.dismount`
- `world.travel`
- `world.follow_route`
- `world.navigate`
- `world.scout`
- `world.guard`

### Perception and investigation

- `world.observe`
- `world.search`
- `world.study`
- `world.investigate`
- `world.listen`
- `world.hide`

### Interaction, tools, and inventory

- `world.interact`
- `world.utilize`
- `world.use_tool`
- `world.pickup`
- `world.drop`
- `world.transfer_item`
- `world.equip`
- `world.unequip`
- `world.attune`
- `world.unattune`
- `world.use_item`

### Abilities and magic

- `world.cast_spell`
- `world.use_ability`
- `world.help`

### Social

- `world.influence`
- `world.speak`
- `world.ask_question`
- `world.answer`
- `world.whisper`
- `world.ask_human`

### Rest and ongoing activity

- `world.rest_short`
- `world.rest_long`
- `world.take_watch`
- `world.wait`
- `world.decline`
- `world.stop_activity`

### Catch-all

- `world.attempt_task`

This represents an open-ended task that the game system or GM resolves without adding a bespoke gateway endpoint.

## Consequences are not strategic affordances

The following are normally results of an action rather than choices:

- attack rolls
- damage rolls
- saving throws
- concentration checks
- death saves
- ability checks requested by the rules
- damage or healing application
- condition application/removal
- spell-slot consumption
- ammunition or item consumption
- feature-charge consumption
- initiative rolls
- effect creation/expiry

The agent chooses the intent. Foundry and the game-system adapter resolve the mechanics.

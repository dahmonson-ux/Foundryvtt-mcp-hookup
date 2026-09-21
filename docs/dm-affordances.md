# Assistant DM Affordances

Assistant DM functionality uses the same small public gateway contract as Pawn actions. The list below belongs in the affordance/resolver layer, not in the public REST/MCP surface.

All world-mutating `dm.*` affordances require canonical references. See [canonical-reference-policy.md](canonical-reference-policy.md).

## Inspection and planning

Read-only:

- `dm.inspect.scene`
- `dm.inspect.selection`
- `dm.inspect.walls`
- `dm.inspect.lighting`
- `dm.inspect.tokens`
- `dm.inspect.modules`
- `dm.inspect.tags`
- `dm.plan.build`
- `dm.plan.encounter`

## Scene and build

- `dm.scene.create`
- `dm.scene.update`
- `dm.scene.activate`
- `dm.scene.clone`
- wall, door, tile, light, sound, region, note, and drawing operations
- batch room/wall/tile/light/population operations

## Content

- journals
- actors
- items
- roll tables
- approved compendium imports

## Encounter management

- token spawn/move/hide/reveal
- encounter create/start/end
- loot
- traps
- ambushes

## Approved module families

The resolver may emit module-specific affordances for installed and approved modules, including:

- Tagger-style semantic tagging
- trigger/active-tile automation
- Glyph-style trigger recipes
- Item Piles-style loot, containers, and merchants
- Stairways-style scene links
- Sequencer-style effects
- FXMaster-style weather and filters
- Scenery-style scene variations

A module affordance still requires canonical grounding for any world mutation.

## Dangerous capabilities

Destructive or high-impact operations should remain separately scoped capabilities, for example:

- `assistant_dm.destructive`
- `assistant_dm.macro_execute`
- `assistant_dm.world_admin`

Canonical grounding does not replace authorization. A referenced action can still be denied because the Assistant DM lacks the required capability.

## First DM vertical slice

Start with:

```text
inspect scene
 -> resolve canonical references
 -> create walls/doors
 -> place lights
 -> spawn/tag tokens
 -> create trigger
 -> create loot
 -> verify resulting scene
 -> ledger records references used
```

# Canonical Reference Policy

Assistant DM automation must not invent world facts while mutating the game.

## Permanent rule

**Every Assistant DM action that changes world state must be grounded in at least one canonical reference.**

The Assistant DM may inspect or plan without a reference because those operations do not mutate the world. Execution of a mutation requires references that were resolved and marked canonical by trusted gateway/resolver code.

This rule applies to:

- scene creation and modification
- walls, doors, tiles, lights, sounds, regions, notes, and drawings
- actors, items, journals, tables, and compendium imports
- encounters, spawns, traps, ambushes, and loot
- module automation and module-generated content
- batch construction operations
- any future `dm.*` world-mutating affordance

## Valid canonical source types

A reference may point to:

- `gm_directive`: an explicit GM instruction recorded as a stable directive
- `campaign_document`: campaign bible, setting document, adventure notes, or other approved source
- `foundry_document`: an existing canonical Foundry scene, actor, item, journal, region, or related document
- `compendium`: an approved compendium entry
- `system_rule`: an approved game-system rule used for mechanics
- `module_definition`: approved module configuration or recipe definition
- `asset`: an approved map/image/audio asset used as construction reference
- `other`: another explicitly approved canonical source

## Reference shape

```json
{
  "referenceId": "ref_123",
  "sourceType": "campaign_document",
  "sourceId": "campaign_bible",
  "locator": "Bellwether > Old Mill > Cellar",
  "version": "7",
  "contentHash": "optional-hash",
  "authority": "campaign-canon",
  "canonical": true
}
```

The client must not be allowed to make something canonical merely by sending `"canonical": true`. References are created or validated by trusted resolver/reference code.

## Multiple references

A build may use several references:

```text
campaign map
+ canonical location description
+ existing Foundry scene
+ explicit GM directive
= grounded build affordance
```

The ledger should preserve the reference IDs used for each mutation so later audits can answer:

> Why does this wall, NPC, trap, merchant, or scene element exist?

## Missing canon

If no canonical reference supports a requested mutation, the Assistant DM has three safe choices:

1. inspect existing material,
2. create a non-executing plan/proposal,
3. ask the GM for a directive that can be recorded as canon.

It must not silently invent the missing fact and execute it.

## Explicit GM additions

The GM can create new canon.

For example:

> Add a blacksmith named Mara beside the east gate.

The system should record that instruction as a stable `gm_directive` reference. Once recorded, downstream scene, actor, journal, token, shop, and module operations may cite that directive.

This preserves creativity while making the source of new canon explicit.

## Mechanics vs lore

Mechanical execution may also cite system/module references when needed, but a rules citation does not by itself authorize new lore.

For example:

- a system rule can justify how a trap rolls damage;
- it cannot justify inventing that a trap exists in a canonical dungeon.

The existence of the trap needs a campaign/Foundry/GM reference.

# Action Affordances

Affordances are the legitimate game choices offered to the AI for the current state.

The AI should choose among actions actually offered by Foundry/the adapter rather than inventing IDs, targets, coordinates, or mechanical outcomes.

## Common envelope

An action may contain:

- `actionId`
- `contractVersion`
- `type`
- `actorId`
- `targetId`
- `abilityId`
- `itemId`
- destination/path parameters
- costs
- requirements
- scope metadata
- `stateVersion`
- `turnId`
- `expiresAtStateVersion`
- optional approval metadata

## First playable slice

Prioritize these before the larger taxonomy.

### Exploration / social

```text
world.follow
world.move
world.interact
world.speak
world.wait
```

### Combat

```text
combat.move
combat.attack
combat.cast_spell
combat.use_ability
combat.use_item
combat.speak
combat.wait
combat.end_turn
```

A connection implementation is not complete merely because these names exist. Each advertised action must have a tested Foundry-side execution path.

## Expanded combat vocabulary

The repository may support additional combat affordances after the first slice:

- stand/drop prone
- jump/climb/swim/crawl/fly
- dash/disengage/dodge/help/hide
- search/study/influence
- ready/interact/utilize
- unarmed/grapple/shove
- equipment changes
- whisper
- reactions/conditional follow-up choices

## Expanded world vocabulary

Later exploration affordances may include:

- travel/navigation
- scout/guard/observe/search/investigate/listen
- tool use
- inventory transfer/equipment
- rest/watch
- independent supported tasks

The Pawn Functional Contract determines the product meaning. The transport should not create a separate semantic vocabulary.

## Consequences are not strategic actions

Normally, the AI chooses the intent while Foundry resolves:

- attack rolls,
- damage rolls,
- saving throws,
- ability checks,
- concentration checks,
- healing/damage application,
- conditions,
- spell-slot consumption,
- ammunition/item consumption,
- initiative,
- effect creation/expiry.

Do not expose those as strategic choices unless the installed game system actually requires a player choice.

## Improvised actions

An unsupported action may use the proposal path.

A proposal should be resolved by Foundry/game-system/GM logic rather than by inventing a second rules engine in the gateway.

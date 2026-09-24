# Player Perspective

This project should feel like adding another player to the table, not adding another controller to the human player's session.

## Human player

From the human player's perspective:

1. Sign in through the normal human/player access route.
2. Open the Foundry world in the human player's own session/window.
3. Control the human character normally.
4. Talk to NPCs, move, roll, and take turns normally.
5. Give the Pawn instructions when useful.
6. Treat the Pawn as another character in the party.

The human player does not need to:

- share their Foundry login with the AI,
- share their Actor with the AI,
- proxy AI commands through the human session,
- choose every Pawn action.

## AI player

From the AI player's perspective:

1. Connect through Cloudflare MCP.
2. Authenticate as the dedicated AI Foundry account.
3. Access only the Pawn Actor that account is allowed to control.
4. Receive permitted Foundry state and relevant role-playing context.
5. Decide what the Pawn does according to Character Profile, instructions, and the current game situation.
6. Act through Foundry as the AI user.

## What both players share

They share:

- the same Foundry world,
- the same scene,
- the same combat,
- visible conversation,
- party events,
- consequences of each other's actions.

They do not share:

- login credentials,
- session ownership,
- Actor control,
- command channels.

## Town example

```text
Human window                              AI player
------------                              ---------
Human walks into tavern                  Pawn sees associated party context
Human talks to innkeeper                 Pawn receives relevant visible dialogue
Human asks about caravan                 AI interprets Character Profile
                                         Pawn may respond, ask, joke, or stay quiet
Human leaves tavern                      Pawn independently follows through AI route
```

## Combat example

```text
Human turn                               Pawn turn
----------                               ---------
Human chooses actions                    AI reads Pawn state/legal actions
Foundry resolves                         AI chooses as the character
Human ends turn                          Cloudflare MCP sends Pawn action
                                         Foundry resolves as AI user
                                         AI observes result
                                         Pawn ends turn
```

## Instructions are role-playing context

A human instruction such as:

> "Watch the door."

does not mean the human takes control of the Pawn.

It means the AI receives a current priority and decides how the Pawn carries it out within its own permissions and character.

## Character Profile

The Character Profile answers:

> Who is this Pawn?

The functional contract answers:

> What can this Pawn legitimately perceive and do?

Keeping those separate lets different Pawns behave differently while using the same game integration.

## Expected table experience

The ideal result is that a human player experiences the Pawn as:

- present,
- responsive,
- independently controlled,
- mechanically legitimate,
- consistent enough to feel like a character,
- autonomous enough to contribute without becoming a second GM.

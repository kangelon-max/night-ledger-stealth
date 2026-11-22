# NIGHT LEDGER

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/kangelon-max/night-ledger-stealth/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/kangelon-max/night-ledger-stealth/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

An original top-down stealth game. You are an infiltrator inside a vault office
complex at night. Slip past patrolling guards and their vision cones, hide
behind crates and walls, steal the 3 intel folders on each floor, and reach
the exit before anyone raises the alarm.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any static
file server). No network, no build step, no external assets — everything is
drawn and sounded in code.

- **WASD / arrow keys** — move
- **Shift** — crouch: slower and quieter, harder to spot
- Guards patrol waypoints and pause to look around. Their cones are blocked by
  walls and crates. Being seen fills the detection meter — break line of sight
  and it drains again. A full meter means you are caught and the floor restarts.
- The exit stays locked until all 3 intel folders on the floor are collected.
- 3 floors, then a win screen with your total time and times caught.

## Layout

- `main.ts` — the handoff program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with the kit's `buildDossier`.
- `game/` — the game itself: `index.html`, `style.css`, and `src/` modules
  (`main.js` boot/loop, `level.js` floors, `guards.js` patrol AI and vision
  cones, `player.js`, `render.js`, `audio.js`, `input.js`).
- `screenshots/` — real renders of the game, taken by its maker.
- `vendor/makefun-game.ts` — the make.fun kit library, unchanged.

MIT licensed — see `LICENSE`.

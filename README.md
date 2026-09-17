<p align="center">
  <img src="public/assets/ui/marquee.png" alt="SLAG CITY" width="560" />
</p>

<p align="center">
  <b>An original arcade beat-'em-up for the browser.</b><br />
  Insert coin. Find Kilvish. Make it answer.
</p>

<p align="center">
  <a href="https://slag-city.vercel.app"><b>▶ Play it — slag-city.vercel.app</b></a>
</p>

---

## The game

The invasion lasted seventeen minutes. The machines — the **Veydrons** — turned Earth to slag, and their warlord
**Kilvish** took everything you had. You crawl out of the rubble with a forge hammer and one word from a dying
drone: *harvest*.

One stage, a full coin-op loop: attract mode → insert coin → story intro → a side-scrolling brawl through the
foundry → a three-boss gauntlet (**Grist → Slagjaw → Kilvish**, each with a dialogue exchange) → the *End of
Chapter One* outro → hi-score entry. Desktop plays inside a simulated arcade cabinet; phones get a full-screen
layout with on-screen controls.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys / `WASD` | D-pad (8-way) |
| Attack · Jump · Special | `J` · `K` · `L` | `ATK` · `JUMP` · `SPEC` |
| Insert coin · Start | `5` · `Enter` | `COIN` · `START` |
| Advance story / dialogue | `J` (hold ~0.6 s to skip the intro) | `ATK` |
| CRT filter · Volume | `C` · `-` / `=` | — |

Gamepads work too. Coins are free — press `5` as often as you like.

## Run it locally

Requires **Node 22+**.

```bash
npm install
npm run dev        # Vite dev server
npm run check      # typecheck + lint + unit tests + production build (the gate)
npm run e2e        # Playwright: desktop smoke + mobile touch
npm run preview    # serve the production build on :4173
```

## How it's built

Phaser 3 + Vite + TypeScript, rendered at a fixed **384×224** and scaled up.

```
src/core/       pure, deterministic game logic — no Phaser, no DOM (lint-enforced)
src/adapters/   Phaser scenes, screens, views, input sources, audio
src/shell/      the page around the game: cabinet, viewport gate, touch controls, analytics, storage
test/           Vitest unit tests (core + shell) and Playwright e2e
tools/          art pipeline (sprite-sheet → atlas) and font builders
```

The simulation is deterministic: recorded input replays (the attract-mode demo is one) are hashed in tests, so
gameplay changes that alter behaviour show up as a failing golden rather than a surprise.

## Analytics (optional)

Anonymous Mixpanel events for one funnel — `Page Loaded → Game Started → Stage Cleared → Name Recorded`. It is
**off unless** `VITE_MIXPANEL_TOKEN` is set at build time (the SDK isn't even downloaded without it), and it
honours Do-Not-Track. Setup notes: [`docs/analytics/mixpanel-funnel.md`](docs/analytics/mixpanel-funnel.md).

## Project docs

- [`Design.md`](Design.md) — visual + interaction spec
- [`docs/build/LEDGER.md`](docs/build/LEDGER.md) — build log: what shipped, when, and why
- [`docs/legal/title-check.md`](docs/legal/title-check.md) — title/trademark notes

Art was generated with Higgsfield and processed through the repo's atlas pipeline; audio is synthesised in the
browser. All game content is original.

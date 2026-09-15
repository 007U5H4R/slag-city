# Ticket 18 — Coin-op machine (attract / continue / game-over) — gate evidence

**Date:** 2026-09-15 · **HEAD after 18.3:** see LEDGER · `npm run check` GREEN (38 files / 116 tests).

## What was verified

The full coin-op loop, driven through the **real input path** (CDP synthetic key events, `5` = coin,
`Enter` = start) against the running dev build at 1024×640. Coin/start are edge-triggered in
`GameScene.update`, so each key is **held ~150 ms** (a bare tap falls between 60 Hz frames and misses the
rising edge — the same hazard the shared gate driver documents). Death and boss-defeat are driven through
the **real sim path** (a grounded `knockdown` with `hp=0` resolves to `dead`→`heroDead` in `stun.ts`; boss
`hp=0` resolves to `bossDefeated`), never by poking the machine directly.

Driver: `/Volumes/E Drive/Dev/.scratch/slag-coinop-gate.mjs`.

## Probe trace (one continuous session)

| Stage | Action | `arcade.screen` | Key assertions |
|-------|--------|-----------------|----------------|
| A | boot | `ATTRACT` | credits 0, sim not ticking (hero frame 0) |
| B | coin (`5`) | `COIN` | credits 1 |
| C | start (`Enter`) | `PLAY` | credits 0, usedThisGame 1, world frame advancing |
| D | hold Right | `PLAY` | hero x 64 → 129 (sim ticks **only** in PLAY) |
| E | hero killed | `CONTINUE` | countdown running (547), hero hp 0, sim frozen |
| F | coin-continue (`5`) | `PLAY` | usedThisGame 2, hero **revived** hp 100, repositioned to camera.x+60 |
| G | killed + countdown forced to 0 | `GAME_OVER` | continue timeout ends the game |
| H | wait GAME_OVER_FRAMES | `ATTRACT` | usedThisGame reset to 0 (via HISCORE_ENTRY pass-through → entryDone) |
| I | fresh game → boss defeated | `GAME_OVER` | **1CC** (usedThisGame 1), `world.stage.bossDefeated` true |

**`CONSOLE_ERRORS=[]` across the entire loop.**

## Screen rendering (screenshots)

- `18-attract.png` — SLAG CITY title + blinking INSERT COIN.
- `18-coin.png` — after a coin (PRESS START state).
- `18-play.png` — in play, HUD visible, hero walking.
- `18-continue.png` — dim plate over the frozen hero, ×2 countdown digit, `INSERT COIN TO CONTINUE`, HUD still shown.
- `18-gameover.png` — `GAME OVER`.
- `18-stageclear.png` — `STAGE CLEAR` (GameOver screen with `stageClear` from `world.stage.bossDefeated`), boss box + phase-2 magenta stroke still on screen.

## Acceptance boxes (ticket 18 gate)

1. Boots to attract with INSERT COIN hard-blinking — ✓ (A + `18-attract.png`, `blinkOn` 40-frame duty).
2. Coin adds a credit and flashes; PRESS START appears — ✓ (B, `creditFlash`, `18-coin.png`).
3. Start consumes exactly one credit → play with CREDIT 0 — ✓ (C, credits 0 / used 1).
4. Death → dimmed continue countdown; coin resumes at full health in place — ✓ (E→F, hp 100, repositioned).
5. Countdown expiry → GAME OVER → back to attract — ✓ (G→H, usedThisGame reset).
6. Boss defeat → STAGE CLEAR, 1CC tracked — ✓ (I, used 1, bossDefeated).

Vitest covers the credit arithmetic, continue resume, and game-over path (`screen-machine.test.ts` 6 tests,
`session.test.ts` 1 test). Determinism golden `locomotion-01.json` **unchanged** (adapter-only ticket).

# Ticket 15 — Boss "the Foreman": verification

**Status: ✅ PASS** (orchestrator, owner-delegated 2026-09-15). HEAD `0ea9b3c`.
`npm run check` GREEN — **36 files / 109 tests**, typecheck + lint + build clean.

## Vitest (the FSM — `test/core/entities/boss.test.ts`, 4/4)
1. **Phase 1 telegraphed swing/pound with super-armour, never launched by hero hits** — boss enters swing/pound
   with `armorFrames > 0`; a direct `attack3` (launch) leaves it out of `knockdown` and still alive.
2. **50% transition** — a hit to exactly `floor(hp*0.5)` → `tearOpen` with `invulnFrames ≥ 60`; after
   `TEAR_OPEN_FRAMES` → `phase 2`, `speedMul 1.3`, `tint true`, exactly **one** `bossPhase2` event, exactly
   **one** blade `weaponPickup` (`heat = WEAPON_HEAT.blade = 8`), and the ranged glob attack emits a `glob`
   projectile.
3. **Glob depth rule** — a phase-2 boss at a different lane (`|dy| = 40 > DEPTH_TOLERANCE`) never damages the hero.
4. **Defeat** — `hp ≤ 0` → `dying` → `dead` once; exactly one `bossDefeated`; `stage.bossDefeated = true`;
   `score ≥ 5000` (`SCORE.boss`).

### Two ratified test-cadence fixes (plan-internal contradictions; impl faithful, plan §15.1 test to patch)
- **tear-open tick:** a light `attack1` sets a 3-frame `state.hitstop`; the plan's single `tick()` after
  `applyHit` was consumed by the hitstop early-return, so `updateBoss` never ran → boss stuck in `hurt`. Fix:
  `w.hitstop = 0` before the tick so the FSM advances (the sim correctly freezes during hitstop — the FSM is
  right, the test's tick budget was off). Robust to the hitstop constant.
- **glob observation:** vs a stationary in-range hero the boss commits to melee (globs are gated on `far` — a
  spacing tool), so the plan's 900-frame idle loop never left melee range for seed 1. Fix: drive `throwGlob`
  directly to prove the mechanic emits a real `glob` projectile (depth behaviour is covered by test 3).
  **Observation for the owner's playtest (non-blocking):** the Foreman melee-locks and only lobs globs when the
  player backs off — tune in the 14.4 timed run if it feels under-used.

## CDP browser gate (headless Chrome @1024×640, DEV `B` spawns the boss; `docs/verification/15-boss-stageclear.png`)
Scripted encounter (spawn → phase 1 → force 50% → phase 2 → defeat), zero console errors throughout:
- **phase 1:** boss renders as a box (`Rectangle` 48×120, fill `0xd81b60`), white variant stroke; the
  **`THE FOREMAN`** name-card slams (`seenNameCards` includes `boss`).
- **phase 2:** `tint true`, `speedMul 1.3`, `invulnFrames 0`; box gains the **magenta stroke `0xff3ea8`**;
  **1** blade `weaponPickup` on the ground (`heat 8`).
- **defeat:** boss `dying`, `stage.bossDefeated true`, `score 5000`, **camera lock released** (`camera.lockX
  null`), and the **`STAGE CLEAR`** banner is visible (screenshot: banner centred, `SCORE 005000`, the hero and
  the dropped cyan blade pickup on-screen, cabinet intact).
- **`CONSOLE_ERRORS=[]`** — the absent `boss` atlas never triggers a `setFrame` error (EntityView's
  frame-exists guard holds; box fallback like the feral).

## Deferred (non-blocking)
- Boss SPRITE art (~120 px, phase-2 reserve-slot recolor) is **ticket 16** — renders as the magenta box now.
- With the boss beatable, the stage is completable start → boss → **STAGE CLEAR**; the owner's 14.4 Step-3
  timed-run playtest can now measure the full stage.

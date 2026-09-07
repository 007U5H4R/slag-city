# Ticket 03 — Art tracer: verification

**Date:** 2026-09-07 · **Gate:** headless Chrome + CDP @ 1024×640 (≥769px, real viewport via `Emulation.setDeviceMetricsOverride`) · driver `/Volumes/E Drive/Dev/.scratch/slag-cdp-gate.mjs`.

## What was verified
The AI-generated hero **walk** atlas plays in-engine on the provisional palette.

- **Pipeline (end-to-end, real art):** `assets/sources/hero/reference.png` (Higgsfield, owner-picked masked exorcist) → 4 legs-only walk frames (Seedream 4.5, upper-body/hammer locked, `#808080` bg) → `assets/sources/hero/walk.png` strip → `assets/palette.provisional.json` (64 colours, median-cut via `tools/art/make-provisional-palette.ts`) → `build-atlas` → `public/assets/atlases/hero.{png,json}` (frames `hero/walk/0..3`, 46×64, origin [0.5,1]) → Phaser `BootScene` atlas load + `EntityViews` sprite path.

## Evidence
- `03-art-tracer-walk.png` — CRT play-area (3× zoom), hero mid-walk: masked exorcist, sledgehammer on shoulder (attached), striding, feet on the lane line, facing right. Enemies are still placeholder boxes (no art yet — expected); green ring = attacker/target indicator; HUD renders.
- `03-art-tracer-idle.png` — hero at rest = walk frame 0 (idle maps to walk/0 until ticket 12's idle sheet).
- `03-art-tracer-walk-full.png` — full 1024×640 cabinet capture.

## Result
- ✅ Hero renders as a **sprite** (not the placeholder box); enemies correctly remain boxes.
- ✅ Walk pose reads at game scale (384×224 internal); silhouette holds; hammer + limbs stay attached (no swim).
- ✅ Feet pinned on a common line across frames (origin [0.5,1]); no vertical slide.
- ✅ **CONSOLE_ERRORS = []** — atlas loaded cleanly, no `setFrame` errors, missing-attack-frame guard holds (attack states keep the last walk frame; no crash).
- ✅ `npm run check` GREEN (28 files / 85 tests, typecheck + lint + build).

## Notes / deferred
- Walk-only (4 frames). Attack/idle/hit sheets not yet generated — `ANIM_TABLE` attack entries fall back via the guard.
- Provisional palette (hero-derived); the master palette lock is a later ticket.
- Minor art polish (sprite is dark; raised hammer eats headroom) — non-blocking; revisit if desired.

## ⛔ Owner visual-accept
**ACCEPTED — owner, 2026-09-07** ("go ahead"). In-engine hero walk approved for M0. Art polish (darkness, hammer headroom) and the full move-set/enemy art deferred to the scaling pass.

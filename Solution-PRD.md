# Solution PRD — SLAG CITY (working title)

Stage 2 of the build chain · 2026-09-05 · Status: awaiting sign-off
Input: `Discovery-PRD.md` (the WHAT/WHY). This document is the HOW. Where it differs from Discovery §8
("decisions carried in"), this document supersedes.

## 1. Chosen approach

An original single-player arcade beat-'em-up, one polished stage, built as a **browser game on
Phaser 3 + Vite + TypeScript** with all game logic in a **framework-free TypeScript core** (Phaser is only
the render/input/audio adapter). Characters are generated on **Higgsfield** — one reference image per
character (Nano Banana Pro) animated into sprite sheets by **AutoSprite** — then run through a local
pipeline that downscales to CPS-1 scale and quantises to a 64-colour palette. Presented as a full arcade
cabinet with a CRT pass. Shipped free at itch.io + a Vercel URL.

Alternatives considered and rejected: raw Canvas (write everything, no upside for a commercial target);
Godot 4 web export (40 MB, SharedArrayBuffer headers, shaky Safari — wrong for browser-first);
per-pose stills (2 cr × ~40 frames × retries ≈ 200 cr/character with frame drift — kept as fallback);
video-to-frames (25–195 cr/clip — budget-breaking).

## 2. Architecture

```
src/core/      pure TS, no Phaser import — tick(state, inputFrame) → state; fixed 60 Hz; seeded RNG
  sim/         entity registry, fixed-step loop (accumulator capped), camera / scroll-locks
  combat/      frame-data tables (startup/active/recovery + hitbox rects, as data), hit resolution, hitstop, launch
  entities/    hero, gang×3, feral machine, boss, weapon, pickup — small FSMs
  ai/          gang group AI (attacker tickets), feral targeting, boss phases
  stage/       stage-1 beat sheet: spawn tables, scroll-locks, hazards
  arcade/      credits, continues, score, hi-score rules
src/adapters/  Phaser scenes, sprite views, input (keyboard + Gamepad API), audio, CRT PostFX pipeline
src/shell/     cabinet DOM (bezel, marquee, attract overlay, SERVICE screen), kv-store.ts (ported openDB)
tools/art/     build-atlas.ts: AutoSprite sheet → crop/trim → downscale → palette quantise → Phaser atlas
assets/        atlases, palette.json, audio + audio/manifest.json, LICENSES.md
test/          Vitest (core), replay goldens, Playwright smoke
```

**Data flow:** adapter → `InputFrame` → `core.tick` → immutable state snapshot → Phaser draws it.
Deterministic sim ⇒ **attract-mode demo = a recorded input log replayed through the sim**; every bug is
replayable. Boundary rule: `src/core` never imports Phaser (enforced by an eslint `no-restricted-imports`
rule); everything in core is unit-testable in Node.

## 3. Game systems

**World:** belt plane — `x` scroll, `y` depth (continuous, clamped to the walkable band), `z` height.
Draw order = `y` sort. Hit rule: hitbox/hurtbox overlap in `x`/`z` **and** `|Δy| ≤ 8 px`.

**Hero FSM (standard-90s set):** idle · walk · attack1→2→3 (input-buffered combo; hit 3 launches) · jump ·
jumpAttack · grab (auto on walking into a stunned enemy) → throw · hurt · knockdown → getup
(invulnerable) · weaponAttack · special (health-cost crowd-clear) · dead. All timings/hitboxes in a
frame-data table, not code.

**Hit-feel numbers (one file):** hitstop 3 / 5 / 8 frames (light / heavy / launch); 2-px screen shake on
heavy; pushback; 2-frame white flash on the victim.

**Enemies:**
- Gang ×3 — brawler / knife (fast, low HP) / heavy (super-armour on wind-up). **Attacker tickets:** at most
  2 attack at once; the rest circle at distance.
- Feral machine — **neutral**: targets the nearest body, hero or gang, by distance; pounces; damages
  whoever it hits; both sides can kill it. Drops the **arm-cannon** on death.
- Boss "the Foreman" (working name) — devil-mech. Phase 1: slow heavy brawler (swing, ground-pound).
  At 50 % HP: tear-open transition → same frames with furnace-core emissive tint, 1.3× speed, molten-glob
  projectile; it **tears off its own blade arm**, which lands as a pickup.

**Salvage weapons (the hook):** picked up with Attack over the item; dropped on knockdown.
- Arm-cannon — ranged, **6 shots**, then overheats and breaks (sparks). Source: feral machines.
- Blade-limb — melee, **8 hits**, then breaks. Source: the boss's own arm at phase 2.

**Pickups:** lunch pail (health, in breakable crates), scrap gears (points).

**Arcade economy:** Coin = +1 credit (unlimited inserts — free demo). Start consumes 1. One life per credit,
health 0–100. Continue countdown (10 s) consumes 1 and resumes in place at the current scroll-lock. Game
over → hi-score entry (if top 10) → attract. Hi-score rows record credits used ⇒ **1CC flagged**.

## 4. Stage 1 — Foundry District (6–8 min; ramps by counts/types, never stat inflation)

| Section | ~Time | Environment | Enemies | Teaches |
|---|---|---|---|---|
| 1 · Foundry Gates | 1.5 min | Night skyline, smokestacks, chain-link, the gate | 2 fights: 2 brawlers → 3 brawlers + 1 knife | Combo, jump, grab→throw; health crate |
| 2 · Conveyor Floor | 2.5 min | Moving belts (y-band pushes x), molten channel (touch = knockdown, all sides), chain hoists | 3 fights; adds the heavy; first **feral** bursts from a wall vent → drops the cannon | Hazards, neutral hazard, salvage |
| 3 · Furnace Hall | 2 min | Telegraphed ladle pours, catwalks | Mixed gangs, two ferals at once, final gauntlet, boss door | Everything at once |
| Boss | 1.5 min | Furnace pit | Both phases; blade-limb | Finale |

Name-card flash on every first appearance; boss name flash. Spawn tables are data in `core/stage/`.

## 5. Cabinet, screens, input, data

- Dark room → cabinet bezel → marquee art → **4:3 canvas at 384×224 × integer scale** (×3 at 1080p, ×4 above),
  vignette. CRT = Phaser PostFX pipeline (scanlines, slight barrel, soft phosphor blend = the softening
  requirement), toggle key.
- Screen state machine: `BOOT → ATTRACT (title → demo replay → hi-score table → loop) → COIN → PLAY →
  CONTINUE (10 s) → PLAY | GAME OVER → HI-SCORE ENTRY (AAA) → ATTRACT`. First keypress = audio unlock.
- **Input:** keyboard arrows/WASD; J/K/L = Attack/Jump/Special; Enter = Start; **5 = Coin** (MAME
  convention). Gamepad: d-pad/stick; West/South/East = Attack/Jump/Special; Start; Select = Coin.
- **Hi-scores:** IndexedDB via `kv-store.ts` (db `slagcity`, store `kv`, key `hiscores`): top 10 of
  `{ initials: "AAA", score: number, credits: number, stage: number, date: ISO-8601 }`, seeded with a default
  table. **Settings:** CRT on/off, volume in `localStorage`, read defensively. Nothing else persists.

## 6. Art & audio pipeline

1. **Palette first** — first hero + first background → reduce to a 64-colour master palette
   (`assets/palette.json`), hand-adjust once; every asset is quantised to it.
2. **Character reference** — Nano Banana Pro (2 cr): *side ¾ view, full body, neutral stance, flat grey
   background, 1993 arcade beat-'em-up proportions*; hero reference passed as `image_references` for every
   other character. 2–4 candidates each.
3. **AutoSprite per action** — presets idle/walk/attack/jump; `custom` for combo2/3, grab, throw, hurt,
   knockdown, get-up, weapon swing, cannon fire, special. `frame_count` 4–8, `frame_size` 256,
   `is_humanoid` false for the feral. **First run records cost and identifies the backing provider.**
4. **`build-atlas.ts`** (Node + sharp) — crop/trim → downscale (hero 64 px, boss ~120 px tall) →
   nearest-colour quantise, no dither → Phaser atlas JSON. Sources + outputs committed.
5. **Backgrounds** — Nano Banana Pro at 21:9, one generation per parallax layer (sky/far, mid, ground),
   quantised; ground layers loop with a manual seam check.
6. **Marquee + logo** — Nano Banana Pro + Recraft vector pass. The marquee doubles as the 1200×630 OG image.
7. **`assets/LICENSES.md`** — every asset: source, model, provider, date, prompt, licence, AI flag.

**Budget:** non-AutoSprite ≈ 80 cr (refs ~36, backgrounds ~24, marquee/UI ~20). AutoSprite ≈ 41 runs
(hero 12, gangs 18, feral 5, boss 6). At ≤ 15 cr/run everything fits inside one monthly 600-credit grant; the
approved top-up pack is a buffer. Art generation is scheduled against the monthly reset (credits don't roll
over). Supersedes Discovery §8's hybrid-pack plan: **all characters on Higgsfield** (a licensed sprite pack
would break style consistency); licensed packs are for audio only.

**Legal rules baked in:** no Kling-backed model for shipped assets (Higgsfield ToU §8 pass-through);
no third-party IP in prompts or references; provenance metadata never stripped; AI disclosure on store pages.

**Audio:** licensed retro-arcade SFX pack (commercial licence verified at ticket time) via
`audio/manifest.json`; licensed FM/chiptune stage track + boss track + title jingle; voice barks via Higgsfield
audio as a trial (same provider rule). Phaser WebAudio, unlocked on first keypress.

## 7. Testing & verification

- **Vitest on `core`:** frame-data invariants; the depth-tolerance hit rule; hitstop/launch on hit 3;
  attacker tickets ≤ 2; feral targets nearest body regardless of side; weapon heat breaks at 6 / 8;
  credit/continue economy; hi-score ordering + 1CC flag; **determinism** (same input log → same state hash).
- **Replay goldens** — recorded input logs as regression tests (the attract demo is one).
- **Playwright smoke** against `vite preview` and, post-deploy, the production URL: page loads, canvas at
  integer scale, coin → start → hero visible, zero console errors. Playwright temp + browsers on the E Drive.
- **Manual play-test checklist** per milestone (the QA-tester gate): Discovery §7 items + the S3 feel sign-off.
- Baseline gate on every change: `tsc --noEmit` + eslint + Vitest. CI runs all + Playwright.

## 8. Failure handling

Asset load failure → arcade-style **SERVICE** screen naming the asset, retry key, console error with the
asset id. No WebGL → Canvas renderer, CRT off, one-line notice. Gamepad disconnect → pause
(*CONTROLLER DISCONNECTED*), resume on reconnect/keypress. IndexedDB unavailable → in-memory hi-scores for
the session. Audio unlock failure → silent, retry on next gesture. Tab hidden → sim pauses, accumulator
capped. Resize → recompute integer scale. ≤ 768 px viewports → a "Desktop + keyboard/gamepad required"
card; no horizontal scroll.

## 9. Deploy

`vite build` → `dist/`. **Vercel** (production from `main`, previews per PR, long-cache headers for hashed
assets). **itch.io** HTML5 upload (1152×672 viewport + fullscreen; AI-content disclosure set) — manual for
the first release, then `butler` from CI on a git tag with the key as a CI secret. **CI:** typecheck, lint,
Vitest, build, Playwright smoke on push; Playwright smoke against production after deploy. Open Graph +
Twitter Card with the 1200×630 marquee image. No telemetry, analytics, or accounts.

## 10. Milestones (riskiest first; each closed by the QA-tester gate)

| # | Milestone | Kills | Gate |
|---|---|---|---|
| M0 | Art tracer: hero ref → AutoSprite walk + attack → build-atlas → in Phaser at 384×224 under CRT | AI frame consistency; AutoSprite cost + provider | Owner accepts quality; cost ≤ budget; provider not Kling |
| M1 | Combat core: pure-TS sim + Vitest, placeholder boxes, hero vs 2 brawlers, keyboard + gamepad | "Does it feel like 1993?" with boxes | Early S3 read |
| M2 | Full cast through the pipeline; gang AI, feral, both weapons | Group-AI fairness, feral neutrality | Vitest + play-test |
| M3 | Sections 1–3: backgrounds, hazards, spawn tables | Pacing 6–8 min | Timed runs |
| M4 | Boss, both phases, blade-limb | Finale feel | Play-test |
| M5 | Cabinet, coin-op state machine, attract replay, hi-scores, audio | Checklist #1–10 | Walk-through |
| M6 | Polish, OG image, LICENSES.md, itch + Vercel, CI smoke on prod | S1, S5, S6 | A stranger plays it |

## 11. Out of scope (adds to Discovery §5)

Input remapping UI; PWA install/offline; settings beyond CRT + volume; localisation; analytics; alternate
palettes; a replay viewer; the possession mechanic; co-op; mobile/touch; native/Steam builds.

## 12. Success criteria

S1–S6 from `Discovery-PRD.md` verbatim, plus: determinism test green; post-deploy Playwright smoke green
on the production URL; AutoSprite cost + provider recorded in `LICENSES.md`; licence manifest complete for
every shipped asset.

## 13. Open questions (carried to Stage 3)

Final name (pick from the CLEAR list, then trademark lookup); hero name + visual design; boss final name;
which licensed SFX / music packs; AutoSprite's real cost (M0 measures it).

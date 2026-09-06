# SLAG CITY Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

Stage 5 of the build chain · 2026-09-06 · Status: awaiting sign-off
Inputs: `tickets.md` (24 tickets, dependency order), `Solution-PRD.md`, `Design.md`, `Discovery-PRD.md`, `HANDOFF.md`.
One plan per ticket, in ticket-DAG frontier order. Execution playbook: `ExecutionPlaybook.md`.

**Goal:** Ship one polished, original, publishable arcade beat-'em-up stage as a free browser demo on itch.io + Vercel, presented as a CRT arcade cabinet.

**Architecture:** All game logic is a framework-free TypeScript core (`src/core`) exposing `tick(state, input) → state` at a fixed 60 Hz with a seeded RNG, so the same input log always yields the same state hash. Phaser 3 is only the render / input / audio adapter (`src/adapters`); the cabinet frame, settings and hi-score storage are plain DOM/TS (`src/shell`). Art is generated on Higgsfield and pushed through a Node tool (`tools/art`) that downscales and quantises to a frozen 64-colour palette.

**Tech Stack:** Phaser 3.90 · Vite 7 · TypeScript 5.9 · Vitest 3 · ESLint 9 (flat config, typescript-eslint) · Playwright · sharp + @napi-rs/canvas (art/font tools) · Higgsfield MCP (Nano Banana Pro, AutoSprite) · Vercel · itch.io butler · Node 26 / npm 11 (installed).

**Spec:** `Solution-PRD.md` (how) + `Design.md` (look) + `Discovery-PRD.md` (what/why) + `tickets.md` (acceptance criteria).

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the specs.

- Internal resolution **384×224 (4:3)**, **integer scaling only** (×3 at 1080p, ×4 above), canvas centred, recomputed on resize. No smoothing except the CRT pass.
- **Fixed 60 Hz** simulation; accumulator capped; sim pauses while the tab is hidden.
- `src/core` **never imports Phaser** (eslint `no-restricted-imports`); everything in core is unit-testable in Node. Seeded RNG is the only randomness in core.
- Data flow: adapter → `InputFrame` → `core.tick` → state snapshot → Phaser draws it. The adapter never writes core state.
- World: belt plane — `x` scroll, `y` depth (clamped to the walkable band), `z` height. Draw order = `y` sort. **Hit rule: hitbox/hurtbox overlap in x/z and |Δy| ≤ 8 px.**
- **Hit-feel numbers (one file):** hitstop 3 / 5 / 8 frames (light / heavy / launch); 2-px screen shake on heavy; pushback; 2-frame white flash on the victim.
- Gang AI: **at most 2 attacker tickets** at once. Feral machine is neutral: nearest body by distance, no faction preference.
- Salvage weapons: arm-cannon **6 shots**, blade-limb **8 hits**, then break; picked up with Attack over the item; dropped on knockdown.
- Arcade economy: Coin = +1 credit (unlimited); Start consumes 1; one life per credit; health 0–100; **continue countdown 10 s**; top-10 hi-scores `{ initials, score, credits, stage, date: ISO-8601 }`; credits used = 1 ⇒ **1CC** flag.
- Keys: arrows/WASD move; **J/K/L = Attack/Jump/Special; Enter = Start; 5 = Coin**. Gamepad: d-pad/stick; **West/South/East = Attack/Jump/Special; Start; Select = Coin**; disconnect pauses with "CONTROLLER DISCONNECTED".
- Persistence: IndexedDB via `kv-store.ts` (**db `slagcity`, store `kv`, key `hiscores`**), in-memory fallback. `localStorage` holds only CRT on/off + volume, read defensively. Nothing else persists. No telemetry, analytics or accounts.
- Palette: **exactly 64 colours** in `assets/palette.json`, structured in the `Design.md` §2.1 groups; UI-chrome and HUD-state slots reserved, never used in world art. Nearest-colour quantise, **no dither**. Hero ~**64 px** tall, boss ~**120 px**.
- HUD: whole-pixel, **8-px grid**, **16-px top band**; corner radius zero inside the canvas. Name-card: slide in **6 frames**, hold **24**, out **4**, constant velocity. "INSERT COIN"/"PRESS START" hard blink at **~1.5 Hz**, no fade. Coin-accepted counter pulse 1.0 → 115 % → 1.0 over **2 frames**. Attract segment crossfade **≈500 ms**.
- **≤768 px viewport:** cabinet hidden, static "desktop required" card `min(90vw, 420px)` wide, no horizontal scroll down to 320 px.
- Failure handling: asset load failure → SERVICE screen naming the asset id + retry key + console error; no WebGL → Canvas renderer, CRT off, one-line notice; audio unlock failure → silent, retry on next gesture.
- **Legal:** no Kling-backed model for any shipped asset; no third-party IP in prompts or references; `assets/LICENSES.md` records source, model, provider, date, prompt, licence, AI flag for every asset. Every ticket that spends Higgsfield credits is **human-gated** on the owner's credit ceiling.
- **Machine:** all caches, temp, browsers and build output live on `/Volumes/E Drive` (npm cache already at `/Volumes/E Drive/Dev/.caches/npm`; Playwright browsers/temp must be redirected). Never delete `/private/tmp/claude-501/...`.
- Stage 1 pacing: a competent run is **6–8 minutes** to the boss door; difficulty ramps by counts/types only.
- Deploy: `vite build` → `dist/`; Vercel production from `main`; itch.io HTML5 at **1152×672** with fullscreen and AI-content disclosure; OG + Twitter Card tags with absolute HTTPS URLs to the 1200×630 image.

---

## Plan decisions made here (not in the specs — flag at sign-off)

1. **Fonts.** `Design.md` §2.2 asks for two commercially licensed pixel faces. This plan uses **one** SIL-OFL-1.1 font, *Press Start 2P* (CodeMan38), rendered to two RetroFont sheets: 8×8 for HUD/body and 16×16 (scaled 2×) for display text. The marquee/logo face is art (ticket 21), not a text font. Reason: one OFL font removes a licence-hunt gate and guarantees pixel-grid alignment. If the owner wants a distinct display face later it is a one-task swap in ticket 09.
2. **CRT toggle key = `C`** (unbound elsewhere; J/K/L/Enter/5 are gameplay). **Debug hitbox overlay key = `H`** (dev builds only).
3. **State mutation.** `tick` mutates the passed `WorldState` in place and returns it; the adapter reads it as the frame's snapshot and never writes. Determinism is proven by `hashState`, not by immutability. Cloning 60 states/s buys nothing here.
4. **Native-resolution framebuffer.** The Phaser game is created at `384k × 224k` with the camera zoomed ×k (not a 384×224 buffer CSS-scaled), so the CRT PostFX can draw 1-px scanlines every k rows. Resize calls `game.scale.resize` + `camera.setZoom`.
5. **Walkable band:** `y ∈ [128, 208]`, HUD band `y ∈ [0, 16)`. Hero feet at `pos.y`, screen draw y = `pos.y − pos.z`.
6. **Faction rule for hits:** hero hits gang/boss/feral/crate; gang and boss hit hero and feral; feral hits everyone except feral; projectiles carry their owner's faction.

---

## File structure (locked here; every task below uses these paths)

```
index.html                         Vite entry; #room > #cabinet > #screen (Phaser parent) — ticket 01/20
src/main.ts                        boot: viewport gate → shell → createGame
src/core/                          PURE TS — no Phaser
  types.ts                         InputFrame, EMPTY_INPUT, Vec3, Rect, Facing, HitLevel
  input-codec.ts                   encodeInput/decodeInput (9-bit mask) for replays
  sim/rng.ts                       mulberry32: createRng, rngNext, rngInt
  sim/loop.ts                      STEP_MS, createFixedStep, advanceFixedStep
  sim/entity.ts                    Entity, EntityKind, createEntity, faction()
  sim/state.ts                     WorldState, SimEvent, createWorld, WALK_BAND, HUD_BAND
  sim/tick.ts                      tick(): events reset → entity updates → hits → physics → camera → cull
  sim/physics.ts                   gravity, landing, band clamp
  sim/camera.ts                    follow + scroll-locks
  sim/hash.ts                      hashState (FNV-1a over canonical JSON)
  sim/replay.ts                    runReplay(seed, encodedInputs) → hash
  combat/frame-data.ts             MoveData, ActorData, HERO_DATA, dataFor(kind)
  combat/hit-feel.ts               HIT_FEEL constants (the one file)
  combat/hit.ts                    worldRect, hitConnects, DEPTH_TOLERANCE
  combat/resolve.ts                resolveHits, applyHit, applyKnockdown
  entities/hero.ts                 updateHero (full FSM)
  entities/gang.ts                 GANG_DATA, updateGang (brawler/knife/heavy)
  entities/feral.ts                FERAL_DATA, updateFeral
  entities/boss.ts                 BOSS_DATA, updateBoss
  entities/items.ts                crate, pickup, weapon-pickup, projectile updates
  ai/tickets.ts                    assignAttackTickets, ringPosition
  ai/targeting.ts                  nearestBody
  stage/stage1.ts                  SECTIONS, LOCKS (spawn tables), hazards data
  stage/hazards.ts                 belts, molten channel, ladle pours
  stage/spawn.ts                   spawnForLock
  arcade/credits.ts                credit arithmetic
  arcade/screen-machine.ts         BOOT→ATTRACT→COIN→PLAY→CONTINUE→GAME_OVER→HISCORE_ENTRY
  arcade/hiscores.ts               ordering, top-10, 1CC, seed table
  arcade/initials.ts               AAA entry reducer
  arcade/hud.ts                    healthColour, formatScore, nameCardTimeline
  weapons/heat.ts                  WEAPON_HEAT, useWeapon
src/adapters/phaser/
  createGame.ts                    Phaser.Game config (native-res buffer)
  scale.ts                         applyScale(game, k)
  scenes/BootScene.ts              asset loading → SERVICE on failure
  scenes/GameScene.ts              fixed-step driver, views, overlays
  scenes/TestPatternScene.ts       ticket 02 checkerboard (dev only)
  crt/CrtPipeline.ts               PostFX pipeline + GLSL
  input/keyboard.ts                KeyboardSource
  input/gamepad.ts                 GamepadSource (+ disconnect)
  input/compose.ts                 composeInput(sources) → InputFrame
  views/EntityView.ts              box or atlas sprite per entity
  views/anim-table.ts              (kind,state) → atlas animation
  views/DebugOverlay.ts            hitbox/hurtbox rects
  views/Hud.ts                     health/score/credits/heat plates
  views/NameCard.ts                slam-in banner
  views/ScorePop.ts                rising score digits
  screens/Attract.ts, Continue.ts, GameOver.ts, HiScoreEntry.ts, HiScoreTable.ts
  audio/AudioAdapter.ts            manifest → Phaser sounds, unlock, volume
src/shell/
  scale.ts                         computeIntegerScale (pure)
  settings.ts                      defensive localStorage (crt, volume)
  cabinet.ts                       bezel/marquee/vignette DOM + resize
  viewport-gate.ts                 ≤768 card
  service-screen.ts                SERVICE overlay
  kv-store.ts                      IndexedDB kv + memory fallback
tools/art/
  build-atlas.ts                   AutoSprite sheet → atlas (sharp)
  palette.ts                       quantise, buildPalette, loadPalette
  seam-check.ts                    ground-layer loop seam diff
tools/fonts/build-retro-font.ts    TTF → RetroFont PNG (8×8 / 16×16)
assets/
  palette.json, atlases/, backgrounds/, fonts/, audio/, audio/manifest.json, LICENSES.md
  sources/                         raw Higgsfield outputs (committed)
test/
  core/**/*.test.ts                Vitest (node)
  replays/*.json                   replay goldens {seed, inputs, hash}
  e2e/smoke.spec.ts                Playwright
.github/workflows/ci.yml
vercel.json
```

### Shared core interfaces (defined in ticket 05, consumed everywhere)

```ts
// src/core/types.ts
export interface InputFrame {
  left: boolean; right: boolean; up: boolean; down: boolean;
  attack: boolean; jump: boolean; special: boolean;
  start: boolean; coin: boolean;
}
export const EMPTY_INPUT: Readonly<InputFrame>;
export type Facing = 1 | -1;
export interface Vec3 { x: number; y: number; z: number }
/** Local rect: x forward from feet (flipped by facing), y = height above feet (up-positive), w, h. */
export interface Rect { x: number; y: number; w: number; h: number }
export type HitLevel = 'light' | 'heavy' | 'launch';
```

```ts
// src/core/sim/entity.ts
export type EntityKind = 'hero' | 'brawler' | 'knife' | 'heavy' | 'feral' | 'boss'
  | 'crate' | 'pickup' | 'weaponPickup' | 'projectile';
export type Faction = 'hero' | 'gang' | 'feral' | 'none';
export type PickupKind = 'lunchpail' | 'gear';
export type WeaponKind = 'cannon' | 'blade';
export interface Entity {
  id: number; kind: EntityKind;
  pos: Vec3; vel: Vec3; facing: Facing;
  state: string; stateFrame: number;
  hp: number; maxHp: number;
  hitstun: number; invulnFrames: number; flashFrames: number; armorFrames: number; cooldown: number;
  hitIds: number[]; chainQueued: boolean;
  variant: number; attackTicket: boolean; ticketCooldown: number; targetId: number | null;
  weapon: { kind: WeaponKind; heat: number } | null;   // held (hero)
  pickupKind: PickupKind | null; weaponKind: WeaponKind | null; // pickup / weaponPickup / projectile
  ownerFaction: Faction;                                 // projectile
  grabbedId: number | null; phase: 1 | 2; speedMul: number; tint: boolean;
  lockIndex: number; weaponUsePending: boolean;
  dead: boolean; removeIn: number;
}
export function createEntity(id: number, kind: EntityKind, x: number, y: number): Entity;
export function faction(e: Entity): Faction;
```

```ts
// src/core/sim/state.ts
export const WALK_BAND = { minY: 128, maxY: 208 } as const;
export const HUD_BAND = 16;
export const SCREEN = { w: 384, h: 224 } as const;
export type SimEvent =
  | { type: 'hit'; attackerId: number; victimId: number; level: HitLevel; x: number; y: number; damage: number }
  | { type: 'sfx'; id: string }
  | { type: 'score'; amount: number; x: number; y: number }
  | { type: 'namecard'; kind: string }
  | { type: 'weaponBreak'; kind: WeaponKind; x: number; y: number }
  | { type: 'pickup'; kind: PickupKind | WeaponKind; x: number; y: number }
  | { type: 'lockRelease'; index: number }
  | { type: 'heroDead' } | { type: 'bossDefeated' } | { type: 'bossPhase2' };
export interface WorldState {
  frame: number; seed: number; rng: RngState; nextId: number;
  entities: Entity[]; heroId: number;
  camera: { x: number; lockX: number | null; lockIndex: number };
  hitstop: number; shake: { frames: number; px: number };
  score: number; events: SimEvent[]; seenNameCards: string[];
  stage: { sectionIndex: number; bossDefeated: boolean; heroDead: boolean; lockCleared: boolean[];
           stageData: StageData | null; lockFrame: number; bossDoorReached: boolean };   // stageData/lockFrame/bossDoorReached land in ticket 14
  stageWidth: number;
  prevInput: InputFrame;   // for press-edge detection
}
export function createWorld(seed: number, stageWidth?: number, stage?: StageData | null): WorldState;
export function spawn(state: WorldState, kind: EntityKind, x: number, y: number): Entity;
export function heroOf(state: WorldState): Entity;
```

```ts
// src/core/sim/tick.ts
export function tick(state: WorldState, input: InputFrame): WorldState;
// src/core/sim/hash.ts
export function hashState(state: WorldState): string;   // 8-hex FNV-1a
// src/core/sim/replay.ts
export function runReplay(seed: number, encoded: number[]): { state: WorldState; hash: string };
```

---

## Execution order

Frontier order from `tickets.md` (blockers first). Human gates marked ⛔.

| Order | Ticket | Blocked by | Gate |
|---|---|---|---|
| 1 | 01 Scaffold | — | |
| 2 | 05 Sim + locomotion + input | 01 | |
| 3 | 02 CRT | 01 | |
| 4 | 20 Cabinet shell DOM | 01 | browser check |
| 5 | 06 Combat tracer | 05 | ⛔ S3 early feel read |
| 6 | 03 Art tracer M0 | 01, 02 | ⛔ credit ceiling; quality |
| 7 | 07 Hero full FSM | 06 | |
| 8 | 08 Gang trio + AI | 06 | |
| 9 | 09 HUD/pickups/name-cards | 06 | |
| 10 | 04 Palette lock | 03 | ⛔ credits; look sign-off |
| 11 | 10 Feral | 08 | |
| 12 | 11 Weapons + heat HUD | 07, 09, 10 | |
| 13 | 12 Hero sprites | 04, 07 | ⛔ credits; sign-off |
| 14 | 13 Gang + feral sprites | 04, 08, 10 | ⛔ credits |
| 15 | 21 Marquee/logo/OG | 04 | ⛔ credits; **final title** |
| 16 | 14 Stage 1 layout | 08, 10, 11 | ⛔ timed runs |
| 17 | 15 Boss | 08, 11 | |
| 18 | 16 Boss sprites | 04, 15 | ⛔ credits; sign-off |
| 19 | 17 Remaining backgrounds | 04, 14 | ⛔ credits |
| 20 | 18 Coin-op machine | 09, 14 | |
| 21 | 19 Hi-scores + attract | 18 | |
| 22 | 22 Audio | 18 | ⛔ licence checks |
| 23 | 23 Playwright + CI | 19, 20 | |
| 24 | 24 Deploy | 21, 22, 23 | ⛔ deploy scope |

Parallel-safe pairs (disjoint files): 02 ∥ 05 ∥ 20; 07 ∥ 08 ∥ 09; 12 ∥ 13 ∥ 21; 16 ∥ 17; 22 ∥ 23.

Commit convention: one commit per task, imperative subject, `feat(core): …` / `feat(adapter): …` / `feat(shell): …` / `chore: …` / `test: …` / `art: …`. Work happens on branch `build/stage-1` in a worktree (see `ExecutionPlaybook.md`); `main` is never committed to directly.

---

# Ticket 01 — Scaffold + core/adapter boundary + CI baseline

**Delivers:** `npm run dev` shows a blank 384×224 canvas integer-scaled inside a dark room; typecheck, lint, Vitest and build pass locally and in CI; the core/adapter boundary is lint-enforced.

### Task 1.1: Project init, toolchain, E-Drive caches

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.npmrc`, `.nvmrc`
- Modify: `.gitignore`

**Interfaces:** Produces npm scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:watch`, `check`.

- [ ] **Step 1: Confirm caches are on the E Drive**

Run: `npm config get cache`
Expected: `/Volumes/E Drive/Dev/.caches/npm`. If not, run `npm config set cache "/Volumes/E Drive/Dev/.caches/npm"`.

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "slag-city",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

- [ ] **Step 3: Install dependencies (pin what npm resolves)**

Run:
```bash
npm install phaser@3
npm install -D vite@7 typescript@5 vitest@3 eslint@9 @eslint/js typescript-eslint globals @types/node
```
Expected: `node_modules/` created; `package.json` gains `dependencies.phaser` and the dev deps with caret versions. Record the resolved versions in the commit message body.

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": { "@core/*": ["src/core/*"], "@adapters/*": ["src/adapters/*"], "@shell/*": ["src/shell/*"] }
  },
  "include": ["src", "test", "tools", "vite.config.ts", "vitest.config.ts", "eslint.config.js", "playwright.config.ts"]
}
```

- [ ] **Step 5: Write `vite.config.ts` and `vitest.config.ts`**

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@adapters': fileURLToPath(new URL('./src/adapters', import.meta.url)),
      '@shell': fileURLToPath(new URL('./src/shell', import.meta.url)),
    },
  },
  cacheDir: '/Volumes/E Drive/Dev/.caches/vite/slag-city',
  build: { target: 'es2022', sourcemap: false, assetsInlineLimit: 0 },
  server: { port: 5173, strictPort: true },
});
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@adapters': fileURLToPath(new URL('./src/adapters', import.meta.url)),
      '@shell': fileURLToPath(new URL('./src/shell', import.meta.url)),
    },
  },
  cacheDir: '/Volumes/E Drive/Dev/.caches/vite/slag-city',
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['test/e2e/**'],
  },
});
```

- [ ] **Step 6: Write `.npmrc`, `.nvmrc`, extend `.gitignore`**

`.npmrc`:
```
cache=/Volumes/E Drive/Dev/.caches/npm
```
`.nvmrc`:
```
26
```
Append to `.gitignore`:
```
# Test / tool output
test-results/
playwright-report/
coverage/
tools/**/out/
```

- [ ] **Step 7: Verify toolchain**

Run: `npm run typecheck`
Expected: exits 0 (no source yet; tsc reports nothing).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts .npmrc .nvmrc .gitignore
git commit -m "chore: scaffold Phaser 3 + Vite + TypeScript toolchain with E-Drive caches"
```

### Task 1.2: Pure integer-scale math with its test

**Files:**
- Create: `src/shell/scale.ts`, `test/shell/scale.test.ts`

**Interfaces:**
- Produces: `computeIntegerScale(viewportW: number, viewportH: number, chromeH?: number): number` — largest integer k ≥ 1 with `384k ≤ viewportW` and `224k ≤ viewportH − chromeH`; `BASE_W = 384`, `BASE_H = 224`.

- [ ] **Step 1: Write the failing test**

```ts
// test/shell/scale.test.ts
import { describe, it, expect } from 'vitest';
import { computeIntegerScale } from '@shell/scale';

describe('computeIntegerScale', () => {
  it('gives x4 at 1080p with no chrome (224*4 = 896 <= 1080)', () => {
    expect(computeIntegerScale(1920, 1080)).toBe(4);
  });
  it('gives x3 at 1080p once cabinet chrome takes 200px', () => {
    expect(computeIntegerScale(1920, 1080, 200)).toBe(3);
  });
  it('gives x5 at 1440p with 200px chrome', () => {
    expect(computeIntegerScale(2560, 1440, 200)).toBe(5);
  });
  it('never returns a fraction and never below 1', () => {
    expect(computeIntegerScale(500, 300)).toBe(1);
    expect(computeIntegerScale(100, 100)).toBe(1);
    expect(Number.isInteger(computeIntegerScale(1234, 777))).toBe(true);
  });
  it('is limited by the tighter axis', () => {
    expect(computeIntegerScale(3840, 600)).toBe(2);
    expect(computeIntegerScale(800, 2000)).toBe(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/shell/scale.test.ts`
Expected: FAIL — cannot resolve `@shell/scale`.

- [ ] **Step 3: Implement**

```ts
// src/shell/scale.ts
export const BASE_W = 384;
export const BASE_H = 224;

/** Largest integer scale k >= 1 such that BASE_W*k <= viewportW and BASE_H*k <= viewportH - chromeH. */
export function computeIntegerScale(viewportW: number, viewportH: number, chromeH = 0): number {
  const kx = Math.floor(viewportW / BASE_W);
  const ky = Math.floor((viewportH - chromeH) / BASE_H);
  return Math.max(1, Math.min(kx, ky));
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/shell/scale.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/shell/scale.ts test/shell/scale.test.ts
git commit -m "feat(shell): add pure integer-scale computation"
```

### Task 1.3: Boot a blank canvas in a dark room

**Files:**
- Create: `index.html`, `src/main.ts`, `src/adapters/phaser/createGame.ts`, `src/adapters/phaser/scale.ts`, `src/adapters/phaser/scenes/GameScene.ts`, `src/styles/room.css`

**Interfaces:**
- Produces: `createGame(parent: HTMLElement, k: number): Phaser.Game`; `applyScale(game: Phaser.Game, k: number): void`; `GameScene` (key `'game'`) listens for `game.events.on('rescale', (k) => …)`; registry key `'scale'` holds k.

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SLAG CITY</title>
  <link rel="stylesheet" href="/src/styles/room.css" />
</head>
<body>
  <div id="room">
    <div id="cabinet">
      <div id="marquee" aria-hidden="true"></div>
      <div id="bezel">
        <div id="screen"></div>
        <div id="vignette" aria-hidden="true"></div>
      </div>
    </div>
  </div>
  <div id="gate" hidden></div>
  <div id="service" hidden></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Write `src/styles/room.css`**

```css
:root { --room: #08070a; --marquee-h: 0px; --panel-h: 0px; }
html, body { margin: 0; height: 100%; background: var(--room); color: #d9d2c5; overflow: hidden; }
#room { position: fixed; inset: 0; display: grid; place-items: center; background: var(--room); }
#cabinet { display: grid; grid-template-rows: var(--marquee-h) auto var(--panel-h); justify-items: center; }
#bezel { position: relative; line-height: 0; }
#screen { position: relative; }
#screen canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
#vignette { position: absolute; inset: 0; pointer-events: none; }
```

- [ ] **Step 3: Write the Phaser scale helper**

```ts
// src/adapters/phaser/scale.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';

/** Resize the native framebuffer to BASE*k and tell scenes to re-zoom their cameras. */
export function applyScale(game: Phaser.Game, k: number): void {
  game.registry.set('scale', k);
  game.scale.resize(BASE_W * k, BASE_H * k);
  game.events.emit('rescale', k);
}
```

- [ ] **Step 4: Write `GameScene` (blank, re-zooms on rescale)**

```ts
// src/adapters/phaser/scenes/GameScene.ts
import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';

export class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.applyZoom((this.registry.get('scale') as number | undefined) ?? 1);
    this.game.events.on('rescale', (k: number) => this.applyZoom(k));
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
  }
}
```

- [ ] **Step 5: Write `createGame.ts`**

```ts
// src/adapters/phaser/createGame.ts
import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { GameScene } from './scenes/GameScene';

export function createGame(parent: HTMLElement, k: number): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: BASE_W * k,
    height: BASE_H * k,
    pixelArt: true,
    backgroundColor: '#000000',
    render: { antialias: false, roundPixels: true, powerPreference: 'high-performance' },
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
    fps: { target: 60, forceSetTimeOut: false },
    scene: [GameScene],
  });
  game.registry.set('scale', k);
  return game;
}
```

- [ ] **Step 6: Write `src/main.ts`**

```ts
// src/main.ts
import { createGame } from '@adapters/phaser/createGame';
import { applyScale } from '@adapters/phaser/scale';
import { computeIntegerScale } from '@shell/scale';

const screen = document.getElementById('screen');
if (!screen) throw new Error('#screen missing from index.html');

const chromeH = (): number => {
  const s = getComputedStyle(document.documentElement);
  return parseInt(s.getPropertyValue('--marquee-h')) + parseInt(s.getPropertyValue('--panel-h'));
};
const currentScale = (): number => computeIntegerScale(window.innerWidth, window.innerHeight, chromeH());

let lastK = currentScale();
const game = createGame(screen, lastK);
window.addEventListener('resize', () => {
  const k = currentScale();
  if (k !== lastK) { lastK = k; applyScale(game, k); }
});
```

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev` then open `http://localhost:5173`.
Expected: a black canvas whose CSS size is exactly `384k × 224k` centred on a near-black page; in DevTools, `document.querySelector('#screen canvas').width` is a multiple of 384. Resize the window across a boundary (e.g. shrink height below 672 px): the canvas jumps to ×2, never a fractional size.

- [ ] **Step 8: Typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: both exit 0; `dist/index.html` exists.

- [ ] **Step 9: Commit**

```bash
git add index.html src/main.ts src/styles/room.css src/adapters/phaser/createGame.ts src/adapters/phaser/scale.ts src/adapters/phaser/scenes/GameScene.ts
git commit -m "feat(adapter): boot blank 384x224 canvas at integer scale in a dark room"
```

### Task 1.4: Core seed + Vitest without Phaser

**Files:**
- Create: `src/core/types.ts`, `test/core/types.test.ts`

**Interfaces:** Produces `InputFrame`, `EMPTY_INPUT`, `Facing`, `Vec3`, `Rect`, `HitLevel` exactly as in the shared-interface block above.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/types.test.ts
import { describe, it, expect } from 'vitest';
import { EMPTY_INPUT } from '@core/types';

describe('core runs in node without Phaser', () => {
  it('EMPTY_INPUT has every button false', () => {
    expect(Object.values(EMPTY_INPUT).every((v) => v === false)).toBe(true);
    expect(Object.keys(EMPTY_INPUT).sort()).toEqual(
      ['attack', 'coin', 'down', 'jump', 'left', 'right', 'special', 'start', 'up'],
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/core/types.test.ts`
Expected: FAIL — cannot resolve `@core/types`.

- [ ] **Step 3: Implement**

```ts
// src/core/types.ts
export interface InputFrame {
  left: boolean; right: boolean; up: boolean; down: boolean;
  attack: boolean; jump: boolean; special: boolean;
  start: boolean; coin: boolean;
}
export const EMPTY_INPUT: Readonly<InputFrame> = Object.freeze({
  left: false, right: false, up: false, down: false,
  attack: false, jump: false, special: false, start: false, coin: false,
});
export type Facing = 1 | -1;
export interface Vec3 { x: number; y: number; z: number }
/** Local rect: x forward from the feet (flipped by facing), y = height above feet (up-positive). */
export interface Rect { x: number; y: number; w: number; h: number }
export type HitLevel = 'light' | 'heavy' | 'launch';
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: 2 files, all passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts test/core/types.test.ts
git commit -m "feat(core): add InputFrame and geometry types with a node-only test"
```

### Task 1.5: ESLint with the core/adapter boundary rule

**Files:**
- Create: `eslint.config.js`

**Interfaces:** Produces `npm run lint`; any `phaser` import under `src/core/**` is a lint error.

- [ ] **Step 1: Write the flat config**

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'assets/**', 'tools/**/out/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // The boundary: src/core is pure TypeScript. No Phaser, no adapters, no shell, no DOM.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{ name: 'phaser', message: 'src/core must not import Phaser (Solution-PRD §2 boundary rule).' }],
        patterns: [
          { group: ['@adapters/*', '@shell/*', '**/adapters/**', '**/shell/**'], message: 'src/core must not import adapters or shell.' },
        ],
      }],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator', 'localStorage', 'indexedDB', 'requestAnimationFrame', 'performance'],
    },
  },
);
```

- [ ] **Step 2: Prove the rule bites (deliberate violation)**

Run:
```bash
printf "import Phaser from 'phaser';\nexport const x = Phaser.VERSION;\n" > src/core/violation.ts
npx eslint src/core/violation.ts; echo "exit=$?"
```
Expected: one error mentioning `src/core must not import Phaser`, `exit=1`.

- [ ] **Step 3: Remove the violation and lint clean**

Run: `rm src/core/violation.ts && npm run lint`
Expected: exit 0, no output.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js
git commit -m "chore: add eslint flat config enforcing the core/adapter boundary"
```

### Task 1.6: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: ci
on:
  push:
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Run the full local gate**

Run: `npm run check`
Expected: exit 0.

- [ ] **Step 3: Commit; push only when the user asks**

```bash
git add .github/workflows/ci.yml
git commit -m "chore: add CI running typecheck, lint, vitest and build"
```

**Ticket 01 verification gate:** `npm run check` green; dev server shows the integer-scaled black canvas; violation file fails lint; CI green on the first push (confirm with the user before pushing — the repo has no remote yet).

---

# Ticket 02 — CRT PostFX pipeline + toggle key

**Delivers:** the canvas renders through scanlines + slight barrel + phosphor bleed; `C` toggles instantly; state persists in localStorage; no-WebGL falls back to Canvas with the pass off and a one-line notice.

### Task 2.1: Defensive settings store

**Files:**
- Create: `src/shell/settings.ts`, `test/shell/settings.test.ts`

**Interfaces:**
- Produces: `getSetting<K extends keyof Settings>(key: K): Settings[K]`, `setSetting(key, value)`, `Settings = { crt: boolean; volume: number }`, defaults `{ crt: true, volume: 0.8 }`, `_bindStorage(provider)` test seam. Storage key prefix `slagcity.`.

- [ ] **Step 1: Write the failing test (uses a fake Storage)**

```ts
// test/shell/settings.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getSetting, setSetting, _bindStorage } from '@shell/settings';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('settings', () => {
  let store: MemStorage;
  beforeEach(() => { store = new MemStorage(); _bindStorage(() => store); });

  it('returns defaults when nothing is stored', () => {
    expect(getSetting('crt')).toBe(true);
    expect(getSetting('volume')).toBe(0.8);
  });
  it('round-trips values', () => {
    setSetting('crt', false); setSetting('volume', 0.25);
    expect(getSetting('crt')).toBe(false);
    expect(getSetting('volume')).toBe(0.25);
  });
  it('ignores garbage and out-of-range values', () => {
    store.setItem('slagcity.crt', 'banana');
    store.setItem('slagcity.volume', '"7"');
    expect(getSetting('crt')).toBe(true);
    expect(getSetting('volume')).toBe(0.8);
  });
  it('survives a storage that throws', () => {
    _bindStorage(() => { throw new Error('SecurityError'); });
    expect(getSetting('crt')).toBe(true);
    expect(() => setSetting('crt', false)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run test/shell/settings.test.ts` — Expected: FAIL, module missing.

- [ ] **Step 3: Implement**

```ts
// src/shell/settings.ts
export interface Settings { crt: boolean; volume: number }
const DEFAULTS: Settings = { crt: true, volume: 0.8 };
const PREFIX = 'slagcity.';

let storageProvider: () => Storage = () => localStorage;
/** Test seam: swap the Storage provider. */
export function _bindStorage(p: () => Storage): void { storageProvider = p; }

const validators: { [K in keyof Settings]: (v: unknown) => v is Settings[K] } = {
  crt: (v): v is boolean => typeof v === 'boolean',
  volume: (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1,
};

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  try {
    const raw = storageProvider().getItem(PREFIX + key);
    if (raw === null) return DEFAULTS[key];
    const parsed: unknown = JSON.parse(raw);
    return validators[key](parsed) ? (parsed as Settings[K]) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  try { storageProvider().setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage unavailable: session-only */ }
}
```

- [ ] **Step 4: Run tests** — `npx vitest run test/shell/settings.test.ts` — Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/shell/settings.ts test/shell/settings.test.ts
git commit -m "feat(shell): add defensive localStorage settings for crt and volume"
```

### Task 2.2: CRT PostFX pipeline

**Files:**
- Create: `src/adapters/phaser/crt/CrtPipeline.ts`
- Modify: `src/adapters/phaser/createGame.ts`

**Interfaces:**
- Produces: `class CrtPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline` with `setScale(k: number)`; `CRT_KEY = 'crt'`; `enableCrt(scene: Phaser.Scene, on: boolean): void`; `crtInstance(scene): CrtPipeline | undefined`.

- [ ] **Step 1: Write the pipeline**

```ts
// src/adapters/phaser/crt/CrtPipeline.ts
import Phaser from 'phaser';

export const CRT_KEY = 'crt';

const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;   // framebuffer size in pixels
uniform float uScale;       // integer scale k
varying vec2 outTexCoord;

vec2 barrel(vec2 uv) {
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + 0.035 * r2;           // slight curvature; edges bow ~3.5%
  return c * 0.5 + 0.5;
}

void main() {
  vec2 uv = barrel(outTexCoord);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 texel = 1.0 / uResolution;
  // phosphor bleed: horizontal 3-tap blend across half a *source* pixel (k/2 framebuffer pixels)
  vec4 c0 = texture2D(uMainSampler, uv);
  vec4 cl = texture2D(uMainSampler, uv - vec2(texel.x * uScale * 0.5, 0.0));
  vec4 cr = texture2D(uMainSampler, uv + vec2(texel.x * uScale * 0.5, 0.0));
  vec4 col = c0 * 0.70 + (cl + cr) * 0.15;
  // scanline: one darker framebuffer row per source row
  float row = floor(uv.y * uResolution.y);
  float line = mod(row, uScale);
  float dark = (line < 1.0) ? 0.82 : 1.0;
  gl_FragColor = vec4(col.rgb * dark, 1.0);
}
`;

export class CrtPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  private k = 1;
  constructor(game: Phaser.Game) {
    super({ game, name: CRT_KEY, fragShader: FRAG });
  }
  setScale(k: number): void { this.k = k; }
  override onPreRender(): void {
    this.set1f('uScale', this.k);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

export function crtInstance(scene: Phaser.Scene): CrtPipeline | undefined {
  const p = scene.cameras.main.getPostPipeline(CrtPipeline) as CrtPipeline | CrtPipeline[];
  return Array.isArray(p) ? p[0] : (p instanceof CrtPipeline ? p : undefined);
}

/** Attach or detach the pass on the scene's main camera. No-op on the Canvas renderer. */
export function enableCrt(scene: Phaser.Scene, on: boolean): void {
  if (scene.renderer.type !== Phaser.WEBGL) return;
  const cam = scene.cameras.main;
  if (on) {
    if (!crtInstance(scene)) cam.setPostPipeline(CrtPipeline);
    crtInstance(scene)?.setScale((scene.registry.get('scale') as number | undefined) ?? 1);
  } else {
    cam.removePostPipeline(CrtPipeline);
  }
}
```

- [ ] **Step 2: Register the pipeline in `createGame.ts`**

Add `import { CrtPipeline, CRT_KEY } from './crt/CrtPipeline';` and inside the config object add:
```ts
    pipeline: { [CRT_KEY]: CrtPipeline },
```

- [ ] **Step 3: Typecheck** — `npm run typecheck` — Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/adapters/phaser/crt/CrtPipeline.ts src/adapters/phaser/createGame.ts
git commit -m "feat(adapter): add CRT PostFX pipeline (scanlines, barrel, phosphor bleed)"
```

### Task 2.3: Test-pattern scene, toggle key, renderer fallback notice

**Files:**
- Create: `src/adapters/phaser/scenes/TestPatternScene.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`, `src/adapters/phaser/createGame.ts`, `src/main.ts`, `src/styles/room.css`

**Interfaces:**
- Produces: `GameScene.setCrt(on: boolean)`; keyboard `C` toggles; `#notice` DOM line.

- [ ] **Step 1: Write the test-pattern scene (dev-only, started with `?pattern`)**

```ts
// src/adapters/phaser/scenes/TestPatternScene.ts
import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting } from '@shell/settings';
import { enableCrt } from '../crt/CrtPipeline';

export class TestPatternScene extends Phaser.Scene {
  constructor() { super('pattern'); }
  create(): void {
    const k = (this.registry.get('scale') as number | undefined) ?? 1;
    this.cameras.main.setZoom(k); this.cameras.main.centerOn(BASE_W / 2, BASE_H / 2);
    this.game.events.on('rescale', (n: number) => { this.cameras.main.setZoom(n); this.cameras.main.centerOn(BASE_W / 2, BASE_H / 2); });
    const g = this.add.graphics();
    for (let y = 0; y < BASE_H; y += 8) for (let x = 0; x < BASE_W; x += 8) {
      g.fillStyle(((x + y) / 8) % 2 === 0 ? 0xffffff : 0x000000, 1);
      g.fillRect(x, y, 8, 8);
    }
    g.fillStyle(0xff8800, 1); g.fillRect(96, 96, 192, 32);
    this.add.text(100, 104, 'SLAG CITY 384x224 CRT TEST', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' });
    enableCrt(this, getSetting('crt'));
  }
}
```

- [ ] **Step 2: Wire toggle + zoom into `GameScene`**

Replace `src/adapters/phaser/scenes/GameScene.ts` with:
```ts
import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting, setSetting } from '@shell/settings';
import { enableCrt, crtInstance } from '../crt/CrtPipeline';

export class GameScene extends Phaser.Scene {
  private crtOn = true;
  constructor() { super('game'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.applyZoom((this.registry.get('scale') as number | undefined) ?? 1);
    this.game.events.on('rescale', (k: number) => this.applyZoom(k));
    this.crtOn = getSetting('crt');
    enableCrt(this, this.crtOn);
    this.input.keyboard?.on('keydown-C', () => this.setCrt(!this.crtOn));
    if (new URLSearchParams(location.search).has('pattern')) this.scene.launch('pattern');
  }

  setCrt(on: boolean): void {
    this.crtOn = on;
    enableCrt(this, on);
    if (this.scene.isActive('pattern')) enableCrt(this.scene.get('pattern'), on);
    setSetting('crt', on);
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
    crtInstance(this)?.setScale(k);
  }
}
```

- [ ] **Step 3: Register the pattern scene and the no-WebGL notice**

In `createGame.ts`: `scene: [GameScene, TestPatternScene]` (add the import). In `src/main.ts` add `import Phaser from 'phaser';` and after `createGame(...)`:
```ts
game.events.once(Phaser.Core.Events.READY, () => {
  if (game.renderer.type === Phaser.CANVAS) {
    const n = document.createElement('div');
    n.id = 'notice';
    n.textContent = 'WebGL unavailable — running on the Canvas renderer, CRT pass off.';
    document.body.appendChild(n);
  }
});
```
In `room.css` append:
```css
#notice { position: fixed; left: 0; right: 0; bottom: 0; padding: 4px 8px; font: 12px monospace; color: #d9d2c5; background: #1a1418; text-align: center; }
```

- [ ] **Step 4: Verify in the browser**

Run: `npm run dev`, open `http://localhost:5173/?pattern`.
Expected: checkerboard + orange bar + text visibly softened, thin dark line every k rows, slight bow at the edges. Press `C`: instantly pixel-crisp, no size/position change (verify `#screen canvas` `getBoundingClientRect()` is identical before/after). Reload: toggle state persisted. Launch Chrome with `--disable-gpu --disable-software-rasterizer`: the notice line appears and the pattern still renders.

- [ ] **Step 5: Lint + typecheck + commit**

```bash
npm run typecheck && npm run lint
git add src/adapters/phaser/scenes/TestPatternScene.ts src/adapters/phaser/scenes/GameScene.ts src/adapters/phaser/createGame.ts src/main.ts src/styles/room.css
git commit -m "feat(adapter): CRT toggle on C with persisted setting and canvas-renderer notice"
```

**Ticket 02 verification gate:** all four acceptance boxes ticked in the browser; `npm run check` green.

---

# Ticket 05 — Deterministic sim + hero locomotion + keyboard & gamepad

**Delivers:** a placeholder-box hero walks, changes depth and jumps on the belt plane at a fixed 60 Hz from keyboard or gamepad; the same input log always produces the same state hash; the sim pauses on tab-hidden and on gamepad disconnect.

### Task 5.1: Seeded RNG and fixed-step loop

**Files:**
- Create: `src/core/sim/rng.ts`, `src/core/sim/loop.ts`, `test/core/sim/rng.test.ts`, `test/core/sim/loop.test.ts`

**Interfaces:**
- Produces: `RngState { s: number }`, `createRng(seed: number): RngState`, `rngNext(r): number` in [0,1), `rngInt(r, min, max): number` inclusive; `STEP_MS = 1000/60`, `MAX_STEPS_PER_ADVANCE = 5`, `FixedStep { accumulator: number }`, `createFixedStep()`, `advanceFixedStep(fs, dtMs, step: () => void): number` (steps run), `resetFixedStep(fs)`.

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/sim/rng.test.ts
import { describe, it, expect } from 'vitest';
import { createRng, rngNext, rngInt } from '@core/sim/rng';

describe('rng (mulberry32)', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(1234), b = createRng(1234);
    const sa = Array.from({ length: 5 }, () => rngNext(a));
    const sb = Array.from({ length: 5 }, () => rngNext(b));
    expect(sa).toEqual(sb);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('differs across seeds', () => {
    expect(rngNext(createRng(1))).not.toBe(rngNext(createRng(2)));
  });
  it('rngInt is inclusive of both bounds', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rngInt(r, 0, 3));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
});
```

```ts
// test/core/sim/loop.test.ts
import { describe, it, expect } from 'vitest';
import { createFixedStep, advanceFixedStep, STEP_MS, MAX_STEPS_PER_ADVANCE } from '@core/sim/loop';

describe('fixed step', () => {
  it('runs one step per 16.67ms', () => {
    const fs = createFixedStep();
    let n = 0;
    expect(advanceFixedStep(fs, STEP_MS * 3, () => n++)).toBe(3);
    expect(n).toBe(3);
  });
  it('carries the remainder', () => {
    const fs = createFixedStep();
    let n = 0;
    advanceFixedStep(fs, STEP_MS * 1.5, () => n++);
    advanceFixedStep(fs, STEP_MS * 0.5, () => n++);
    expect(n).toBe(2);
  });
  it('caps a huge delta (tab was hidden) to MAX_STEPS_PER_ADVANCE', () => {
    const fs = createFixedStep();
    let n = 0;
    expect(advanceFixedStep(fs, 60_000, () => n++)).toBe(MAX_STEPS_PER_ADVANCE);
    expect(fs.accumulator).toBeLessThan(STEP_MS);
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run test/core/sim` — Expected: FAIL, modules missing.

- [ ] **Step 3: Implement**

```ts
// src/core/sim/rng.ts
export interface RngState { s: number }
export function createRng(seed: number): RngState { return { s: seed >>> 0 }; }
/** mulberry32 — returns [0,1). Mutates r.s. */
export function rngNext(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function rngInt(r: RngState, min: number, max: number): number {
  return min + Math.floor(rngNext(r) * (max - min + 1));
}
```

```ts
// src/core/sim/loop.ts
export const STEP_MS = 1000 / 60;
export const MAX_STEPS_PER_ADVANCE = 5;
export interface FixedStep { accumulator: number }
export function createFixedStep(): FixedStep { return { accumulator: 0 }; }
export function resetFixedStep(fs: FixedStep): void { fs.accumulator = 0; }
/** Adds dtMs, runs up to MAX_STEPS_PER_ADVANCE fixed steps, drops the excess. Returns steps run. */
export function advanceFixedStep(fs: FixedStep, dtMs: number, step: () => void): number {
  fs.accumulator = Math.min(fs.accumulator + dtMs, STEP_MS * MAX_STEPS_PER_ADVANCE);
  let n = 0;
  while (fs.accumulator >= STEP_MS && n < MAX_STEPS_PER_ADVANCE) {
    step(); fs.accumulator -= STEP_MS; n++;
  }
  if (n === MAX_STEPS_PER_ADVANCE) fs.accumulator = fs.accumulator % STEP_MS;
  return n;
}
```

- [ ] **Step 4: Run tests** — `npx vitest run test/core/sim` — Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/core/sim/rng.ts src/core/sim/loop.ts test/core/sim/rng.test.ts test/core/sim/loop.test.ts
git commit -m "feat(core): add seeded mulberry32 rng and capped fixed-step accumulator"
```

### Task 5.2: Entity, world state, physics, hash

**Files:**
- Create: `src/core/sim/entity.ts`, `src/core/sim/state.ts`, `src/core/sim/physics.ts`, `src/core/sim/hash.ts`, `test/core/sim/physics.test.ts`, `test/core/sim/hash.test.ts`

**Interfaces:**
- Produces: exactly the shared-interface block (`Entity`, `createEntity`, `faction`, `WorldState`, `SimEvent`, `createWorld`, `spawn`, `heroOf`, `WALK_BAND`, `HUD_BAND`, `SCREEN`) plus `WorldState.prevInput: InputFrame` (for edge detection) and `GRAVITY = 0.25`, `applyPhysics(state)`, `hashState(state)`.

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/sim/physics.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, spawn, WALK_BAND } from '@core/sim/state';
import { applyPhysics, GRAVITY } from '@core/sim/physics';

describe('physics', () => {
  it('applies gravity and lands at z=0', () => {
    const w = createWorld(1);
    const e = spawn(w, 'brawler', 100, 160);
    e.vel.z = 4.5;
    let frames = 0;
    do { applyPhysics(w); frames++; } while (e.pos.z > 0 && frames < 200);
    expect(e.pos.z).toBe(0);
    expect(e.vel.z).toBe(0);
    // vz 4.5, gravity 0.25: z after n frames = 4.5n - 0.125n(n+1) = 0 at n = 35 (exact in binary floats)
    expect(GRAVITY).toBe(0.25);
    expect(frames).toBe(35);
  });
  it('clamps y to the walkable band and moves by velocity', () => {
    const w = createWorld(1);
    const e = spawn(w, 'brawler', 100, 130);
    e.vel = { x: 2, y: -5, z: 0 };
    applyPhysics(w);
    expect(e.pos.x).toBe(102);
    expect(e.pos.y).toBe(WALK_BAND.minY);
    e.vel = { x: 0, y: 500, z: 0 };
    applyPhysics(w);
    expect(e.pos.y).toBe(WALK_BAND.maxY);
  });
  it('does not clamp projectiles to the band', () => {
    const w = createWorld(1);
    const p = spawn(w, 'projectile', 100, 100);
    applyPhysics(w);
    expect(p.pos.y).toBe(100);
  });
});
```

```ts
// test/core/sim/hash.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, spawn } from '@core/sim/state';
import { hashState } from '@core/sim/hash';

describe('hashState', () => {
  it('is stable for equal worlds and 8 hex chars', () => {
    const a = createWorld(42), b = createWorld(42);
    expect(hashState(a)).toBe(hashState(b));
    expect(hashState(a)).toMatch(/^[0-9a-f]{8}$/);
  });
  it('changes when an entity moves', () => {
    const a = createWorld(42), b = createWorld(42);
    spawn(a, 'brawler', 10, 150); spawn(b, 'brawler', 11, 150);
    expect(hashState(a)).not.toBe(hashState(b));
  });
  it('ignores transient events', () => {
    const a = createWorld(42), b = createWorld(42);
    a.events.push({ type: 'sfx', id: 'coin' });
    expect(hashState(a)).toBe(hashState(b));
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run test/core/sim` — Expected: FAIL, modules missing.

- [ ] **Step 3: Implement `entity.ts`**

```ts
// src/core/sim/entity.ts
import type { Facing, Vec3 } from '../types';

export type EntityKind = 'hero' | 'brawler' | 'knife' | 'heavy' | 'feral' | 'boss'
  | 'crate' | 'pickup' | 'weaponPickup' | 'projectile';
export type Faction = 'hero' | 'gang' | 'feral' | 'none';
export type PickupKind = 'lunchpail' | 'gear';
export type WeaponKind = 'cannon' | 'blade';

export interface Entity {
  id: number; kind: EntityKind;
  pos: Vec3; vel: Vec3; facing: Facing;
  state: string; stateFrame: number;
  hp: number; maxHp: number;
  hitstun: number; invulnFrames: number; flashFrames: number; armorFrames: number; cooldown: number;
  hitIds: number[]; chainQueued: boolean;
  variant: number; attackTicket: boolean; ticketCooldown: number; targetId: number | null;
  weapon: { kind: WeaponKind; heat: number } | null;
  pickupKind: PickupKind | null; weaponKind: WeaponKind | null;
  ownerFaction: Faction;
  grabbedId: number | null; phase: 1 | 2; speedMul: number; tint: boolean;
  lockIndex: number; weaponUsePending: boolean;
  dead: boolean; removeIn: number;
}

export function createEntity(id: number, kind: EntityKind, x: number, y: number): Entity {
  return {
    id, kind,
    pos: { x, y, z: 0 }, vel: { x: 0, y: 0, z: 0 }, facing: 1,
    state: 'idle', stateFrame: 0,
    hp: 1, maxHp: 1,
    hitstun: 0, invulnFrames: 0, flashFrames: 0, armorFrames: 0, cooldown: 0,
    hitIds: [], chainQueued: false,
    variant: 0, attackTicket: false, ticketCooldown: 0, targetId: null,
    weapon: null, pickupKind: null, weaponKind: null,
    ownerFaction: 'none',
    grabbedId: null, phase: 1, speedMul: 1, tint: false,
    lockIndex: -1, weaponUsePending: false,
    dead: false, removeIn: -1,
  };
}

export function faction(e: Entity): Faction {
  switch (e.kind) {
    case 'hero': return 'hero';
    case 'brawler': case 'knife': case 'heavy': case 'boss': return 'gang';
    case 'feral': return 'feral';
    case 'projectile': return e.ownerFaction;
    default: return 'none';
  }
}

/** Change state and reset per-state bookkeeping. */
export function setState(e: Entity, state: string): void {
  e.state = state; e.stateFrame = 0; e.hitIds = [];
}

export const isBody = (e: Entity): boolean =>
  e.kind === 'hero' || e.kind === 'brawler' || e.kind === 'knife' || e.kind === 'heavy' || e.kind === 'feral' || e.kind === 'boss';
```

- [ ] **Step 4: Implement `state.ts`**

```ts
// src/core/sim/state.ts
import type { HitLevel, InputFrame } from '../types';
import { EMPTY_INPUT } from '../types';
import type { Entity, EntityKind, PickupKind, WeaponKind } from './entity';
import { createEntity } from './entity';
import type { RngState } from './rng';
import { createRng } from './rng';

export const WALK_BAND = { minY: 128, maxY: 208 } as const;
export const HUD_BAND = 16;
export const SCREEN = { w: 384, h: 224 } as const;

export type SimEvent =
  | { type: 'hit'; attackerId: number; victimId: number; level: HitLevel; x: number; y: number; damage: number }
  | { type: 'sfx'; id: string }
  | { type: 'score'; amount: number; x: number; y: number }
  | { type: 'namecard'; kind: string }
  | { type: 'weaponBreak'; kind: WeaponKind; x: number; y: number }
  | { type: 'pickup'; kind: PickupKind | WeaponKind; x: number; y: number }
  | { type: 'lockRelease'; index: number }
  | { type: 'heroDead' } | { type: 'bossDefeated' } | { type: 'bossPhase2' };

export interface WorldState {
  frame: number; rng: RngState; nextId: number;
  entities: Entity[]; heroId: number;
  camera: { x: number; lockX: number | null; lockIndex: number };
  hitstop: number; shake: { frames: number; px: number };
  score: number; events: SimEvent[]; seenNameCards: string[];
  stage: { sectionIndex: number; bossDefeated: boolean; heroDead: boolean; lockCleared: boolean[] };
  stageWidth: number;
  prevInput: InputFrame;
}

export function createWorld(seed: number, stageWidth = SCREEN.w * 3): WorldState {
  const state: WorldState = {
    frame: 0, rng: createRng(seed), nextId: 1,
    entities: [], heroId: 0,
    camera: { x: 0, lockX: null, lockIndex: 0 },
    hitstop: 0, shake: { frames: 0, px: 0 },
    score: 0, events: [], seenNameCards: [],
    stage: { sectionIndex: 0, bossDefeated: false, heroDead: false, lockCleared: [] },
    stageWidth,
    prevInput: { ...EMPTY_INPUT },
  };
  const hero = spawn(state, 'hero', 64, 168);
  hero.hp = 100; hero.maxHp = 100;
  state.heroId = hero.id;
  return state;
}

export function spawn(state: WorldState, kind: EntityKind, x: number, y: number): Entity {
  const e = createEntity(state.nextId++, kind, x, y);
  state.entities.push(e);
  return e;
}

export function heroOf(state: WorldState): Entity {
  const h = state.entities.find((e) => e.id === state.heroId);
  if (!h) throw new Error('hero missing');
  return h;
}

export function byId(state: WorldState, id: number | null): Entity | undefined {
  return id === null ? undefined : state.entities.find((e) => e.id === id);
}

export function emit(state: WorldState, ev: SimEvent): void { state.events.push(ev); }
```

- [ ] **Step 5: Implement `physics.ts` and `hash.ts`**

```ts
// src/core/sim/physics.ts
import type { WorldState } from './state';
import { WALK_BAND } from './state';

export const GRAVITY = 0.25;

export function applyPhysics(state: WorldState): void {
  for (const e of state.entities) {
    if (e.pos.z > 0 || e.vel.z > 0) {
      e.vel.z -= GRAVITY;
      e.pos.z += e.vel.z;
      if (e.pos.z <= 0) { e.pos.z = 0; e.vel.z = 0; }
    }
    e.pos.x += e.vel.x;
    e.pos.y += e.vel.y;
    if (e.kind !== 'projectile') {
      e.pos.y = Math.max(WALK_BAND.minY, Math.min(WALK_BAND.maxY, e.pos.y));
    }
  }
}
```

```ts
// src/core/sim/hash.ts
import type { WorldState } from './state';

/** FNV-1a over canonical JSON of the deterministic parts of the state. */
export function hashState(state: WorldState): string {
  const { events: _events, ...rest } = state;
  const json = JSON.stringify(rest);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
```

- [ ] **Step 6: Run tests** — `npx vitest run test/core/sim` — Expected: all passed.

- [ ] **Step 7: Commit**

```bash
git add src/core/sim/entity.ts src/core/sim/state.ts src/core/sim/physics.ts src/core/sim/hash.ts test/core/sim/physics.test.ts test/core/sim/hash.test.ts
git commit -m "feat(core): add entity, world state, physics and state hash"
```

### Task 5.3: Hero frame-data table, locomotion FSM, camera follow, tick

**Files:**
- Create: `src/core/combat/frame-data.ts`, `src/core/entities/hero.ts`, `src/core/sim/camera.ts`, `src/core/sim/tick.ts`, `test/core/entities/hero-locomotion.test.ts`, `test/core/sim/camera.test.ts`

**Interfaces:**
- Produces: `MoveData { startup, active, recovery, hitbox: Rect, damage, level: HitLevel, pushback, chainFrom?: string }`, `ActorData { walkSpeed: {x,y}, hp, hurtbox: Rect, jumpVz: number, moves: Record<string, MoveData> }`, `HERO_DATA: ActorData`, `dataFor(kind: EntityKind): ActorData` (only hero registered here; gang/feral/boss register in their tickets via `registerActorData(kind, data)`), `pressed(state, input, key)` edge helper, `updateHero(state, hero, input)`, `updateCamera(state)`, `tick(state, input)`, `updateEntity` dispatch table `ENTITY_UPDATERS`.

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/entities/hero-locomotion.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, WALK_BAND } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HERO_DATA } from '@core/combat/frame-data';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });

describe('hero locomotion', () => {
  it('walks right at walkSpeed.x and faces right', () => {
    const w = createWorld(1); const h = heroOf(w); const x0 = h.pos.x;
    tick(w, inp({ right: true }));
    expect(h.state).toBe('walk');
    expect(h.pos.x).toBeCloseTo(x0 + HERO_DATA.walkSpeed.x);
    expect(h.facing).toBe(1);
  });
  it('faces left when walking left and returns to idle when released', () => {
    const w = createWorld(1); const h = heroOf(w);
    tick(w, inp({ left: true }));
    expect(h.facing).toBe(-1);
    tick(w, EMPTY_INPUT);
    expect(h.state).toBe('idle');
  });
  it('changes depth with up/down and is clamped to the band', () => {
    const w = createWorld(1); const h = heroOf(w);
    for (let i = 0; i < 200; i++) tick(w, inp({ up: true }));
    expect(h.pos.y).toBe(WALK_BAND.minY);
    for (let i = 0; i < 200; i++) tick(w, inp({ down: true }));
    expect(h.pos.y).toBe(WALK_BAND.maxY);
  });
  it('jumps on a jump press edge, keeps takeoff velocity, lands to idle', () => {
    const w = createWorld(1); const h = heroOf(w);
    tick(w, inp({ right: true, jump: true }));
    expect(h.state).toBe('jump');
    expect(h.vel.z).toBeGreaterThan(0);
    let frames = 1;
    while (h.state === 'jump' && frames < 200) { tick(w, inp({ right: true, jump: true })); frames++; }
    expect(h.state).toBe('walk');
    expect(frames).toBeGreaterThan(30);
    expect(frames).toBeLessThan(45);
  });
  it('does not re-jump while jump is held', () => {
    const w = createWorld(1); const h = heroOf(w);
    tick(w, inp({ jump: true }));
    while (h.state === 'jump') tick(w, inp({ jump: true }));
    expect(h.state).toBe('idle');
  });
});
```

```ts
// test/core/sim/camera.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { updateCamera, CAMERA_FOLLOW_X } from '@core/sim/camera';

describe('camera follow', () => {
  it('keeps the hero at the follow point once past it and never scrolls back', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.pos.x = 300; updateCamera(w);
    expect(w.camera.x).toBe(300 - CAMERA_FOLLOW_X);
    h.pos.x = 100; updateCamera(w);
    expect(w.camera.x).toBe(300 - CAMERA_FOLLOW_X);
  });
  it('clamps to the stage width', () => {
    const w = createWorld(1, 1000); const h = heroOf(w);
    h.pos.x = 5000; updateCamera(w);
    expect(w.camera.x).toBe(1000 - 384);
  });
  it('keeps the hero inside the visible screen', () => {
    const w = createWorld(1); const h = heroOf(w);
    w.camera.x = 200; h.pos.x = 100; updateCamera(w);
    expect(h.pos.x).toBe(200 + 8);
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run test/core/entities test/core/sim/camera.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `frame-data.ts`**

```ts
// src/core/combat/frame-data.ts
import type { HitLevel, Rect } from '../types';
import type { EntityKind } from '../sim/entity';

export interface MoveData {
  startup: number; active: number; recovery: number;
  hitbox: Rect; damage: number; level: HitLevel; pushback: number;
  /** Name of the move this one chains from (input buffered during startup+active+recovery of that move). */
  chainFrom?: string;
}
export interface ActorData {
  walkSpeed: { x: number; y: number };
  hp: number;
  hurtbox: Rect;
  jumpVz: number;
  moves: Record<string, MoveData>;
}

export const HERO_DATA: ActorData = {
  walkSpeed: { x: 1.5, y: 1 },
  hp: 100,
  hurtbox: { x: -10, y: 0, w: 20, h: 56 },
  jumpVz: 4.5,
  moves: {},
};

const registry: Partial<Record<EntityKind, ActorData>> = { hero: HERO_DATA };
export function registerActorData(kind: EntityKind, data: ActorData): void { registry[kind] = data; }
export function dataFor(kind: EntityKind): ActorData {
  const d = registry[kind];
  if (!d) throw new Error(`no actor data for ${kind}`);
  return d;
}
export const moveTotal = (m: MoveData): number => m.startup + m.active + m.recovery;
```

- [ ] **Step 4: Implement `hero.ts` (locomotion only; combat states arrive in 06/07)**

```ts
// src/core/entities/hero.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { HERO_DATA } from '../combat/frame-data';

/** True on the frame a button goes from up to down. */
export function pressed(state: WorldState, input: InputFrame, key: keyof InputFrame): boolean {
  return input[key] && !state.prevInput[key];
}

function readAxis(input: InputFrame): { dx: number; dy: number } {
  return { dx: (input.right ? 1 : 0) - (input.left ? 1 : 0), dy: (input.down ? 1 : 0) - (input.up ? 1 : 0) };
}

export function updateHero(state: WorldState, hero: Entity, input: InputFrame): void {
  hero.stateFrame++;
  const { dx, dy } = readAxis(input);
  switch (hero.state) {
    case 'idle':
    case 'walk': {
      hero.vel.x = dx * HERO_DATA.walkSpeed.x;
      hero.vel.y = dy * HERO_DATA.walkSpeed.y;
      if (dx !== 0) hero.facing = dx > 0 ? 1 : -1;
      const moving = dx !== 0 || dy !== 0;
      if (moving && hero.state !== 'walk') setState(hero, 'walk');
      if (!moving && hero.state !== 'idle') setState(hero, 'idle');
      if (pressed(state, input, 'jump')) { setState(hero, 'jump'); hero.vel.z = HERO_DATA.jumpVz; hero.vel.y = 0; }
      break;
    }
    case 'jump': {
      // velocity frozen at takeoff (classic arcade jump)
      if (hero.stateFrame > 1 && hero.pos.z === 0) {
        setState(hero, dx !== 0 || dy !== 0 ? 'walk' : 'idle');
      }
      break;
    }
    default:
      break;
  }
}
```

- [ ] **Step 5: Implement `camera.ts` and `tick.ts`**

```ts
// src/core/sim/camera.ts
import type { WorldState } from './state';
import { heroOf, SCREEN } from './state';

export const CAMERA_FOLLOW_X = 160;
export const HERO_SCREEN_MARGIN = 8;

export function updateCamera(state: WorldState): void {
  const hero = heroOf(state);
  const maxX = Math.max(0, state.stageWidth - SCREEN.w);
  const target = state.camera.lockX ?? Math.min(hero.pos.x - CAMERA_FOLLOW_X, maxX);
  if (state.camera.lockX === null) state.camera.x = Math.max(state.camera.x, target);
  else state.camera.x = Math.min(state.camera.lockX, maxX);
  const left = state.camera.x + HERO_SCREEN_MARGIN;
  const right = state.camera.x + SCREEN.w - HERO_SCREEN_MARGIN;
  hero.pos.x = Math.max(left, Math.min(right, hero.pos.x));
}
```

```ts
// src/core/sim/tick.ts
import type { InputFrame } from '../types';
import type { Entity, EntityKind } from './entity';
import type { WorldState } from './state';
import { applyPhysics } from './physics';
import { updateCamera } from './camera';
import { updateHero } from '../entities/hero';

export type EntityUpdater = (state: WorldState, e: Entity, input: InputFrame) => void;
export const ENTITY_UPDATERS: Partial<Record<EntityKind, EntityUpdater>> = { hero: updateHero };
/** Systems that run after entity updates and before physics (hit resolution, AI tickets, hazards). */
export const POST_UPDATE_SYSTEMS: Array<(state: WorldState) => void> = [];

export function tick(state: WorldState, input: InputFrame): WorldState {
  state.events = [];
  state.frame++;
  if (state.shake.frames > 0) state.shake.frames--;
  if (state.hitstop > 0) {
    state.hitstop--;
    state.prevInput = { ...input };
    return state;
  }
  for (const e of state.entities) {
    if (e.hitstun > 0) e.hitstun--;
    if (e.invulnFrames > 0) e.invulnFrames--;
    if (e.flashFrames > 0) e.flashFrames--;
    if (e.armorFrames > 0) e.armorFrames--;
    if (e.cooldown > 0) e.cooldown--;
    if (e.ticketCooldown > 0) e.ticketCooldown--;
    if (e.removeIn > 0 && --e.removeIn === 0) e.dead = true;
    ENTITY_UPDATERS[e.kind]?.(state, e, input);
  }
  for (const sys of POST_UPDATE_SYSTEMS) sys(state);
  applyPhysics(state);
  updateCamera(state);
  state.entities = state.entities.filter((e) => !e.dead);
  state.prevInput = { ...input };
  return state;
}
```

- [ ] **Step 6: Run tests** — `npm test` — Expected: all passed.

- [ ] **Step 7: Commit**

```bash
git add src/core/combat/frame-data.ts src/core/entities/hero.ts src/core/sim/camera.ts src/core/sim/tick.ts test/core/entities/hero-locomotion.test.ts test/core/sim/camera.test.ts
git commit -m "feat(core): hero locomotion FSM from frame data, camera follow, tick pipeline"
```

### Task 5.4: Input codec, replay runner, determinism test and golden mechanism

**Files:**
- Create: `src/core/input-codec.ts`, `src/core/sim/replay.ts`, `test/core/input-codec.test.ts`, `test/core/determinism.test.ts`, `test/replays/README.md`, `test/replays/locomotion-01.json` (written by the test's update mode)

**Interfaces:**
- Produces: `encodeInput(f: InputFrame): number` (bits: left=1, right=2, up=4, down=8, attack=16, jump=32, special=64, start=128, coin=256), `decodeInput(n): InputFrame`, `runReplay(seed, encoded: number[]): { state, hash }`, golden JSON shape `{ "seed": number, "inputs": number[], "hash": string }`. Env `UPDATE_GOLDENS=1` rewrites goldens.

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/input-codec.test.ts
import { describe, it, expect } from 'vitest';
import { encodeInput, decodeInput } from '@core/input-codec';
import { EMPTY_INPUT } from '@core/types';

describe('input codec', () => {
  it('round-trips every single button', () => {
    for (const k of Object.keys(EMPTY_INPUT) as Array<keyof typeof EMPTY_INPUT>) {
      const f = { ...EMPTY_INPUT, [k]: true };
      expect(decodeInput(encodeInput(f))).toEqual(f);
    }
  });
  it('uses the documented bit order', () => {
    expect(encodeInput({ ...EMPTY_INPUT, left: true })).toBe(1);
    expect(encodeInput({ ...EMPTY_INPUT, coin: true })).toBe(256);
    expect(encodeInput({ ...EMPTY_INPUT, attack: true, jump: true })).toBe(48);
  });
});
```

```ts
// test/core/determinism.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { runReplay } from '@core/sim/replay';
import { encodeInput } from '@core/input-codec';
import { EMPTY_INPUT } from '@core/types';

function syntheticInputs(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(encodeInput({
      ...EMPTY_INPUT,
      right: i % 120 < 80, up: i % 200 < 50, down: i % 200 >= 150,
      jump: i % 90 === 0, attack: i % 37 === 0,
    }));
  }
  return out;
}

describe('determinism', () => {
  it('same seed + same input log => same hash', () => {
    const inputs = syntheticInputs(600);
    expect(runReplay(7, inputs).hash).toBe(runReplay(7, inputs).hash);
  });
  it('different inputs => different hash', () => {
    const a = syntheticInputs(600), b = syntheticInputs(600); b[10] = 0;
    expect(runReplay(7, a).hash).not.toBe(runReplay(7, b).hash);
  });
  it('matches the committed golden test/replays/locomotion-01.json', () => {
    const path = 'test/replays/locomotion-01.json';
    const inputs = syntheticInputs(600);
    const { hash } = runReplay(7, inputs);
    if (process.env.UPDATE_GOLDENS === '1' || !existsSync(path)) {
      writeFileSync(path, JSON.stringify({ seed: 7, inputs, hash }, null, 0) + '\n');
    }
    const golden = JSON.parse(readFileSync(path, 'utf8')) as { seed: number; inputs: number[]; hash: string };
    expect(runReplay(golden.seed, golden.inputs).hash).toBe(golden.hash);
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run test/core/input-codec.test.ts test/core/determinism.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/input-codec.ts
import type { InputFrame } from './types';
const ORDER: Array<keyof InputFrame> = ['left', 'right', 'up', 'down', 'attack', 'jump', 'special', 'start', 'coin'];
export function encodeInput(f: InputFrame): number {
  let n = 0;
  ORDER.forEach((k, i) => { if (f[k]) n |= 1 << i; });
  return n;
}
export function decodeInput(n: number): InputFrame {
  const f = { left: false, right: false, up: false, down: false, attack: false, jump: false, special: false, start: false, coin: false };
  ORDER.forEach((k, i) => { f[k] = (n & (1 << i)) !== 0; });
  return f;
}
```

```ts
// src/core/sim/replay.ts
import { decodeInput } from '../input-codec';
import type { WorldState } from './state';
import { createWorld } from './state';
import { tick } from './tick';
import { hashState } from './hash';

export function runReplay(seed: number, encoded: number[], world: WorldState = createWorld(seed)): { state: WorldState; hash: string } {
  for (const n of encoded) tick(world, decodeInput(n));
  return { state: world, hash: hashState(world) };
}
```

`test/replays/README.md`:
```
Replay goldens: { seed, inputs (encoded InputFrame per tick, see src/core/input-codec.ts), hash (hashState after the last tick) }.
Regenerate deliberately with `UPDATE_GOLDENS=1 npm test` and commit the change with the reason in the commit body.
A golden changing without an intended sim change is a determinism regression.
```

- [ ] **Step 4: Run tests twice (first run writes the golden, second proves it)** — `npm test && npm test` — Expected: all passed both times; `test/replays/locomotion-01.json` exists.

- [ ] **Step 5: Commit**

```bash
git add src/core/input-codec.ts src/core/sim/replay.ts test/core/input-codec.test.ts test/core/determinism.test.ts test/replays/README.md test/replays/locomotion-01.json
git commit -m "feat(core): input codec, replay runner and determinism golden"
```

### Task 5.5: Keyboard and gamepad input sources

**Files:**
- Create: `src/adapters/phaser/input/keyboard.ts`, `src/adapters/phaser/input/gamepad.ts`, `src/adapters/phaser/input/compose.ts`

**Interfaces:**
- Produces: `interface InputSource { read(): InputFrame }`; `KeyboardSource(scene)`; `GamepadSource` with `read()`, `connected: boolean`, `hadGamepad: boolean`, `onDisconnect(cb)`, `onConnect(cb)`; `composeInput(sources: InputSource[]): InputFrame` (OR of all).

- [ ] **Step 1: Write the keyboard source**

```ts
// src/adapters/phaser/input/keyboard.ts
import Phaser from 'phaser';
import type { InputFrame } from '@core/types';

export interface InputSource { read(): InputFrame }

const K = Phaser.Input.Keyboard.KeyCodes;

export class KeyboardSource implements InputSource {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('keyboard plugin unavailable');
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN,
      a: K.A, d: K.D, w: K.W, s: K.S,
      attack: K.J, jump: K.K, special: K.L, start: K.ENTER, coin: K.FIVE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture([K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE]); // stop page scroll
  }
  read(): InputFrame {
    const d = (n: string) => this.keys[n]?.isDown === true;
    return {
      left: d('left') || d('a'), right: d('right') || d('d'), up: d('up') || d('w'), down: d('down') || d('s'),
      attack: d('attack'), jump: d('jump'), special: d('special'), start: d('start'), coin: d('coin'),
    };
  }
}
```

- [ ] **Step 2: Write the gamepad source (direct Gamepad API, standard mapping)**

```ts
// src/adapters/phaser/input/gamepad.ts
import type { InputFrame } from '@core/types';
import { EMPTY_INPUT } from '@core/types';
import type { InputSource } from './keyboard';

const DEADZONE = 0.5;
// W3C standard mapping indices
const BTN = { south: 0, east: 1, west: 2, select: 8, start: 9, dUp: 12, dDown: 13, dLeft: 14, dRight: 15 } as const;

export class GamepadSource implements InputSource {
  connected = false;
  hadGamepad = false;
  private disconnectCbs: Array<() => void> = [];
  private connectCbs: Array<() => void> = [];

  constructor() {
    window.addEventListener('gamepadconnected', () => { this.connected = true; this.hadGamepad = true; this.connectCbs.forEach((f) => f()); });
    window.addEventListener('gamepaddisconnected', () => { this.connected = this.first() !== null; if (!this.connected) this.disconnectCbs.forEach((f) => f()); });
  }
  onDisconnect(cb: () => void): void { this.disconnectCbs.push(cb); }
  onConnect(cb: () => void): void { this.connectCbs.push(cb); }

  private first(): Gamepad | null {
    for (const g of navigator.getGamepads?.() ?? []) if (g && g.connected) return g;
    return null;
  }

  read(): InputFrame {
    const g = this.first();
    if (!g) return { ...EMPTY_INPUT };
    this.connected = true; this.hadGamepad = true;
    const b = (i: number) => g.buttons[i]?.pressed === true;
    const ax = g.axes[0] ?? 0, ay = g.axes[1] ?? 0;
    return {
      left: b(BTN.dLeft) || ax < -DEADZONE, right: b(BTN.dRight) || ax > DEADZONE,
      up: b(BTN.dUp) || ay < -DEADZONE, down: b(BTN.dDown) || ay > DEADZONE,
      attack: b(BTN.west), jump: b(BTN.south), special: b(BTN.east),
      start: b(BTN.start), coin: b(BTN.select),
    };
  }
}
```

- [ ] **Step 3: Write the composer**

```ts
// src/adapters/phaser/input/compose.ts
import type { InputFrame } from '@core/types';
import { EMPTY_INPUT } from '@core/types';
import type { InputSource } from './keyboard';

export function composeInput(sources: InputSource[]): InputFrame {
  const out = { ...EMPTY_INPUT };
  for (const s of sources) {
    const f = s.read();
    for (const k of Object.keys(out) as Array<keyof InputFrame>) out[k] = out[k] || f[k];
  }
  return out;
}
```

- [ ] **Step 4: Typecheck + lint + commit**

```bash
npm run typecheck && npm run lint
git add src/adapters/phaser/input
git commit -m "feat(adapter): keyboard and gamepad input sources composed into InputFrame"
```

### Task 5.6: GameScene drives the sim; box views; pause on hidden tab / gamepad loss

**Files:**
- Create: `src/adapters/phaser/views/EntityView.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`

**Interfaces:**
- Produces: `GameScene.world: WorldState`, `GameScene.paused: boolean`, `GameScene.pauseReason: string | null`; `EntityViews` class with `sync(state: WorldState)`; box size table `BOX_SIZE: Record<EntityKind, {w,h,color}>`.

- [ ] **Step 1: Write the box view**

```ts
// src/adapters/phaser/views/EntityView.ts
import Phaser from 'phaser';
import type { Entity, EntityKind } from '@core/sim/entity';
import type { WorldState } from '@core/sim/state';

export const BOX_SIZE: Record<EntityKind, { w: number; h: number; color: number }> = {
  hero: { w: 20, h: 56, color: 0x4fc3f7 },
  brawler: { w: 22, h: 56, color: 0xef5350 },
  knife: { w: 16, h: 52, color: 0xffa726 },
  heavy: { w: 30, h: 60, color: 0xab47bc },
  feral: { w: 40, h: 28, color: 0x66bb6a },
  boss: { w: 48, h: 120, color: 0xd81b60 },
  crate: { w: 24, h: 24, color: 0x8d6e63 },
  pickup: { w: 12, h: 12, color: 0xffd54f },
  weaponPickup: { w: 20, h: 10, color: 0x80deea },
  projectile: { w: 8, h: 8, color: 0xff7043 },
};

export class EntityViews {
  private views = new Map<number, Phaser.GameObjects.Rectangle>();
  constructor(private scene: Phaser.Scene, private layer: Phaser.GameObjects.Layer) {}

  sync(state: WorldState): void {
    const alive = new Set<number>();
    for (const e of state.entities) {
      alive.add(e.id);
      let v = this.views.get(e.id);
      if (!v) {
        const s = BOX_SIZE[e.kind];
        v = this.scene.add.rectangle(0, 0, s.w, s.h, s.color).setOrigin(0.5, 1);
        this.layer.add(v);
        this.views.set(e.id, v);
      }
      this.place(v, e, state);
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { v.destroy(); this.views.delete(id); }
    this.layer.sort('depth'); // depth set to pos.y below → draw order = y sort
  }

  private place(v: Phaser.GameObjects.Rectangle, e: Entity, state: WorldState): void {
    v.setPosition(Math.round(e.pos.x - state.camera.x), Math.round(e.pos.y - e.pos.z));
    v.setDepth(e.pos.y);
    v.setScale(e.facing, 1);
    v.setFillStyle(e.flashFrames > 0 ? 0xffffff : BOX_SIZE[e.kind].color, e.invulnFrames > 0 && state.frame % 4 < 2 ? 0.4 : 1);
  }
}
```

- [ ] **Step 2: Rewrite `GameScene` as the fixed-step driver**

```ts
// src/adapters/phaser/scenes/GameScene.ts
import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting, setSetting } from '@shell/settings';
import { enableCrt, crtInstance } from '../crt/CrtPipeline';
import { createWorld, WALK_BAND } from '@core/sim/state';
import type { WorldState } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { createFixedStep, advanceFixedStep, resetFixedStep } from '@core/sim/loop';
import { KeyboardSource } from '../input/keyboard';
import { GamepadSource } from '../input/gamepad';
import { composeInput } from '../input/compose';
import { EntityViews } from '../views/EntityView';

export class GameScene extends Phaser.Scene {
  world!: WorldState;
  paused = false;
  pauseReason: string | null = null;
  private crtOn = true;
  private fixed = createFixedStep();
  private keyboard!: KeyboardSource;
  private gamepad!: GamepadSource;
  private views!: EntityViews;
  private pauseText!: Phaser.GameObjects.Text;

  constructor() { super('game'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.applyZoom((this.registry.get('scale') as number | undefined) ?? 1);
    this.game.events.on('rescale', (k: number) => this.applyZoom(k));
    this.crtOn = getSetting('crt');
    enableCrt(this, this.crtOn);
    this.input.keyboard?.on('keydown-C', () => this.setCrt(!this.crtOn));
    if (new URLSearchParams(location.search).has('pattern')) this.scene.launch('pattern');

    this.world = createWorld(1);
    const g = this.add.graphics();
    g.lineStyle(1, 0x333333, 1); g.strokeRect(0, WALK_BAND.minY, BASE_W, WALK_BAND.maxY - WALK_BAND.minY);
    this.views = new EntityViews(this, this.add.layer());

    this.keyboard = new KeyboardSource(this);
    this.gamepad = new GamepadSource();
    this.gamepad.onDisconnect(() => this.pause('CONTROLLER DISCONNECTED'));
    this.gamepad.onConnect(() => this.resume());
    this.input.keyboard?.on('keydown', () => { if (this.pauseReason === 'CONTROLLER DISCONNECTED') this.resume(); });

    this.pauseText = this.add.text(BASE_W / 2, BASE_H / 2, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5).setDepth(1000).setVisible(false);
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.pause('PAUSED'));
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => { if (this.pauseReason === 'PAUSED') this.resume(); });
  }

  pause(reason: string): void { this.paused = true; this.pauseReason = reason; this.pauseText.setText(reason).setVisible(true); }
  resume(): void { this.paused = false; this.pauseReason = null; this.pauseText.setVisible(false); resetFixedStep(this.fixed); }

  override update(_time: number, delta: number): void {
    if (this.paused) return;
    const input = composeInput([this.keyboard, this.gamepad]);
    advanceFixedStep(this.fixed, delta, () => tick(this.world, input));
    this.views.sync(this.world);
  }

  setCrt(on: boolean): void {
    this.crtOn = on;
    enableCrt(this, on);
    if (this.scene.isActive('pattern')) enableCrt(this.scene.get('pattern'), on);
    setSetting('crt', on);
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
    crtInstance(this)?.setScale(k);
  }
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`. Expected: a blue box walks with arrows/WASD, moves up/down only within the outlined band, jumps with K (about 0.6 s airtime), flips facing. Plug in a gamepad: stick/d-pad moves, South jumps. Unplug: "CONTROLLER DISCONNECTED" appears and the box freezes; any key or re-plug resumes. Switch tabs for 10 s and return: the box has not moved (no catch-up burst).

- [ ] **Step 4: Full gate + commit**

```bash
npm run check
git add src/adapters/phaser/views/EntityView.ts src/adapters/phaser/scenes/GameScene.ts
git commit -m "feat(adapter): drive the core sim at 60Hz with box views and pause handling"
```

**Ticket 05 verification gate:** all six acceptance boxes ticked; `npm run check` green; `test/replays/locomotion-01.json` committed.

---

# Ticket 20 — Cabinet shell DOM: bezel, marquee, vignette, rescale, ≤768 card, SERVICE, failure handling

**Delivers:** the canvas sits in an illustrated cabinet in a dark room with a lit marquee and vignette; resize keeps integer scale and centring; ≤768 px shows a static "desktop required" card; asset failures land on a SERVICE screen with a retry key; audio unlock is silent-on-failure. Placeholder marquee/bezel art until ticket 21.

### Task 20.1: Viewport gate (pure rule + DOM card)

**Files:**
- Create: `src/shell/viewport-gate.ts`, `test/shell/viewport-gate.test.ts`
- Modify: `src/styles/room.css`, `src/main.ts`

**Interfaces:**
- Produces: `GATE_MAX_WIDTH = 768`, `shouldGate(viewportWidth: number): boolean`, `installViewportGate(onChange: (gated: boolean) => void): () => boolean` (returns current-state getter; re-evaluates on `resize` and `orientationchange`).

- [ ] **Step 1: Write the failing test**

```ts
// test/shell/viewport-gate.test.ts
import { describe, it, expect } from 'vitest';
import { shouldGate, GATE_MAX_WIDTH } from '@shell/viewport-gate';

describe('viewport gate', () => {
  it('gates at and below 768 and not above', () => {
    expect(GATE_MAX_WIDTH).toBe(768);
    expect(shouldGate(320)).toBe(true);
    expect(shouldGate(768)).toBe(true);
    expect(shouldGate(769)).toBe(false);
    expect(shouldGate(1920)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/shell/viewport-gate.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/shell/viewport-gate.ts
export const GATE_MAX_WIDTH = 768;
export const shouldGate = (viewportWidth: number): boolean => viewportWidth <= GATE_MAX_WIDTH;

const CARD_HTML = `
  <div class="gate-card" role="status">
    <img class="gate-logo" src="/assets/ui/marquee-small.png" alt="SLAG CITY" width="160" height="48" />
    <h1>Desktop browser required</h1>
    <p>Keyboard or gamepad only — this cabinet doesn't run on phones.</p>
    <p>Visit on a desktop browser to play.</p>
  </div>`;

/** Shows the card and hides the cabinet while the viewport is ≤ GATE_MAX_WIDTH. Returns a getter for the current state. */
export function installViewportGate(onChange: (gated: boolean) => void): () => boolean {
  const gate = document.getElementById('gate');
  const room = document.getElementById('room');
  if (!gate || !room) throw new Error('#gate/#room missing');
  gate.innerHTML = CARD_HTML;
  let gated: boolean | null = null;
  const evaluate = (): void => {
    const next = shouldGate(window.innerWidth);
    if (next === gated) return;
    gated = next;
    gate.hidden = !next;
    room.hidden = next;
    onChange(next);
  };
  window.addEventListener('resize', evaluate);
  window.addEventListener('orientationchange', evaluate);
  evaluate();
  return () => gated === true;
}
```

Append to `room.css`:
```css
#gate { position: fixed; inset: 0; display: grid; place-items: center; background: var(--room); padding: 16px; box-sizing: border-box; }
#gate[hidden] { display: none; }
.gate-card { width: min(90vw, 420px); max-width: 100%; box-sizing: border-box; padding: 24px; border: 2px solid #6b5a2e; background: #141117; color: #d9d2c5; font: 16px/1.5 ui-monospace, Menlo, Consolas, monospace; text-align: center; }
.gate-card h1 { font-size: 20px; margin: 16px 0 8px; }
.gate-card p { margin: 8px 0; }
.gate-logo { max-width: 100%; height: auto; image-rendering: pixelated; }
```

Replace the bottom of `src/main.ts` (from `let lastK` down) with:
```ts
import { installViewportGate } from '@shell/viewport-gate';

let game: Phaser.Game | null = null;
let lastK = currentScale();
const isGated = installViewportGate((gated) => {
  if (!gated && !game) { lastK = currentScale(); game = createGame(screen, lastK); }
});
window.addEventListener('resize', () => {
  if (isGated() || !game) return;
  const k = currentScale();
  if (k !== lastK) { lastK = k; applyScale(game, k); }
});
```
(Move the `import` to the top of the file with the others. The Canvas-renderer notice block from ticket 02 moves inside the `!gated && !game` branch, right after `createGame`.) Create a temporary placeholder `assets/ui/marquee-small.png` (160×48, any dark PNG made with `sharp`: `node -e "require('sharp')({create:{width:160,height:48,channels:4,background:'#2a1f14'}}).png().toFile('assets/ui/marquee-small.png')"`) — install `sharp` as a dev dependency now (`npm i -D sharp`); ticket 21 replaces the file. Vite serves `/assets/...` from the project root only if the folder is `public/`; so put static UI assets under `public/assets/ui/` and reference `/assets/ui/...`. Use `public/assets/ui/marquee-small.png` here and keep generated game atlases under `public/assets/` too (ticket 03 onwards); `assets/sources/`, `assets/palette.json` and `assets/LICENSES.md` stay outside `public/` (not shipped).

- [ ] **Step 4: Run tests + browser check**

Run: `npx vitest run test/shell/viewport-gate.test.ts` — Expected: pass.
Run `npm run dev`; in DevTools device toolbar set 375×667: card visible, cabinet gone, `document.documentElement.scrollWidth === window.innerWidth`. Set 320×568: same, no horizontal scroll. Set 768×1024: card. Set 769×1024: cabinet returns and the game boots. Rotate (landscape 667×375): still gated.

- [ ] **Step 5: Commit**

```bash
git add src/shell/viewport-gate.ts test/shell/viewport-gate.test.ts src/styles/room.css src/main.ts public/assets/ui/marquee-small.png package.json package-lock.json
git commit -m "feat(shell): gate viewports at or below 768px with a static desktop-required card"
```

### Task 20.2: Cabinet layers — bezel, marquee glow, vignette, chrome-aware scale

**Files:**
- Create: `src/shell/cabinet.ts`, `public/assets/ui/bezel-placeholder.png`, `public/assets/ui/marquee-placeholder.png`
- Modify: `src/styles/room.css`, `src/main.ts`

**Interfaces:**
- Produces: `installCabinet(): { chromeHeight(): number }` — sets `--marquee-h` / `--panel-h`, injects marquee `<img>` and vignette; `main.ts` uses `chromeHeight()` for `computeIntegerScale`.

- [ ] **Step 1: Placeholder art (replaced in 21)**

Run (creates flat dark PNGs; marquee 768×160, bezel frame is CSS-only until 21):
```bash
node -e "const s=require('sharp');s({create:{width:768,height:160,channels:4,background:'#3a2a12'}}).png().toFile('public/assets/ui/marquee-placeholder.png')"
```

- [ ] **Step 2: Cabinet module**

```ts
// src/shell/cabinet.ts
const MARQUEE_H = 120;   // CSS px reserved above the screen
const PANEL_H = 56;      // CSS px control-panel suggestion below the screen

export function installCabinet(): { chromeHeight(): number } {
  const root = document.documentElement;
  root.style.setProperty('--marquee-h', `${MARQUEE_H}px`);
  root.style.setProperty('--panel-h', `${PANEL_H}px`);
  const marquee = document.getElementById('marquee');
  const cabinet = document.getElementById('cabinet');
  if (!marquee || !cabinet) throw new Error('#marquee/#cabinet missing');
  const img = document.createElement('img');
  img.src = '/assets/ui/marquee-placeholder.png';
  img.alt = '';
  img.decoding = 'async';
  marquee.replaceChildren(img);
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.setAttribute('aria-hidden', 'true');
  cabinet.appendChild(panel);
  return { chromeHeight: () => MARQUEE_H + PANEL_H + 2 * BEZEL_PAD };
}
export const BEZEL_PAD = 24; // CSS px of bezel frame around the screen on each side
```

Append to `room.css`:
```css
#marquee { height: var(--marquee-h); display: grid; place-items: end center; position: relative; }
#marquee img { max-height: calc(var(--marquee-h) - 16px); width: auto; image-rendering: pixelated; position: relative; z-index: 1; }
#marquee::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 90% at 50% 100%, rgba(255, 170, 60, 0.35), rgba(255, 120, 30, 0.08) 60%, transparent 80%); }
#bezel { padding: 24px; background: linear-gradient(180deg, #2b2320, #171214); border: 2px solid #4a3a22; box-shadow: inset 0 0 0 2px #0a0709, 0 0 40px rgba(255, 140, 40, 0.15); }
#panel { height: var(--panel-h); width: 100%; background: linear-gradient(180deg, #1e1815, #0f0b0c); border-top: 2px solid #4a3a22; }
#vignette { background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%); }
```

In `src/main.ts`, before the gate install: `const cabinet = installCabinet();` and change `chromeH` to `() => cabinet.chromeHeight()`. Remove the CSS-var parsing version.

- [ ] **Step 3: Browser check**

Run `npm run dev`. Expected: dark room → bezel frame → glowing marquee band above → canvas → vignette darkening the corners (over the canvas, `pointer-events: none`). At 1920×1080 the canvas is ×3 (chrome 224 px leaves 856 px ≥ 672). Resize continuously: only integer jumps, always centred. Take a screenshot into `docs/verification/20-cabinet-1080p.png`.

- [ ] **Step 4: Commit**

```bash
git add src/shell/cabinet.ts src/styles/room.css src/main.ts public/assets/ui/marquee-placeholder.png docs/verification/20-cabinet-1080p.png
git commit -m "feat(shell): cabinet bezel, marquee glow and vignette around the integer-scaled screen"
```

### Task 20.3: SERVICE screen + BootScene loader failure path

**Files:**
- Create: `src/shell/service-screen.ts`, `src/adapters/phaser/scenes/BootScene.ts`
- Modify: `src/adapters/phaser/createGame.ts`, `src/styles/room.css`

**Interfaces:**
- Produces: `showService(assetId: string, retry: () => void): void`, `hideService(): void`; `BootScene` (key `'boot'`) with `static readonly MANIFEST: Array<{ key: string; type: 'image' | 'atlas' | 'audio'; url: string; atlasJson?: string }>` that later tickets append to; on `loaderror` → `console.error('[asset] failed: <key>')` + `showService(key, retry)`; on complete → `scene.start('game')`. Retry key: `R` (DOM keydown), also gamepad Start via polling.

- [ ] **Step 1: Service screen module**

```ts
// src/shell/service-screen.ts
let retryHandler: (() => void) | null = null;
let listening = false;

export function showService(assetId: string, retry: () => void): void {
  const el = document.getElementById('service');
  if (!el) throw new Error('#service missing');
  retryHandler = retry;
  el.innerHTML = `
    <pre class="service-text">SERVICE MODE

ASSET LOAD ERROR
  ID: ${escapeHtml(assetId)}

PRESS R (OR GAMEPAD START) TO RETRY
TIP: THE C KEY TOGGLES THE CRT PASS IF THE PICTURE IS TOO INTENSE
${import.meta.env.DEV ? '\n(dev) see console for the failing URL' : ''}</pre>`;
  el.hidden = false;
  if (!listening) {
    listening = true;
    window.addEventListener('keydown', (ev) => { if (ev.key === 'r' || ev.key === 'R') triggerRetry(); });
    const poll = (): void => {
      if (!el.hidden) for (const g of navigator.getGamepads?.() ?? []) if (g?.buttons[9]?.pressed) { triggerRetry(); break; }
      requestAnimationFrame(poll);
    };
    requestAnimationFrame(poll);
  }
}
export function hideService(): void {
  const el = document.getElementById('service');
  if (el) { el.hidden = true; el.innerHTML = ''; }
  retryHandler = null;
}
function triggerRetry(): void { const h = retryHandler; if (h) { hideService(); h(); } }
function escapeHtml(s: string): string { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)); }
```

Append to `room.css`:
```css
#service { position: fixed; inset: 0; background: #000; color: #d9d2c5; display: grid; place-items: center; z-index: 10; }
#service[hidden] { display: none; }
.service-text { font: 14px/1.6 ui-monospace, Menlo, Consolas, monospace; margin: 0; white-space: pre; }
```

- [ ] **Step 2: BootScene**

```ts
// src/adapters/phaser/scenes/BootScene.ts
import Phaser from 'phaser';
import { showService } from '@shell/service-screen';

export interface AssetEntry { key: string; type: 'image' | 'atlas' | 'audio'; url: string; atlasJson?: string }

export class BootScene extends Phaser.Scene {
  /** Later tickets push entries here (atlases in 03/12/13/16, backgrounds in 04/17, fonts in 09, audio in 22). */
  static readonly MANIFEST: AssetEntry[] = [];
  constructor() { super('boot'); }

  preload(): void {
    for (const a of BootScene.MANIFEST) this.enqueue(a);
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('failasset')) {
      this.load.image('dev-missing', '/assets/does-not-exist.png');
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error(`[asset] failed: ${file.key} (${file.src})`);
      this.failed.push(file.key);
    });
  }

  private failed: string[] = [];

  create(): void {
    if (this.failed.length > 0) {
      const id = this.failed[0] as string;
      showService(id, () => { this.failed = []; this.scene.restart(); });
      return;
    }
    this.scene.start('game');
  }

  private enqueue(a: AssetEntry): void {
    if (a.type === 'image') this.load.image(a.key, a.url);
    else if (a.type === 'atlas') this.load.atlas(a.key, a.url, a.atlasJson);
    else this.load.audio(a.key, a.url);
  }
}
```

In `createGame.ts`: `scene: [BootScene, GameScene, TestPatternScene]` (BootScene first → it starts `game`).

- [ ] **Step 3: Browser check**

Run `npm run dev`, open `http://localhost:5173/?failasset`. Expected: black SERVICE screen naming `dev-missing`, console shows `[asset] failed: dev-missing (...)`. Press `R`: it retries (fails again since the file is still missing — the screen re-appears; that proves the loop). Open without the flag: game boots normally.

- [ ] **Step 4: Commit**

```bash
git add src/shell/service-screen.ts src/adapters/phaser/scenes/BootScene.ts src/adapters/phaser/createGame.ts src/styles/room.css
git commit -m "feat(shell): arcade SERVICE screen on asset load failure with R/Start retry"
```

### Task 20.4: Audio unlock on first keypress, silent on failure

**Files:**
- Create: `src/adapters/phaser/audio/unlock.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces: `installAudioUnlock(game: Phaser.Game): void` — on each `keydown`/`gamepadconnected`/first gamepad button, tries `game.sound.unlock()`; stops listening once `game.sound.locked === false`; never throws.

- [ ] **Step 1: Implement**

```ts
// src/adapters/phaser/audio/unlock.ts
import type Phaser from 'phaser';

export function installAudioUnlock(game: Phaser.Game): void {
  const tryUnlock = (): void => {
    try {
      if (!game.sound.locked) { window.removeEventListener('keydown', tryUnlock); return; }
      game.sound.unlock();
      const ctx = (game.sound as Phaser.Sound.WebAudioSoundManager).context;
      if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => { /* retry on next gesture */ });
    } catch { /* silent: retry on the next gesture */ }
  };
  window.addEventListener('keydown', tryUnlock);
}
```

In `main.ts`, right after `game = createGame(...)`: `installAudioUnlock(game);` (import at top).

- [ ] **Step 2: Browser check**

Run `npm run dev`; in the console before any key: `game.sound.locked` may be `true`. Press any key: subsequently `false` (expose `game` on `window` only in DEV: `if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;`).

- [ ] **Step 3: Commit**

```bash
git add src/adapters/phaser/audio/unlock.ts src/main.ts
git commit -m "feat(adapter): unlock audio on first keypress, silently retrying on failure"
```

**Ticket 20 verification gate:** the six acceptance boxes, verified in a real browser at ~375 px, ~768 px and desktop; screenshots in `docs/verification/`; `npm run check` green.

---

# Ticket 06 — Combat tracer: 3-hit combo vs one brawler, with hit-feel

**Delivers:** hero fights one brawler with a buffered three-hit combo; hits land with hitstop, screen shake, a white flash and a launch on the third hit; the brawler is hurt, knocked down and gets up invulnerable; the brawler hits back. First "does it feel like 1993?" read on boxes (⛔ owner S3 early read at the end).

### Task 6.1: Hit rule with the depth tolerance, hit-feel config, score table

**Files:**
- Create: `src/core/combat/hit.ts`, `src/core/combat/hit-feel.ts`, `src/core/arcade/score.ts`, `test/core/combat/hit.test.ts`

**Interfaces:**
- Produces: `DEPTH_TOLERANCE = 8`; `WorldBox { x1, x2, z1, z2 }`; `worldRect(e: Entity, r: Rect): WorldBox`; `boxesOverlap(a, b): boolean`; `hitConnects(att: Entity, hitbox: Rect, vic: Entity, hurtbox: Rect): boolean`; `HIT_FEEL` constants; `SCORE = { hit: 100, ko: 500, gear: 200, crate: 50, boss: 5000 }`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/combat/hit.test.ts
import { describe, it, expect } from 'vitest';
import { createEntity } from '@core/sim/entity';
import { hitConnects, worldRect, DEPTH_TOLERANCE } from '@core/combat/hit';

const hitbox = { x: 8, y: 24, w: 26, h: 16 };
const hurtbox = { x: -10, y: 0, w: 20, h: 56 };

describe('hit rule', () => {
  it('flips the hitbox with facing', () => {
    const e = createEntity(1, 'hero', 100, 160);
    expect(worldRect(e, hitbox)).toEqual({ x1: 108, x2: 134, z1: 24, z2: 40 });
    e.facing = -1;
    expect(worldRect(e, hitbox)).toEqual({ x1: 66, x2: 92, z1: 24, z2: 40 });
  });
  it('connects at |dy| = 8 and not at 9 (boundary)', () => {
    const a = createEntity(1, 'hero', 100, 160);
    const v = createEntity(2, 'brawler', 120, 160 + DEPTH_TOLERANCE);
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(true);
    v.pos.y = 160 + DEPTH_TOLERANCE + 1;
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
    v.pos.y = 160 - DEPTH_TOLERANCE;
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(true);
  });
  it('requires x overlap and vertical (z) overlap', () => {
    const a = createEntity(1, 'hero', 100, 160);
    const v = createEntity(2, 'brawler', 200, 160);
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
    v.pos.x = 120; v.pos.z = 41; // hurtbox 41..97 vs hitbox 24..40 → no overlap
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
    v.pos.z = 39;
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(true);
  });
  it('touching edges do not count as overlap', () => {
    const a = createEntity(1, 'hero', 100, 160);
    const v = createEntity(2, 'brawler', 144, 160); // hurtbox x1 = 134 == hitbox x2
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/core/combat/hit.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/combat/hit.ts
import type { Rect } from '../types';
import type { Entity } from '../sim/entity';

/** Hit rule (Solution-PRD §3): boxes overlap in x and z, and |Δy| ≤ DEPTH_TOLERANCE. */
export const DEPTH_TOLERANCE = 8;
export interface WorldBox { x1: number; x2: number; z1: number; z2: number }

export function worldRect(e: Entity, r: Rect): WorldBox {
  const x1 = e.facing === 1 ? e.pos.x + r.x : e.pos.x - r.x - r.w;
  return { x1, x2: x1 + r.w, z1: e.pos.z + r.y, z2: e.pos.z + r.y + r.h };
}
export function boxesOverlap(a: WorldBox, b: WorldBox): boolean {
  return a.x1 < b.x2 && b.x1 < a.x2 && a.z1 < b.z2 && b.z1 < a.z2;
}
export function hitConnects(att: Entity, hitbox: Rect, vic: Entity, hurtbox: Rect): boolean {
  if (Math.abs(att.pos.y - vic.pos.y) > DEPTH_TOLERANCE) return false;
  return boxesOverlap(worldRect(att, hitbox), worldRect(vic, hurtbox));
}
```

```ts
// src/core/combat/hit-feel.ts
/** THE hit-feel file (Solution-PRD §3). Change numbers here, nowhere else. */
export const HIT_FEEL = {
  hitstop: { light: 3, heavy: 5, launch: 8 },
  shakePx: { light: 0, heavy: 2, launch: 2 },
  shakeFrames: 6,
  flashFrames: 2,
  hitstun: { light: 14, heavy: 20 },
  launch: { vz: 3.5, vx: 2.5 },
  downFrames: 30,
  getupFrames: 20,
  getupGraceFrames: 10,
} as const;
```

```ts
// src/core/arcade/score.ts
export const SCORE = { hit: 100, ko: 500, gear: 200, crate: 50, boss: 5000 } as const;
```

- [ ] **Step 4: Run tests** — Expected: 4 passed. **Commit:**

```bash
git add src/core/combat/hit.ts src/core/combat/hit-feel.ts src/core/arcade/score.ts test/core/combat/hit.test.ts
git commit -m "feat(core): depth-tolerant hit rule, hit-feel constants and score table"
```

### Task 6.2: Hit resolution, knockdown/getup path, stun-state updater

**Files:**
- Create: `src/core/combat/resolve.ts`, `src/core/combat/stun.ts`, `test/core/combat/resolve.test.ts`
- Modify: `src/core/sim/tick.ts` (register `resolveHits`)

**Interfaces:**
- Produces: `activeMove(e): MoveData | null`; `canHit(att, vic): boolean`; `applyHit(state, att, vic, move): void`; `applyKnockdown(state, vic, dir: Facing): void`; `resolveHits(state): void`; `updateStunState(state, e): boolean` (handles `hurt`, `knockdown`, `down`, `getup`, `dead`; returns true if the entity was in one of them). KO rule: `hp <= 0` → knockdown; on landing with `hp <= 0` → `dead` (`removeIn = 40` for non-hero; hero handled in 07).

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/combat/resolve.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, spawn } from '@core/sim/state';
import { registerActorData, HERO_DATA } from '@core/combat/frame-data';
import { applyHit, applyKnockdown, resolveHits } from '@core/combat/resolve';
import { updateStunState } from '@core/combat/stun';
import { HIT_FEEL } from '@core/combat/hit-feel';
import { setState } from '@core/sim/entity';
import { applyPhysics } from '@core/sim/physics';

const DUMMY = { ...HERO_DATA, hp: 30, moves: {} };
registerActorData('brawler', DUMMY);
const light = { startup: 3, active: 3, recovery: 8, hitbox: { x: 8, y: 24, w: 26, h: 16 }, damage: 6, level: 'light' as const, pushback: 2 };
const launch = { ...light, level: 'launch' as const, damage: 10 };

describe('applyHit', () => {
  it('sets hitstop 3/5/8 by level, flash 2, damage and pushback', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30;
    applyHit(w, h, v, light);
    expect(w.hitstop).toBe(HIT_FEEL.hitstop.light);
    expect(v.flashFrames).toBe(2);
    expect(v.hp).toBe(24);
    expect(v.vel.x).toBe(2);
    expect(v.state).toBe('hurt');
    expect(w.events.some((e) => e.type === 'hit')).toBe(true);
    applyHit(w, h, v, { ...light, level: 'heavy' });
    expect(w.hitstop).toBe(HIT_FEEL.hitstop.heavy);
    expect(w.shake.px).toBe(2);
    applyHit(w, h, v, launch);
    expect(w.hitstop).toBe(HIT_FEEL.hitstop.launch);
    expect(v.state).toBe('knockdown');
    expect(v.vel.z).toBe(HIT_FEEL.launch.vz);
  });
  it('super-armour takes damage but no hitstun', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30; v.armorFrames = 5; setState(v, 'windup');
    applyHit(w, h, v, light);
    expect(v.hp).toBe(24);
    expect(v.state).toBe('windup');
  });
  it('knockdown → down → getup (invulnerable) → idle', () => {
    const w = createWorld(1);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30;
    applyKnockdown(w, v, 1);
    let n = 0;
    while (v.state === 'knockdown' && n++ < 100) { applyPhysics(w); v.stateFrame++; updateStunState(w, v); }
    expect(v.state).toBe('down');
    for (let i = 0; i < HIT_FEEL.downFrames; i++) { v.stateFrame++; updateStunState(w, v); }
    expect(v.state).toBe('getup');
    expect(v.invulnFrames).toBeGreaterThan(HIT_FEEL.getupFrames);
    for (let i = 0; i < HIT_FEEL.getupFrames; i++) { v.stateFrame++; updateStunState(w, v); }
    expect(v.state).toBe('idle');
    expect(v.invulnFrames).toBe(HIT_FEEL.getupGraceFrames);
  });
  it('a hit on an invulnerable victim is ignored', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30; v.invulnFrames = 5;
    setState(h, 'attack1'); h.stateFrame = 4; // active frame
    registerActorData('hero', { ...HERO_DATA, moves: { attack1: light } });
    resolveHits(w);
    expect(v.hp).toBe(30);
  });
  it('each move hits a victim once and hp<=0 knocks down', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 4;
    registerActorData('hero', { ...HERO_DATA, moves: { attack1: light } });
    setState(h, 'attack1'); h.stateFrame = 4;
    resolveHits(w); resolveHits(w);
    expect(v.hp).toBe(-2);
    expect(v.state).toBe('knockdown');
    expect(w.score).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run test/core/combat/resolve.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement `resolve.ts`**

```ts
// src/core/combat/resolve.ts
import type { Facing } from '../types';
import type { Entity } from '../sim/entity';
import { faction, setState, isBody } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import type { MoveData } from './frame-data';
import { dataFor } from './frame-data';
import { hitConnects } from './hit';
import { HIT_FEEL } from './hit-feel';
import { SCORE } from '../arcade/score';

export function activeMove(e: Entity): MoveData | null {
  if (!isBody(e)) return null;
  const m = dataFor(e.kind).moves[e.state];
  if (!m) return null;
  const f = e.stateFrame;
  return f > m.startup && f <= m.startup + m.active ? m : null;
}

export function canHit(att: Entity, vic: Entity): boolean {
  if (att.id === vic.id || vic.dead) return false;
  const fa = faction(att), fv = faction(vic);
  if (vic.kind === 'crate') return fa === 'hero';
  if (!isBody(vic)) return false;
  if (fa === 'feral') return fv !== 'feral';
  if (fa === 'hero') return fv === 'gang' || fv === 'feral';
  if (fa === 'gang') return fv === 'hero' || fv === 'feral';
  return false;
}

export function applyKnockdown(state: WorldState, vic: Entity, dir: Facing): void {
  setState(vic, 'knockdown');
  vic.vel.z = HIT_FEEL.launch.vz;
  vic.vel.x = HIT_FEEL.launch.vx * dir;
  vic.vel.y = 0;
  vic.hitstun = 0;
  vic.facing = (dir * -1) as Facing; // face the attacker
  emit(state, { type: 'sfx', id: 'knockdown' });
}

export function applyHit(state: WorldState, att: Entity, vic: Entity, move: MoveData): void {
  const dir: Facing = att.pos.x <= vic.pos.x ? 1 : -1;
  vic.hp -= move.damage;
  vic.flashFrames = HIT_FEEL.flashFrames;
  state.hitstop = Math.max(state.hitstop, HIT_FEEL.hitstop[move.level]);
  const px = HIT_FEEL.shakePx[move.level];
  if (px > 0) state.shake = { frames: HIT_FEEL.shakeFrames, px };
  if (att.kind === 'hero' || att.kind === 'projectile' && att.ownerFaction === 'hero') {
    state.score += SCORE.hit;
    emit(state, { type: 'score', amount: SCORE.hit, x: vic.pos.x, y: vic.pos.y - vic.pos.z - 40 });
  }
  emit(state, { type: 'hit', attackerId: att.id, victimId: vic.id, level: move.level, x: vic.pos.x, y: vic.pos.y - vic.pos.z - 30, damage: move.damage });
  emit(state, { type: 'sfx', id: `hit_${move.level}` });
  if (vic.kind === 'crate') { if (vic.hp <= 0) setState(vic, 'break'); return; }
  if (vic.armorFrames > 0 && vic.hp > 0) return;          // super-armour: damage only
  if (move.level === 'launch' || vic.hp <= 0 || vic.pos.z > 0) { applyKnockdown(state, vic, dir); return; }
  setState(vic, 'hurt');
  vic.hitstun = HIT_FEEL.hitstun[move.level === 'heavy' ? 'heavy' : 'light'];
  vic.vel.x = move.pushback * dir; vic.vel.y = 0;
}

export function resolveHits(state: WorldState): void {
  for (const att of state.entities) {
    const move = activeMove(att);
    if (!move) continue;
    for (const vic of state.entities) {
      if (!canHit(att, vic) || att.hitIds.includes(vic.id) || vic.invulnFrames > 0) continue;
      const hurt = vic.kind === 'crate' ? { x: -12, y: 0, w: 24, h: 24 } : dataFor(vic.kind).hurtbox;
      if (!hitConnects(att, move.hitbox, vic, hurt)) continue;
      att.hitIds.push(vic.id);
      applyHit(state, att, vic, move);
    }
  }
}
```

- [ ] **Step 4: Implement `stun.ts`**

```ts
// src/core/combat/stun.ts
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import { HIT_FEEL } from './hit-feel';
import { SCORE } from '../arcade/score';

/** Shared hurt/knockdown/down/getup/dead handling. Call after stateFrame++. Returns true if e was in a stun state. */
export function updateStunState(state: WorldState, e: Entity): boolean {
  switch (e.state) {
    case 'hurt':
      e.vel.x *= 0.8;
      if (e.hitstun <= 0) { e.vel.x = 0; setState(e, 'idle'); }
      return true;
    case 'knockdown':
      if (e.stateFrame > 1 && e.pos.z === 0) {
        e.vel.x = 0;
        if (e.hp <= 0) {
          setState(e, 'dead');
          if (e.kind !== 'hero') { e.removeIn = 40; state.score += SCORE.ko; emit(state, { type: 'score', amount: SCORE.ko, x: e.pos.x, y: e.pos.y - 40 }); }
        } else {
          setState(e, 'down');
          e.invulnFrames = HIT_FEEL.downFrames + HIT_FEEL.getupFrames + HIT_FEEL.getupGraceFrames;
        }
      }
      return true;
    case 'down':
      if (e.stateFrame >= HIT_FEEL.downFrames) setState(e, 'getup');
      return true;
    case 'getup':
      if (e.stateFrame >= HIT_FEEL.getupFrames) setState(e, 'idle');
      return true;
    case 'dead':
      e.vel.x = 0; e.vel.y = 0;
      return true;
    default:
      return false;
  }
}
```

- [ ] **Step 5: Register in `tick.ts`**

```ts
import { resolveHits } from '../combat/resolve';
export const POST_UPDATE_SYSTEMS: Array<(state: WorldState) => void> = [resolveHits];
```

- [ ] **Step 6: Run tests** — `npm test` — Expected: all passed. **Commit:**

```bash
git add src/core/combat/resolve.ts src/core/combat/stun.ts src/core/sim/tick.ts test/core/combat/resolve.test.ts
git commit -m "feat(core): hit resolution with hitstop, shake, flash, launch and the knockdown/getup path"
```

### Task 6.3: Hero attack chain with input buffer

**Files:**
- Modify: `src/core/combat/frame-data.ts` (HERO_DATA.moves), `src/core/entities/hero.ts`
- Create: `test/core/entities/hero-combo.test.ts`

**Interfaces:**
- Produces: `HERO_DATA.moves.attack1/attack2/attack3`; hero states `attack1`, `attack2`, `attack3`, `hurt`, `knockdown`, `down`, `getup`; `nextChain(kind, state): string | null`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/hero-combo.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, spawn } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HERO_DATA, moveTotal, registerActorData } from '@core/combat/frame-data';
import { HIT_FEEL } from '@core/combat/hit-feel';

registerActorData('brawler', { ...HERO_DATA, hp: 30, moves: {} });
const A = { ...EMPTY_INPUT, attack: true };
const tap = (w: ReturnType<typeof createWorld>) => { tick(w, A); tick(w, EMPTY_INPUT); };
const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let i = 0; i < n; i++) tick(w, EMPTY_INPUT); };

describe('hero combo', () => {
  it('attack1 → attack2 → attack3 with buffered presses, then idle', () => {
    const w = createWorld(1); const h = heroOf(w);
    tap(w); expect(h.state).toBe('attack1');
    tap(w); // buffered during attack1
    run(w, moveTotal(HERO_DATA.moves.attack1!));
    expect(h.state).toBe('attack2');
    tap(w);
    run(w, moveTotal(HERO_DATA.moves.attack2!));
    expect(h.state).toBe('attack3');
    run(w, moveTotal(HERO_DATA.moves.attack3!) + 1);
    expect(h.state).toBe('idle');
  });
  it('without a buffered press the chain drops to idle', () => {
    const w = createWorld(1); const h = heroOf(w);
    tap(w); run(w, moveTotal(HERO_DATA.moves.attack1!) + 1);
    expect(h.state).toBe('idle');
  });
  it('hit 3 launches the brawler; hitstop is 3 then 8', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', h.pos.x + 24, h.pos.y); v.hp = 100;
    tick(w, A);
    let launched = false, sawLight = false, sawLaunch = false;
    for (let i = 0; i < 120 && !launched; i++) {
      tick(w, i % 2 === 0 ? A : EMPTY_INPUT);
      if (w.hitstop === HIT_FEEL.hitstop.light) sawLight = true;
      if (w.hitstop === HIT_FEEL.hitstop.launch) sawLaunch = true;
      if (v.state === 'knockdown') launched = true;
    }
    expect(sawLight && sawLaunch && launched).toBe(true);
  });
  it('cannot attack while in hitstun', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.state = 'hurt'; h.hitstun = 10;
    tick(w, A);
    expect(h.state).toBe('hurt');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL (no attack moves).

- [ ] **Step 3: Add moves to `HERO_DATA`**

```ts
  moves: {
    attack1: { startup: 3, active: 3, recovery: 8,  hitbox: { x: 8, y: 24, w: 26, h: 16 }, damage: 6,  level: 'light',  pushback: 2 },
    attack2: { startup: 3, active: 3, recovery: 9,  hitbox: { x: 8, y: 24, w: 28, h: 16 }, damage: 6,  level: 'light',  pushback: 2, chainFrom: 'attack1' },
    attack3: { startup: 5, active: 4, recovery: 14, hitbox: { x: 8, y: 20, w: 34, h: 24 }, damage: 10, level: 'launch', pushback: 3, chainFrom: 'attack2' },
  },
```
And add to `frame-data.ts`:
```ts
export function nextChain(kind: EntityKind, state: string): string | null {
  for (const [name, m] of Object.entries(dataFor(kind).moves)) if (m.chainFrom === state) return name;
  return null;
}
```

- [ ] **Step 4: Extend `updateHero`**

Add imports `import { moveTotal, nextChain } from '../combat/frame-data'; import { updateStunState } from '../combat/stun';` and replace the body of `updateHero` with:
```ts
export function updateHero(state: WorldState, hero: Entity, input: InputFrame): void {
  hero.stateFrame++;
  if (updateStunState(state, hero)) return;
  const { dx, dy } = readAxis(input);
  const move = HERO_DATA.moves[hero.state];
  if (move) {
    hero.vel.x = 0; hero.vel.y = 0;
    if (pressed(state, input, 'attack')) hero.chainQueued = true;
    if (hero.stateFrame >= moveTotal(move)) {
      const next = hero.chainQueued ? nextChain('hero', hero.state) : null;
      hero.chainQueued = false;
      setState(hero, next ?? 'idle');
    }
    return;
  }
  switch (hero.state) {
    case 'idle':
    case 'walk': {
      hero.vel.x = dx * HERO_DATA.walkSpeed.x;
      hero.vel.y = dy * HERO_DATA.walkSpeed.y;
      if (dx !== 0) hero.facing = dx > 0 ? 1 : -1;
      const moving = dx !== 0 || dy !== 0;
      if (moving && hero.state !== 'walk') setState(hero, 'walk');
      if (!moving && hero.state !== 'idle') setState(hero, 'idle');
      if (pressed(state, input, 'attack')) { setState(hero, 'attack1'); hero.chainQueued = false; hero.vel.x = 0; hero.vel.y = 0; break; }
      if (pressed(state, input, 'jump')) { setState(hero, 'jump'); hero.vel.z = HERO_DATA.jumpVz; hero.vel.y = 0; }
      break;
    }
    case 'jump':
      if (hero.stateFrame > 1 && hero.pos.z === 0) setState(hero, dx !== 0 || dy !== 0 ? 'walk' : 'idle');
      break;
    default:
      break;
  }
}
```

- [ ] **Step 5: Run tests** — `npm test` — Expected: all passed (the locomotion tests from 05 still pass). **Commit:**

```bash
git add src/core/combat/frame-data.ts src/core/entities/hero.ts test/core/entities/hero-combo.test.ts
git commit -m "feat(core): hero three-hit combo from frame data with input buffer"
```

### Task 6.4: Brawler FSM (idle / approach / attack / hurt / knockdown / getup)

**Files:**
- Create: `src/core/entities/gang.ts`, `test/core/entities/brawler.test.ts`
- Modify: `src/core/sim/tick.ts` (register updater)

**Interfaces:**
- Produces: `GangKind = 'brawler' | 'knife' | 'heavy'`; `GangData extends ActorData { reach: number; attackCooldown: number; attackMove: string }`; `GANG_DATA: Record<GangKind, GangData>` (brawler now; knife/heavy in 08); `updateGang(state, e, _input)`; `spawnGang(state, kind, x, y): Entity` (sets hp from data, targetId = hero).

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/brawler.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang, GANG_DATA } from '@core/entities/gang';

const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let i = 0; i < n; i++) tick(w, EMPTY_INPUT); };

describe('brawler', () => {
  it('approaches the hero, faces him, and punches within reach', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnGang(w, 'brawler', h.pos.x + 150, h.pos.y + 30);
    expect(b.hp).toBe(GANG_DATA.brawler.hp);
    run(w, 5);
    expect(b.state).toBe('approach');
    expect(b.facing).toBe(-1);
    let punched = false;
    for (let i = 0; i < 400 && !punched; i++) { tick(w, EMPTY_INPUT); if (b.state === 'punch') punched = true; }
    expect(punched).toBe(true);
    expect(Math.abs(b.pos.x - h.pos.x)).toBeLessThanOrEqual(GANG_DATA.brawler.reach + 2);
    expect(Math.abs(b.pos.y - h.pos.y)).toBeLessThanOrEqual(8);
  });
  it('hits the hero back', () => {
    const w = createWorld(1); const h = heroOf(w);
    spawnGang(w, 'brawler', h.pos.x + 20, h.pos.y);
    run(w, 400);
    expect(h.hp).toBeLessThan(100);
  });
  it('waits out the cooldown between punches', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnGang(w, 'brawler', h.pos.x + 20, h.pos.y);
    const starts: number[] = [];
    for (let i = 0; i < 600; i++) { tick(w, EMPTY_INPUT); if (b.state === 'punch' && b.stateFrame === 1) starts.push(w.frame); }
    expect(starts.length).toBeGreaterThan(2);
    for (let i = 1; i < starts.length; i++) expect(starts[i]! - starts[i - 1]!).toBeGreaterThanOrEqual(GANG_DATA.brawler.attackCooldown);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/entities/gang.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { byId, heroOf, spawn } from '../sim/state';
import type { ActorData } from '../combat/frame-data';
import { registerActorData, moveTotal } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { DEPTH_TOLERANCE } from '../combat/hit';

export type GangKind = 'brawler' | 'knife' | 'heavy';
export interface GangData extends ActorData { reach: number; attackCooldown: number; attackMove: string }

export const GANG_DATA: Record<GangKind, GangData> = {
  brawler: {
    walkSpeed: { x: 1, y: 0.75 }, hp: 30, hurtbox: { x: -11, y: 0, w: 22, h: 56 }, jumpVz: 0,
    reach: 30, attackCooldown: 40, attackMove: 'punch',
    moves: { punch: { startup: 10, active: 4, recovery: 16, hitbox: { x: 6, y: 28, w: 24, h: 16 }, damage: 8, level: 'light', pushback: 2 } },
  },
  // knife and heavy are added in ticket 08
} as Record<GangKind, GangData>;
for (const k of Object.keys(GANG_DATA) as GangKind[]) registerActorData(k, GANG_DATA[k]);

export function spawnGang(state: WorldState, kind: GangKind, x: number, y: number): Entity {
  const e = spawn(state, kind, x, y);
  const d = GANG_DATA[kind];
  e.hp = d.hp; e.maxHp = d.hp; e.targetId = state.heroId;
  return e;
}

/** Move toward (tx, ty) at the actor's walk speed; returns true when within reach in x and within depth tolerance. */
export function approach(e: Entity, d: ActorData, tx: number, ty: number, reach: number): boolean {
  const dx = tx - e.pos.x, dy = ty - e.pos.y;
  e.facing = dx >= 0 ? 1 : -1;
  const inX = Math.abs(dx) <= reach, inY = Math.abs(dy) <= DEPTH_TOLERANCE;
  e.vel.x = inX ? 0 : Math.sign(dx) * d.walkSpeed.x * e.speedMul;
  e.vel.y = inY ? 0 : Math.sign(dy) * d.walkSpeed.y * e.speedMul;
  return inX && inY;
}

export function updateGang(state: WorldState, e: Entity, _input: InputFrame): void {
  e.stateFrame++;
  if (updateStunState(state, e)) return;
  const d = GANG_DATA[e.kind as GangKind];
  const target = byId(state, e.targetId) ?? heroOf(state);
  const move = d.moves[e.state];
  if (move) {
    e.vel.x = 0; e.vel.y = 0;
    if (e.stateFrame >= moveTotal(move)) { setState(e, 'idle'); e.cooldown = d.attackCooldown; }
    return;
  }
  switch (e.state) {
    case 'idle':
      e.vel.x = 0; e.vel.y = 0;
      if (e.cooldown === 0) setState(e, 'approach');
      break;
    case 'approach': {
      const inRange = approach(e, d, target.pos.x, target.pos.y, d.reach);
      if (inRange) { setState(e, d.attackMove); e.vel.x = 0; e.vel.y = 0; }
      break;
    }
    default:
      setState(e, 'idle');
  }
}
```

In `tick.ts`:
```ts
import { updateGang } from '../entities/gang';
export const ENTITY_UPDATERS: Partial<Record<EntityKind, EntityUpdater>> = { hero: updateHero, brawler: updateGang, knife: updateGang, heavy: updateGang };
```

- [ ] **Step 4: Run tests** — `npm test` — Expected: all passed. **Commit:**

```bash
git add src/core/entities/gang.ts src/core/sim/tick.ts test/core/entities/brawler.test.ts
git commit -m "feat(core): brawler FSM that approaches, punches on cooldown and hits the hero back"
```

### Task 6.5: Adapter — shake, flash, debug overlay, brawler in the scene

**Files:**
- Create: `src/adapters/phaser/views/DebugOverlay.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`

**Interfaces:**
- Produces: `DebugOverlay(scene)` with `toggle()`, `draw(state)`; `H` key toggles (DEV only); camera shake offset from `state.shake`.

- [ ] **Step 1: Debug overlay**

```ts
// src/adapters/phaser/views/DebugOverlay.ts
import type Phaser from 'phaser';
import type { WorldState } from '@core/sim/state';
import { activeMove } from '@core/combat/resolve';
import { dataFor } from '@core/combat/frame-data';
import { worldRect } from '@core/combat/hit';
import { isBody } from '@core/sim/entity';

export class DebugOverlay {
  private g: Phaser.GameObjects.Graphics;
  on = false;
  constructor(scene: Phaser.Scene) { this.g = scene.add.graphics().setDepth(900); }
  toggle(): void { this.on = !this.on; this.g.clear(); }
  draw(state: WorldState): void {
    if (!this.on) return;
    this.g.clear();
    for (const e of state.entities) {
      if (!isBody(e)) continue;
      const hb = worldRect(e, dataFor(e.kind).hurtbox);
      this.g.lineStyle(1, 0x00ff00, 1);
      this.g.strokeRect(hb.x1 - state.camera.x, e.pos.y - hb.z2, hb.x2 - hb.x1, hb.z2 - hb.z1);
      const m = activeMove(e);
      if (m) {
        const r = worldRect(e, m.hitbox);
        this.g.lineStyle(1, 0xff0000, 1);
        this.g.strokeRect(r.x1 - state.camera.x, e.pos.y - r.z2, r.x2 - r.x1, r.z2 - r.z1);
      }
    }
  }
}
```

- [ ] **Step 2: Wire into `GameScene`**

Add fields `private debug!: DebugOverlay;` and in `create()` after views: 
```ts
    this.debug = new DebugOverlay(this);
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-H', () => this.debug.toggle());
    spawnGang(this.world, 'brawler', 300, 176);
```
(imports: `DebugOverlay`, `spawnGang` from `@core/entities/gang`). In `update()` after `views.sync`:
```ts
    this.debug.draw(this.world);
    const s = this.world.shake;
    const off = s.frames > 0 ? (s.frames % 2 === 0 ? s.px : -s.px) : 0;
    this.cameras.main.centerOn(BASE_W / 2 + off, BASE_H / 2);
```

- [ ] **Step 3: Browser check — the S3 early read**

Run `npm run dev`. Expected: red box walks in and punches; J-J-J combo lands three hits — the world freezes briefly on each (3, 3, 8 frames), the third pops the red box into the air with a 2-px shake; the box flashes white for 2 frames; it lies down, flickers while invulnerable, stands, resumes. `H` shows green hurtboxes and red hitboxes during active frames. ⛔ **Owner plays for two minutes and gives the early "feels like 1993?" read; record the verdict and any number tweaks (only in `hit-feel.ts` / `frame-data.ts`) in `docs/verification/06-feel-read.md`.**

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/DebugOverlay.ts src/adapters/phaser/scenes/GameScene.ts docs/verification/06-feel-read.md
git commit -m "feat(adapter): screen shake, hit flash and hitbox debug overlay for the combat tracer"
```

**Ticket 06 verification gate:** six acceptance boxes ticked; Vitest covers hit-3 launch, hitstop durations, getup invulnerability; owner's feel read recorded.

---

# Ticket 03 — Art tracer (M0): hero reference → AutoSprite walk + attack → atlas → in-engine

**Delivers:** a generated hero walks and swings a sledgehammer on the 384×224 canvas under the CRT pass. Kills the riskiest assumption (AI frame-to-frame consistency) and measures AutoSprite's real cost and provider. ⛔ **Human gate before Task 3.3: the owner's Higgsfield credit ceiling is set (a number, written into `assets/LICENSES.md` header).** ⛔ **Human gate at the end: owner accepts the on-screen quality.**

Higgsfield calls are made by the orchestrating Claude session through the Higgsfield MCP tools (`mcp__higgsfield__*`), never by a code path in the repo.

### Task 3.1: Palette tool (median-cut + nearest-colour quantise)

**Files:**
- Create: `tools/art/palette.ts`, `test/tools/palette.test.ts`

**Interfaces:**
- Produces: `RGB = [number, number, number]`; `buildPalette(pixels: Uint8Array /* RGBA */, count: number): RGB[]` (median cut over opaque pixels); `nearest(palette: RGB[], r, g, b): number` (index); `quantise(rgba: Uint8Array, palette: RGB[], alphaThreshold = 128): Uint8Array` (no dither; alpha binarised); `PaletteFile = { name: string; groups: Array<{ name: string; slots: number[] }>; colours: string[] /* '#rrggbb', length 64 */ }`; `loadPaletteFile(path): RGB[]`.

- [ ] **Step 1: Install sharp and write the failing test**

Run: `npm i -D sharp` (if not already from ticket 20).

```ts
// test/tools/palette.test.ts
import { describe, it, expect } from 'vitest';
import { buildPalette, nearest, quantise } from '../../tools/art/palette';

function px(...cols: Array<[number, number, number, number]>): Uint8Array {
  return new Uint8Array(cols.flat());
}

describe('palette', () => {
  it('nearest picks the closest colour by RGB distance', () => {
    const pal: Array<[number, number, number]> = [[0, 0, 0], [255, 255, 255], [255, 0, 0]];
    expect(nearest(pal, 250, 10, 10)).toBe(2);
    expect(nearest(pal, 200, 200, 200)).toBe(1);
  });
  it('quantise snaps colours and binarises alpha with no dither', () => {
    const pal: Array<[number, number, number]> = [[0, 0, 0], [255, 255, 255]];
    const out = quantise(px([120, 120, 120, 255], [130, 130, 130, 255], [10, 10, 10, 100]), pal);
    expect([...out]).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]);
  });
  it('buildPalette returns exactly `count` distinct colours from an opaque image', () => {
    const cols: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 4096; i++) cols.push([(i * 37) % 256, (i * 91) % 256, (i * 13) % 256, 255]);
    const pal = buildPalette(px(...cols), 64);
    expect(pal).toHaveLength(64);
    expect(new Set(pal.map((c) => c.join(','))).size).toBe(64);
  });
  it('buildPalette ignores transparent pixels', () => {
    const pal = buildPalette(px([255, 0, 0, 255], [0, 255, 0, 0]), 1);
    expect(pal).toEqual([[255, 0, 0]]);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/tools/palette.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// tools/art/palette.ts
import { readFileSync } from 'node:fs';

export type RGB = [number, number, number];
export interface PaletteFile { name: string; groups: Array<{ name: string; slots: number[] }>; colours: string[] }

export function nearest(palette: RGB[], r: number, g: number, b: number): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i] as RGB;
    const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

export function quantise(rgba: Uint8Array, palette: RGB[], alphaThreshold = 128): Uint8Array {
  const out = new Uint8Array(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3] as number;
    if (a < alphaThreshold) { out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0; continue; }
    const p = palette[nearest(palette, rgba[i] as number, rgba[i + 1] as number, rgba[i + 2] as number)] as RGB;
    out[i] = p[0]; out[i + 1] = p[1]; out[i + 2] = p[2]; out[i + 3] = 255;
  }
  return out;
}

/** Median cut over opaque pixels. Returns `count` colours (fewer only if the image has fewer distinct colours). */
export function buildPalette(rgba: Uint8Array, count: number): RGB[] {
  const pts: RGB[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i + 3] as number) < 128) continue;
    const key = ((rgba[i] as number) << 16) | ((rgba[i + 1] as number) << 8) | (rgba[i + 2] as number);
    if (seen.has(key)) continue;
    seen.add(key);
    pts.push([rgba[i] as number, rgba[i + 1] as number, rgba[i + 2] as number]);
  }
  if (pts.length <= count) return pts;
  let boxes: RGB[][] = [pts];
  while (boxes.length < count) {
    boxes.sort((a, b) => spread(b) - spread(a));
    const box = boxes.shift() as RGB[];
    if (box.length < 2) { boxes.push(box); break; }
    const ch = widestChannel(box);
    box.sort((a, b) => a[ch] - b[ch]);
    const mid = box.length >> 1;
    boxes.push(box.slice(0, mid), box.slice(mid));
  }
  return boxes.map((box) => {
    const s = box.reduce<RGB>((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
    return [Math.round(s[0] / box.length), Math.round(s[1] / box.length), Math.round(s[2] / box.length)];
  });
}
function widestChannel(box: RGB[]): 0 | 1 | 2 {
  const r = range(box, 0), g = range(box, 1), b = range(box, 2);
  return r >= g && r >= b ? 0 : g >= b ? 1 : 2;
}
function range(box: RGB[], ch: 0 | 1 | 2): number {
  let lo = 255, hi = 0;
  for (const c of box) { lo = Math.min(lo, c[ch]); hi = Math.max(hi, c[ch]); }
  return hi - lo;
}
const spread = (box: RGB[]): number => Math.max(range(box, 0), range(box, 1), range(box, 2)) * box.length;

export const hex = (c: RGB): string => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
export const unhex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function loadPaletteFile(path: string): RGB[] {
  const f = JSON.parse(readFileSync(path, 'utf8')) as PaletteFile;
  return f.colours.map(unhex);
}
```

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run test/tools/palette.test.ts
git add tools/art/palette.ts test/tools/palette.test.ts package.json package-lock.json
git commit -m "feat(tools): median-cut palette builder and no-dither quantiser"
```

### Task 3.2: build-atlas tool

**Files:**
- Create: `tools/art/build-atlas.ts`, `tools/art/manifests/hero.json`, `test/tools/build-atlas.test.ts`
- Modify: `package.json` (script `art:atlas`)

**Interfaces:**
- Produces: `AtlasManifest = { name: string; targetHeight: number; palette: string; scaleFrom: string; bgKey?: string; outDir: string; actions: Array<{ name: string; sheet: string; frames: number; cols?: number }> }`; `buildAtlas(manifest: AtlasManifest): Promise<{ png: string; json: string; frameW: number; frameH: number; scale: number }>`; output atlas frame names `${name}/${action}/${i}`; Phaser JSON-hash atlas with `meta.slagcity = { origin: [0.5, 1], scale, frameW, frameH }`. CLI: `npx tsx tools/art/build-atlas.ts tools/art/manifests/hero.json`.

- [ ] **Step 1: Write the failing test (synthetic sheets)**

```ts
// test/tools/build-atlas.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { buildAtlas } from '../../tools/art/build-atlas';

const TMP = '/Volumes/E Drive/Dev/.scratch/slag-city-test/atlas';

async function sheet(path: string, frames: number, size: number): Promise<void> {
  // each frame: a coloured 40x100 block standing on the frame's floor, x-offset varies to prove trimming/alignment
  const composites = [];
  for (let i = 0; i < frames; i++) {
    composites.push({ input: { create: { width: 40, height: 100 - i * 10, channels: 4 as const, background: { r: 200, g: 40 + i * 20, b: 30, alpha: 1 } } }, left: i * size + 60 + i * 5, top: size - (100 - i * 10) - 20 });
  }
  await sharp({ create: { width: size * frames, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(composites).png().toFile(path);
}

describe('build-atlas', () => {
  beforeAll(async () => {
    mkdirSync(TMP, { recursive: true });
    await sheet(`${TMP}/walk.png`, 3, 256);
    await sheet(`${TMP}/attack.png`, 2, 256);
    writeFileSync(`${TMP}/pal.json`, JSON.stringify({ name: 't', groups: [], colours: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffffff'] }));
  });
  it('emits a Phaser atlas whose frames share one size, are scaled to targetHeight, and use only palette colours', async () => {
    const out = await buildAtlas({
      name: 'dummy', targetHeight: 64, palette: `${TMP}/pal.json`, scaleFrom: 'walk', outDir: TMP,
      actions: [{ name: 'walk', sheet: `${TMP}/walk.png`, frames: 3 }, { name: 'attack', sheet: `${TMP}/attack.png`, frames: 2 }],
    });
    const json = JSON.parse(readFileSync(out.json, 'utf8')) as { frames: Record<string, { frame: { w: number; h: number } }>; meta: { slagcity: { frameH: number } } };
    expect(Object.keys(json.frames).sort()).toEqual(['dummy/attack/0', 'dummy/attack/1', 'dummy/walk/0', 'dummy/walk/1', 'dummy/walk/2']);
    expect(json.meta.slagcity.frameH).toBe(64);
    for (const f of Object.values(json.frames)) expect(f.frame.h).toBe(64);
    const { data, info } = await sharp(out.png).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    const allowed = new Set(['0,0,0', '255,0,0', '0,255,0', '0,0,255', '255,255,255']);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      expect(data[i + 3]).toBe(255);
      expect(allowed.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run test/tools/build-atlas.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// tools/art/build-atlas.ts
import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { loadPaletteFile, quantise } from './palette';

export interface AtlasAction { name: string; sheet: string; frames: number; cols?: number }
export interface AtlasManifest {
  name: string; targetHeight: number; palette: string; scaleFrom: string; bgKey?: string; outDir: string; actions: AtlasAction[];
}
interface RawFrame { action: string; index: number; data: Buffer; w: number; h: number }
interface Box { x1: number; y1: number; x2: number; y2: number }

async function splitSheet(a: AtlasAction, bgKey?: string): Promise<RawFrame[]> {
  const img = sharp(a.sheet).ensureAlpha();
  const meta = await img.metadata();
  const cols = a.cols ?? a.frames;
  const fw = Math.floor((meta.width as number) / cols);
  const rows = Math.ceil(a.frames / cols);
  const fh = Math.floor((meta.height as number) / rows);
  const frames: RawFrame[] = [];
  for (let i = 0; i < a.frames; i++) {
    const left = (i % cols) * fw, top = Math.floor(i / cols) * fh;
    let { data } = await sharp(a.sheet).ensureAlpha().extract({ left, top, width: fw, height: fh }).raw().toBuffer({ resolveWithObject: true });
    if (bgKey) data = knockout(data, bgKey);
    frames.push({ action: a.name, index: i, data, w: fw, h: fh });
  }
  return frames;
}

/** Make pixels within tolerance of a flat key colour transparent (AutoSprite sheets on a flat grey). */
function knockout(data: Buffer, keyHex: string, tol = 28): Buffer {
  const kr = parseInt(keyHex.slice(1, 3), 16), kg = parseInt(keyHex.slice(3, 5), 16), kb = parseInt(keyHex.slice(5, 7), 16);
  for (let i = 0; i < data.length; i += 4) {
    if (Math.abs(data[i]! - kr) <= tol && Math.abs(data[i + 1]! - kg) <= tol && Math.abs(data[i + 2]! - kb) <= tol) data[i + 3] = 0;
  }
  return data;
}

function bounds(f: RawFrame): Box | null {
  let x1 = f.w, y1 = f.h, x2 = -1, y2 = -1;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    if ((f.data[(y * f.w + x) * 4 + 3] as number) >= 128) { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
  }
  return x2 < 0 ? null : { x1, y1, x2: x2 + 1, y2: y2 + 1 };
}
const union = (boxes: Box[]): Box => ({
  x1: Math.min(...boxes.map((b) => b.x1)), y1: Math.min(...boxes.map((b) => b.y1)),
  x2: Math.max(...boxes.map((b) => b.x2)), y2: Math.max(...boxes.map((b) => b.y2)),
});

export async function buildAtlas(m: AtlasManifest): Promise<{ png: string; json: string; frameW: number; frameH: number; scale: number }> {
  mkdirSync(m.outDir, { recursive: true });
  const palette = loadPaletteFile(m.palette);
  const raw: RawFrame[] = [];
  for (const a of m.actions) raw.push(...await splitSheet(a, m.bgKey));
  const boxes = raw.map((f) => bounds(f) ?? { x1: 0, y1: 0, x2: f.w, y2: f.h });
  const all = union(boxes);
  const refBoxes = raw.map((f, i) => (f.action === m.scaleFrom ? boxes[i] as Box : null)).filter((b): b is Box => b !== null);
  if (refBoxes.length === 0) throw new Error(`scaleFrom action '${m.scaleFrom}' not in manifest`);
  const refH = union(refBoxes).y2 - union(refBoxes).y1;
  const scale = m.targetHeight / refH;
  // Common crop = union box across ALL frames, so the feet line (all.y2) is the same for every frame → origin (0.5, 1) never slides.
  const cropW = all.x2 - all.x1, cropH = all.y2 - all.y1;
  const frameW = Math.ceil(cropW * scale), frameH = Math.ceil(cropH * scale);
  const cells: Buffer[] = [];
  for (const f of raw) {
    const cropped = await sharp(f.data, { raw: { width: f.w, height: f.h, channels: 4 } })
      .extract({ left: all.x1, top: all.y1, width: cropW, height: cropH })
      .resize(frameW, frameH, { kernel: 'lanczos3', fit: 'fill' })
      .raw().toBuffer();
    cells.push(Buffer.from(quantise(new Uint8Array(cropped), palette)));
  }
  const atlasW = frameW * cells.length;
  const png = join(m.outDir, `${m.name}.png`), json = join(m.outDir, `${m.name}.json`);
  await sharp({ create: { width: atlasW, height: frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(cells.map((c, i) => ({ input: c, raw: { width: frameW, height: frameH, channels: 4 }, left: i * frameW, top: 0 })))
    .png({ compressionLevel: 9, palette: false }).toFile(png);
  const frames: Record<string, unknown> = {};
  raw.forEach((f, i) => {
    frames[`${m.name}/${f.action}/${f.index}`] = {
      frame: { x: i * frameW, y: 0, w: frameW, h: frameH }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH }, sourceSize: { w: frameW, h: frameH },
    };
  });
  writeFileSync(json, JSON.stringify({
    frames,
    meta: { app: 'slag-city build-atlas', image: basename(png), size: { w: atlasW, h: frameH }, scale: '1', slagcity: { origin: [0.5, 1], scale, frameW, frameH } },
  }, null, 1));
  return { png, json, frameW, frameH, scale };
}

// CLI: npx tsx tools/art/build-atlas.ts <manifest.json>
if (process.argv[1] && process.argv[1].endsWith('build-atlas.ts')) {
  const path = process.argv[2];
  if (!path) { console.error('usage: build-atlas <manifest.json>'); process.exit(2); }
  const m = JSON.parse(readFileSync(path, 'utf8')) as AtlasManifest;
  buildAtlas(m).then((r) => console.log(`atlas ${r.png} ${r.frameW}x${r.frameH} scale=${r.scale.toFixed(3)}`)).catch((e) => { console.error(e); process.exit(1); });
}
```

Add `npm i -D tsx` and the script `"art:atlas": "tsx tools/art/build-atlas.ts"`.

`tools/art/manifests/hero.json` (used from Task 3.4 on):
```json
{
  "name": "hero",
  "targetHeight": 64,
  "palette": "assets/palette.provisional.json",
  "scaleFrom": "walk",
  "bgKey": "#808080",
  "outDir": "public/assets/atlases",
  "actions": [
    { "name": "walk", "sheet": "assets/sources/hero/walk.png", "frames": 6 },
    { "name": "attack", "sheet": "assets/sources/hero/attack.png", "frames": 4 }
  ]
}
```

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run test/tools/build-atlas.test.ts
git add tools/art/build-atlas.ts tools/art/manifests/hero.json test/tools/build-atlas.test.ts package.json package-lock.json
git commit -m "feat(tools): build-atlas crops, aligns, downscales and quantises AutoSprite sheets into a Phaser atlas"
```

### Task 3.3: ⛔ Hero reference on Nano Banana Pro + LICENSES.md

**Files:**
- Create: `assets/LICENSES.md`, `assets/sources/hero/reference.png`, `assets/sources/hero/reference.prompt.txt`, `docs/art/candidates/hero-ref-{1..4}.png`

**Gate:** owner's credit ceiling number recorded in the `LICENSES.md` header before any generation.

- [ ] **Step 1: Write the manifest skeleton**

```markdown
# LICENSES — asset provenance manifest

Credit ceiling (owner, 2026-MM-DD): **NNN Higgsfield credits** for the whole demo. Spent so far: see the ledger at the bottom.
Rules (Solution-PRD §6): no Kling-backed model for any shipped asset; no third-party IP in prompts/references; provenance metadata never stripped; AI disclosure on store pages.

| Asset | Source | Model | Provider (backing) | Date | Prompt | Licence | AI |
|---|---|---|---|---|---|---|---|

## Credit ledger

| Date | Item | Credits before | Credits after | Cost |
|---|---|---|---|---|
```

- [ ] **Step 2: Record the balance, generate 2–4 candidates**

Call `mcp__higgsfield__balance` → note the number. Write `assets/sources/hero/reference.prompt.txt` from the `Design.md` §3.6 character template:
```
The industrial exorcist, hero, side three-quarter view, full body, neutral standing pose, flat neutral-gray background (#808080),
1993 side-scrolling arcade beat-'em-up character design, occult-industrial foundry setting,
soot-and-oxblood coat over practical foundry-worker gear, leather apron, wrapped forearms, a hand-forged iron ward talisman at the collar,
carrying a long-handled sledgehammer, broad shoulders, soot-dirtied desaturated tones with molten-orange accents,
cartoon-arcade proportions, no blood, no real-world brand or trademarked likeness, clean silhouette readable at small scale.
```
Call `mcp__higgsfield__generate_image` with that prompt, the Nano Banana Pro model, 2–4 candidates (use `generate_image_batch` if that is cheaper per the tool description), then `jobs_wait` and `show_generation_by_ids`. Save each candidate to `docs/art/candidates/hero-ref-N.png` (`media_*`/download per the tool result URLs; `curl -L <url> -o …`).

- [ ] **Step 3: ⛔ Owner picks the candidate**

Copy the chosen file to `assets/sources/hero/reference.png`. Add the manifest row (model, provider from the generation metadata, date, prompt path, Higgsfield licence per the tool description, AI = yes) and a ledger row (balance before/after).

- [ ] **Step 4: Commit**

```bash
git add assets/LICENSES.md assets/sources/hero docs/art/candidates
git commit -m "art: hero reference candidates and chosen reference with provenance"
```

### Task 3.4: ⛔ AutoSprite walk + attack sheets; provider and cost check

**Files:**
- Create: `docs/art/autosprite-schema.md`, `assets/sources/hero/walk.png`, `assets/sources/hero/attack.png`, `assets/sources/hero/walk.prompt.txt`, `assets/sources/hero/attack.prompt.txt`
- Modify: `assets/LICENSES.md`

- [ ] **Step 1: Discover the AutoSprite app schema**

Call `mcp__higgsfield__apps_search` with query `AutoSprite`; then `mcp__higgsfield__apps_describe` on the result. Paste the parameter schema (names, enums for preset, `frame_count`, `frame_size`, `is_humanoid`, reference-image field) and **the backing model/provider it names** into `docs/art/autosprite-schema.md`. If the description or `models_explore` shows a Kling-backed model, **stop** — record it in `LICENSES.md` and raise with the owner (fallback: the per-pose-stills route from `Solution-PRD.md` §1).

- [ ] **Step 2: Upload the reference and run `walk`**

`mcp__higgsfield__media_upload` (or `media_upload_widget`) with `assets/sources/hero/reference.png` → media id. Balance check. `mcp__higgsfield__apps_invoke` with: preset `walk`, `frame_count: 6`, `frame_size: 256`, `is_humanoid: true`, reference = the media id, prompt text saved to `walk.prompt.txt` (`"6-frame side-view walk cycle, feet on a common floor line, flat #808080 background, no motion blur"`). `jobs_wait`, download the sheet to `assets/sources/hero/walk.png`. Balance check → cost of one run.

- [ ] **Step 3: Run `attack`**

Same with preset `attack`, `frame_count: 4`, prompt `"4-frame overhead sledgehammer swing: wind-up, swing, impact, recover; feet planted on the same floor line as the walk; flat #808080 background"`. Save to `assets/sources/hero/attack.png`.

- [ ] **Step 4: Record**

Add two manifest rows + ledger rows; write in `LICENSES.md` under a heading `## AutoSprite (measured M0)`: cost per run, provider, sheet layout (strip vs grid, so `cols` in the manifest is right), date. **Reject** if Kling-backed.

- [ ] **Step 5: Commit**

```bash
git add docs/art/autosprite-schema.md assets/sources/hero assets/LICENSES.md
git commit -m "art: AutoSprite hero walk and attack sheets with measured cost and provider"
```

### Task 3.5: Provisional palette, atlas build, in-engine playback

**Files:**
- Create: `assets/palette.provisional.json`, `tools/art/make-provisional-palette.ts`, `public/assets/atlases/hero.png`, `public/assets/atlases/hero.json`, `src/adapters/phaser/views/anim-table.ts`
- Modify: `src/adapters/phaser/views/EntityView.ts`, `src/adapters/phaser/scenes/BootScene.ts`, `package.json`

**Interfaces:**
- Produces: `AnimSpec = { atlas: string; action: string; fps: number; loop: boolean }`; `ANIM_TABLE: Partial<Record<EntityKind, Record<string, AnimSpec>>>`; `animFor(e): AnimSpec | null`; `frameIndexFor(e, frameCount, spec, moveTotalFrames?): number` (deterministic from `stateFrame`); `EntityViews` draws an atlas sprite when the texture + frame exist, else the box.

- [ ] **Step 1: Provisional palette script**

```ts
// tools/art/make-provisional-palette.ts  — npx tsx tools/art/make-provisional-palette.ts <out.json> <img...>
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { buildPalette, hex } from './palette';

const [out, ...imgs] = process.argv.slice(2);
if (!out || imgs.length === 0) { console.error('usage: make-provisional-palette <out.json> <img...>'); process.exit(2); }
const chunks: Uint8Array[] = [];
for (const p of imgs) chunks.push(new Uint8Array(await sharp(p).ensureAlpha().resize({ width: 256 }).raw().toBuffer()));
const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
const colours = buildPalette(all, 64).map(hex);
writeFileSync(out, JSON.stringify({ name: 'provisional', groups: [], colours }, null, 1));
console.log(`${colours.length} colours → ${out}`);
```
Run: `npx tsx tools/art/make-provisional-palette.ts assets/palette.provisional.json assets/sources/hero/walk.png assets/sources/hero/attack.png`

- [ ] **Step 2: Build the atlas**

Run: `npm run art:atlas tools/art/manifests/hero.json` (set `cols` per the measured sheet layout). Expected: `public/assets/atlases/hero.png` + `.json`, frame height 64. Open the PNG: 10 frames in a row, feet on the bottom edge, no grey halo (adjust `bgKey`/tolerance if a halo remains).

- [ ] **Step 3: Animation table**

```ts
// src/adapters/phaser/views/anim-table.ts
import type { Entity, EntityKind } from '@core/sim/entity';

export interface AnimSpec { atlas: string; action: string; fps: number; loop: boolean }

export const ANIM_TABLE: Partial<Record<EntityKind, Record<string, AnimSpec>>> = {
  hero: {
    idle: { atlas: 'hero', action: 'walk', fps: 0, loop: true },      // frame 0 of walk until ticket 12's idle sheet
    walk: { atlas: 'hero', action: 'walk', fps: 10, loop: true },
    attack1: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    attack2: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    attack3: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
  },
};

export function animFor(e: Entity): AnimSpec | null { return ANIM_TABLE[e.kind]?.[e.state] ?? null; }

/** Looping: advance by fps at 60Hz. Non-looping: spread the frames over the move's total length. */
export function frameIndexFor(e: Entity, frameCount: number, spec: AnimSpec, totalFrames?: number): number {
  if (frameCount <= 1) return 0;
  if (spec.loop) return spec.fps === 0 ? 0 : Math.floor(e.stateFrame * spec.fps / 60) % frameCount;
  const total = totalFrames ?? frameCount;
  return Math.min(frameCount - 1, Math.floor((Math.max(0, e.stateFrame - 1) / total) * frameCount));
}
```

- [ ] **Step 4: Sprite path in `EntityViews`**

Change the view map to `Map<number, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite>`; in `sync`, when creating a view: if `animFor(e)` exists and `scene.textures.exists(spec.atlas)`, create `scene.add.sprite(0, 0, spec.atlas).setOrigin(0.5, 1)`; else the rectangle. In `place`, for sprites:
```ts
const spec = animFor(e);
if (spec && v instanceof Phaser.GameObjects.Sprite) {
  const tex = this.scene.textures.get(spec.atlas);
  const names = tex.getFrameNames().filter((n) => n.startsWith(`${spec.atlas}/${spec.action}/`));
  const move = isBody(e) ? dataFor(e.kind).moves[e.state] : undefined;
  const i = frameIndexFor(e, names.length, spec, move ? moveTotal(move) : undefined);
  v.setFrame(`${spec.atlas}/${spec.action}/${i}`);
  v.setFlipX(e.facing === -1);
  v.setTintFill(0xffffff); if (e.flashFrames === 0) v.clearTint();
  v.setAlpha(e.invulnFrames > 0 && state.frame % 4 < 2 ? 0.4 : 1);
}
```
(cache `names` per `${atlas}/${action}` in a `Map<string, string[]>` — `getFrameNames` every frame is wasteful). Keep `setScale(e.facing, 1)` only for rectangles.

Register the atlas in `BootScene.MANIFEST`: `{ key: 'hero', type: 'atlas', url: '/assets/atlases/hero.png', atlasJson: '/assets/atlases/hero.json' }`.

- [ ] **Step 5: Browser check — ⛔ owner quality gate**

Run `npm run dev`. Expected: the generated hero walks (6-frame loop at 10 fps) and swings on J under the CRT pass; frames do not visibly swim at 384×224 (limbs and hammer stay attached; the silhouette holds). Toggle `C` to compare. ⛔ **Owner accepts or rejects; verdict + screenshots in `docs/verification/03-art-tracer.md`.** On rejection: regenerate the offending sheet (Task 3.4) with a tightened prompt, at most twice, then escalate to the fallback route.

- [ ] **Step 6: Commit**

```bash
npm run check
git add assets/palette.provisional.json tools/art/make-provisional-palette.ts public/assets/atlases/hero.png public/assets/atlases/hero.json src/adapters/phaser/views/anim-table.ts src/adapters/phaser/views/EntityView.ts src/adapters/phaser/scenes/BootScene.ts package.json docs/verification/03-art-tracer.md
git commit -m "art: hero walk/attack atlas playing in-engine on a provisional palette (M0)"
```

**Ticket 03 verification gate:** six acceptance boxes; `LICENSES.md` has the ceiling, three asset rows, ledger, and the measured AutoSprite section; provider is not Kling-backed; owner accepted.

---

# Ticket 07 — Full hero FSM: grab→throw, jump attack, special, hurt / knockdown / getup / dead

**Delivers:** the complete 90s move-set — walking into a stunned enemy grabs, Attack throws (thrown enemy knocks down others), a jump attack with its own frame data, a health-cost crowd-clearing special, and the hero's hurt → knockdown → invulnerable getup → dead path observable by the shell.

### Task 7.1: Jump attack and special from frame data

**Files:**
- Modify: `src/core/combat/frame-data.ts`, `src/core/entities/hero.ts`
- Create: `test/core/entities/hero-moves.test.ts`

**Interfaces:**
- Produces: `HERO_DATA.moves.jumpAttack`, `HERO_DATA.moves.special`, `SPECIAL_COST = 10` (exported from `frame-data.ts`); hero states `jumpAttack`, `special`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/hero-moves.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HERO_DATA, SPECIAL_COST, moveTotal } from '@core/combat/frame-data';
import { spawnGang } from '@core/entities/gang';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };

describe('jump attack', () => {
  it('enters jumpAttack from jump on an attack press and hits with its own hitbox', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawnGang(w, 'brawler', h.pos.x + 24, h.pos.y); v.state = 'idle'; v.cooldown = 999;
    tick(w, inp({ jump: true })); run(w, 6);
    tick(w, inp({ attack: true }));
    expect(h.state).toBe('jumpAttack');
    expect(HERO_DATA.moves.jumpAttack!.hitbox).not.toEqual(HERO_DATA.moves.attack1!.hitbox);
    run(w, 40);
    expect(v.hp).toBeLessThan(v.maxHp);
    expect(h.state).not.toBe('jumpAttack'); // landed
  });
});

describe('special', () => {
  it('costs SPECIAL_COST health and launches every enemy in range', () => {
    const w = createWorld(1); const h = heroOf(w);
    const a = spawnGang(w, 'brawler', h.pos.x + 30, h.pos.y); a.cooldown = 999;
    const b = spawnGang(w, 'brawler', h.pos.x - 30, h.pos.y + 6); b.cooldown = 999;
    tick(w, inp({ special: true }));
    expect(h.state).toBe('special');
    expect(h.hp).toBe(100 - SPECIAL_COST);
    run(w, moveTotal(HERO_DATA.moves.special!) + 2);
    expect(a.state).toBe('knockdown'); expect(b.state).toBe('knockdown');
  });
  it('cannot be used at or below its cost', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.hp = SPECIAL_COST;
    tick(w, inp({ special: true }));
    expect(h.state).toBe('idle');
    expect(h.hp).toBe(SPECIAL_COST);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Add the moves**

In `HERO_DATA.moves` add:
```ts
    jumpAttack: { startup: 2, active: 14, recovery: 0, hitbox: { x: 4, y: 12, w: 32, h: 28 }, damage: 8, level: 'heavy', pushback: 3 },
    special:    { startup: 6, active: 6, recovery: 20, hitbox: { x: -44, y: 0, w: 88, h: 60 }, damage: 20, level: 'launch', pushback: 4 },
```
and export `export const SPECIAL_COST = 10;`.

- [ ] **Step 4: Extend `updateHero`**

Insert before the generic `const move = HERO_DATA.moves[hero.state];` block:
```ts
  if (hero.state === 'jumpAttack') {
    if (hero.stateFrame > 1 && hero.pos.z === 0) { hero.vel.x = 0; setState(hero, 'idle'); }
    return;
  }
```
In the `case 'jump':` branch add first: `if (pressed(state, input, 'attack')) { setState(hero, 'jumpAttack'); break; }`.
In `case 'idle': case 'walk':` before the attack check:
```ts
      if (pressed(state, input, 'special') && hero.hp > SPECIAL_COST) {
        hero.hp -= SPECIAL_COST; setState(hero, 'special'); hero.vel.x = 0; hero.vel.y = 0;
        hero.invulnFrames = HERO_DATA.moves.special!.startup + HERO_DATA.moves.special!.active;
        emit(state, { type: 'sfx', id: 'special' });
        break;
      }
```
(imports: `SPECIAL_COST`, `emit`). The special's hitbox has negative x and the world rect flips with facing — both sides are covered because `w` spans both.

- [ ] **Step 5: Run tests + commit**

```bash
npm test
git add src/core/combat/frame-data.ts src/core/entities/hero.ts test/core/entities/hero-moves.test.ts
git commit -m "feat(core): hero jump attack and health-cost special from frame data"
```

### Task 7.2: Grab → throw, thrown enemies knock down others

**Files:**
- Modify: `src/core/entities/hero.ts`, `src/core/combat/stun.ts`, `src/core/combat/resolve.ts`, `src/core/combat/frame-data.ts`
- Create: `test/core/entities/hero-grab.test.ts`

**Interfaces:**
- Produces: `GRAB_BOX: Rect = { x: 2, y: 0, w: 18, h: 56 }`, `GRAB_TIMEOUT = 120`, `THROW = { vx: 5, vz: 3, damage: 10 }` (in `frame-data.ts`); hero states `grab`, `throw` (move: startup 6, active 1, recovery 14, hitbox zero-size); enemy states `grabbed`, `thrown`; `THROWN_MOVE` in `resolve.ts`; `holderOf(state, e)`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/hero-grab.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { HIT_FEEL } from '@core/combat/hit-feel';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };

function stunned(w: ReturnType<typeof createWorld>, dx: number, dy = 0) {
  const h = heroOf(w);
  const v = spawnGang(w, 'brawler', h.pos.x + dx, h.pos.y + dy);
  v.state = 'hurt'; v.hitstun = 60; v.cooldown = 999;
  return v;
}

describe('grab and throw', () => {
  it('walking into a stunned enemy grabs it; a non-stunned enemy is not grabbed', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    run(w, 12, inp({ right: true }));
    expect(h.state).toBe('grab'); expect(h.grabbedId).toBe(v.id); expect(v.state).toBe('grabbed');
    const w2 = createWorld(1); const h2 = heroOf(w2);
    const v2 = spawnGang(w2, 'brawler', h2.pos.x + 30, h2.pos.y); v2.cooldown = 999;
    run(w2, 12, inp({ right: true }));
    expect(h2.state).not.toBe('grab');
  });
  it('does not grab across the depth tolerance', () => {
    const w = createWorld(1); const h = heroOf(w);
    stunned(w, 30, 12);
    run(w, 12, inp({ right: true }));
    expect(h.state).not.toBe('grab');
  });
  it('Attack throws; the thrown enemy knocks down another enemy it hits and lands knocked down', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    const other = spawnGang(w, 'brawler', h.pos.x + 90, h.pos.y); other.cooldown = 999;
    run(w, 12, inp({ right: true }));
    tick(w, inp({ attack: true }));
    expect(h.state).toBe('throw');
    run(w, 8);
    expect(v.state).toBe('thrown');
    expect(v.hp).toBe(v.maxHp - 10);
    run(w, 60);
    expect(other.state === 'knockdown' || other.state === 'down').toBe(true);
    expect(['down', 'getup', 'dead']).toContain(v.state);
  });
  it('releases the grab after the timeout', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    run(w, 12, inp({ right: true }));
    run(w, 130);
    expect(h.state).toBe('idle'); expect(v.state).not.toBe('grabbed');
  });
  it('being hit while grabbing releases the enemy', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    run(w, 12, inp({ right: true }));
    h.hp = 50; h.hitstun = HIT_FEEL.hitstun.light; h.state = 'hurt';
    tick(w, EMPTY_INPUT);
    expect(v.state).not.toBe('grabbed'); expect(h.grabbedId).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Frame data**

In `frame-data.ts` add exports and a `throw` move (no hitbox of its own; the thrown body is the projectile):
```ts
export const GRAB_BOX: Rect = { x: 2, y: 0, w: 18, h: 56 };
export const GRAB_TIMEOUT = 120;
export const THROW = { vx: 5, vz: 3, damage: 10 } as const;
```
and in `HERO_DATA.moves`: `throw: { startup: 6, active: 1, recovery: 14, hitbox: { x: 0, y: 0, w: 0, h: 0 }, damage: 0, level: 'light', pushback: 0 },`.

- [ ] **Step 4: Hero grab/throw states**

In `hero.ts` add a helper and the states. Imports: `GRAB_BOX, GRAB_TIMEOUT, THROW`, `hitConnects`, `dataFor`, `byId`, `isBody`, `faction`.
```ts
function findGrabbable(state: WorldState, hero: Entity): Entity | undefined {
  return state.entities.find((e) => e.id !== hero.id && isBody(e) && faction(e) === 'gang' && e.kind !== 'boss'
    && e.state === 'hurt' && hitConnects(hero, GRAB_BOX, e, dataFor(e.kind).hurtbox));
}
export function releaseGrab(state: WorldState, hero: Entity): void {
  const v = byId(state, hero.grabbedId);
  if (v && v.state === 'grabbed') { setState(v, 'hurt'); v.hitstun = 8; }
  hero.grabbedId = null;
}
```
At the top of `updateHero`, right after `if (updateStunState(state, hero)) return;` — no: the release must happen even when stunned, so put **before** that line:
```ts
  if (hero.grabbedId !== null && hero.state !== 'grab' && hero.state !== 'throw') releaseGrab(state, hero);
```
Add cases before the generic move block:
```ts
  if (hero.state === 'grab') {
    hero.vel.x = 0; hero.vel.y = 0;
    const v = byId(state, hero.grabbedId);
    if (!v || v.state !== 'grabbed' || hero.stateFrame >= GRAB_TIMEOUT) { releaseGrab(state, hero); setState(hero, 'idle'); return; }
    if (pressed(state, input, 'attack')) { setState(hero, 'throw'); }
    return;
  }
  if (hero.state === 'throw') {
    hero.vel.x = 0; hero.vel.y = 0;
    const m = HERO_DATA.moves.throw!;
    if (hero.stateFrame === m.startup + 1) {
      const v = byId(state, hero.grabbedId);
      if (v && v.state === 'grabbed') {
        setState(v, 'thrown'); v.hp -= THROW.damage; v.flashFrames = HIT_FEEL.flashFrames;
        v.pos.z = 1; v.vel.z = THROW.vz; v.vel.x = THROW.vx * hero.facing; v.vel.y = 0; v.facing = (hero.facing * -1) as Facing;
        state.hitstop = Math.max(state.hitstop, HIT_FEEL.hitstop.heavy);
        emit(state, { type: 'sfx', id: 'throw' });
      }
      hero.grabbedId = null;
    }
    if (hero.stateFrame >= moveTotal(m)) setState(hero, 'idle');
    return;
  }
```
In `case 'walk':` (only when moving horizontally, i.e. `dx !== 0`) add before the attack check:
```ts
      if (dx !== 0) {
        const g = findGrabbable(state, hero);
        if (g) { setState(hero, 'grab'); hero.grabbedId = g.id; setState(g, 'grabbed'); g.hitstun = 0; hero.vel.x = 0; hero.vel.y = 0; emit(state, { type: 'sfx', id: 'grab' }); break; }
      }
```
(imports `HIT_FEEL`, `Facing`, `moveTotal`, `emit`.)

- [ ] **Step 5: `grabbed` and `thrown` in `stun.ts`; thrown bodies hit in `resolve.ts`**

Add to `updateStunState` (before `default`):
```ts
    case 'grabbed': {
      const holder = state.entities.find((h) => h.grabbedId === e.id);
      if (!holder) { setState(e, 'hurt'); e.hitstun = 8; return true; }
      e.vel.x = 0; e.vel.y = 0;
      e.pos.x = holder.pos.x + holder.facing * 14; e.pos.y = holder.pos.y; e.facing = (holder.facing * -1) as Facing;
      return true;
    }
    case 'thrown':
      if (e.stateFrame > 1 && e.pos.z === 0) { setState(e, 'knockdown'); e.stateFrame = 2; e.vel.x = 0; updateStunState(state, e); }
      return true;
```
(import `Facing`). Note the `knockdown` case already handles landing → `down`/`dead`; the recursive call reuses it.

In `resolve.ts` add:
```ts
export const THROWN_MOVE: MoveData = { startup: 0, active: 1, recovery: 0, hitbox: { x: -12, y: 0, w: 24, h: 40 }, damage: THROW.damage, level: 'launch', pushback: 2 };
```
and in `resolveHits`, replace `const move = activeMove(att); if (!move) continue;` with:
```ts
    const thrown = att.state === 'thrown' && att.pos.z > 0;
    const move = thrown ? THROWN_MOVE : activeMove(att);
    if (!move) continue;
```
and replace `if (!canHit(att, vic) …` with:
```ts
      const allowed = thrown ? (vic.id !== att.id && isBody(vic) && faction(vic) !== 'hero' && vic.state !== 'thrown') : canHit(att, vic);
      if (!allowed || att.hitIds.includes(vic.id) || vic.invulnFrames > 0) continue;
```
(imports `THROW` from frame-data.) In `applyHit`, score only for hero/hero-projectile attackers — thrown gang attacker gives no score (already the case).

- [ ] **Step 6: Run tests + commit**

```bash
npm test
git add src/core/entities/hero.ts src/core/combat/stun.ts src/core/combat/resolve.ts src/core/combat/frame-data.ts test/core/entities/hero-grab.test.ts
git commit -m "feat(core): grab stunned enemies and throw them as body projectiles"
```

### Task 7.3: Hero dead transition observable by the shell

**Files:**
- Modify: `src/core/combat/stun.ts`
- Create: `test/core/entities/hero-dead.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/hero-dead.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { applyKnockdown } from '@core/combat/resolve';

describe('hero death', () => {
  it('health 0 → knockdown → dead; stage.heroDead set; heroDead event emitted exactly once', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.hp = 0; applyKnockdown(w, h, 1);
    let events = 0;
    for (let i = 0; i < 120; i++) { tick(w, EMPTY_INPUT); events += w.events.filter((e) => e.type === 'heroDead').length; }
    expect(h.state).toBe('dead');
    expect(w.stage.heroDead).toBe(true);
    expect(events).toBe(1);
    expect(w.entities.includes(h)).toBe(true); // the hero is never culled
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement** — in `stun.ts`, the `knockdown` landing branch, replace the `if (e.hp <= 0)` block with:
```ts
        if (e.hp <= 0) {
          setState(e, 'dead');
          if (e.kind === 'hero') { if (!state.stage.heroDead) { state.stage.heroDead = true; emit(state, { type: 'heroDead' }); } }
          else { e.removeIn = 40; state.score += SCORE.ko; emit(state, { type: 'score', amount: SCORE.ko, x: e.pos.x, y: e.pos.y - 40 }); }
        }
```

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/combat/stun.ts test/core/entities/hero-dead.test.ts
git commit -m "feat(core): hero dead state with a single heroDead event for the shell"
```

### Task 7.4: Anim table entries for the new states (box fallback)

**Files:**
- Modify: `src/adapters/phaser/views/anim-table.ts`

- [ ] **Step 1: Add hero entries** so the view has a deterministic mapping now and ticket 12 only swaps `action` names:
```ts
    jump: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    jumpAttack: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    grab: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    throw: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    special: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    hurt: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    knockdown: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    down: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    getup: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
    dead: { atlas: 'hero', action: 'walk', fps: 0, loop: true },
```

- [ ] **Step 2: Browser check** — `npm run dev`: hit the brawler once (it staggers), walk into it: hero holds it in front; J throws it; K then J mid-air lands a jump attack; L at full health drains a little health and launches nearby boxes; let the brawler beat the hero down: hero lies still, does not get up, `game.scene.getScene('game').world.stage.heroDead === true` in the console.

- [ ] **Step 3: Commit**

```bash
npm run check
git add src/adapters/phaser/views/anim-table.ts
git commit -m "feat(adapter): map the full hero state set onto the M0 atlas actions"
```

**Ticket 07 verification gate:** six acceptance boxes; Vitest covers grab conditions, special cost, dead transition; all states remain data-driven (grep: no numeric timing literals in `hero.ts` other than `GRAB_TIMEOUT`/`THROW`/`SPECIAL_COST` imports).

---

# Ticket 08 — Gang trio + attacker-ticket AI

**Delivers:** brawler, fast low-HP knife, and a heavy with super-armour on wind-up fight as a group; at most two hold attacker tickets while the rest circle at ring distance and rotate in; a palette-swap variant hook is in place for ticket 13.

### Task 8.1: Knife and heavy data + super-armour on wind-up

**Files:**
- Modify: `src/core/entities/gang.ts`
- Create: `test/core/entities/gang-trio.test.ts`

**Interfaces:**
- Produces: `GANG_DATA.knife`, `GANG_DATA.heavy` (with `superArmour: true`); `GangData.superArmour?: boolean`; `spawnGang(state, kind, x, y, variant = 0)`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/gang-trio.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { GANG_DATA, spawnGang } from '@core/entities/gang';
import { applyHit } from '@core/combat/resolve';
import { HERO_DATA } from '@core/combat/frame-data';

describe('gang trio data', () => {
  it('knife is faster and frailer than the brawler; heavy is slower and tougher', () => {
    expect(GANG_DATA.knife.walkSpeed.x).toBeGreaterThan(GANG_DATA.brawler.walkSpeed.x);
    expect(GANG_DATA.knife.hp).toBeLessThan(GANG_DATA.brawler.hp);
    expect(GANG_DATA.heavy.walkSpeed.x).toBeLessThan(GANG_DATA.brawler.walkSpeed.x);
    expect(GANG_DATA.heavy.hp).toBeGreaterThan(GANG_DATA.brawler.hp);
    expect(GANG_DATA.heavy.moves.slam!.damage).toBeGreaterThan(GANG_DATA.brawler.moves.punch!.damage);
  });
  it('heavy ignores hitstun during wind-up but takes damage', () => {
    const w = createWorld(1); const h = heroOf(w);
    const hv = spawnGang(w, 'heavy', h.pos.x + 20, h.pos.y);
    hv.attackTicket = true; hv.cooldown = 0;
    for (let i = 0; i < 300 && hv.state !== 'slam'; i++) tick(w, EMPTY_INPUT);
    expect(hv.state).toBe('slam');
    expect(hv.armorFrames).toBeGreaterThan(0);
    const hp = hv.hp;
    applyHit(w, h, hv, HERO_DATA.moves.attack1!);
    expect(hv.hp).toBe(hp - HERO_DATA.moves.attack1!.damage);
    expect(hv.state).toBe('slam');
  });
  it('knife stabs quickly', () => {
    const w = createWorld(1); const h = heroOf(w);
    const k = spawnGang(w, 'knife', h.pos.x + 20, h.pos.y); k.attackTicket = true;
    let f = 0;
    for (; f < 300 && k.state !== 'stab'; f++) tick(w, EMPTY_INPUT);
    expect(k.state).toBe('stab');
    expect(f).toBeLessThan(60);
  });
  it('spawnGang records the palette-swap variant', () => {
    const w = createWorld(1);
    expect(spawnGang(w, 'brawler', 200, 160, 2).variant).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL (knife/heavy missing).

- [ ] **Step 3: Add the data**

```ts
  knife: {
    walkSpeed: { x: 1.8, y: 1.1 }, hp: 18, hurtbox: { x: -8, y: 0, w: 16, h: 52 }, jumpVz: 0,
    reach: 26, attackCooldown: 30, attackMove: 'stab',
    moves: { stab: { startup: 6, active: 3, recovery: 12, hitbox: { x: 4, y: 24, w: 22, h: 12 }, damage: 6, level: 'light', pushback: 1 } },
  },
  heavy: {
    walkSpeed: { x: 0.7, y: 0.5 }, hp: 60, hurtbox: { x: -15, y: 0, w: 30, h: 60 }, jumpVz: 0,
    reach: 34, attackCooldown: 60, attackMove: 'slam', superArmour: true,
    moves: { slam: { startup: 22, active: 5, recovery: 24, hitbox: { x: 6, y: 8, w: 34, h: 32 }, damage: 14, level: 'heavy', pushback: 4 } },
  },
```
Add `superArmour?: boolean` to `GangData`; remove the `as Record<GangKind, GangData>` cast. In `updateGang` where the attack starts: `setState(e, d.attackMove); if (d.superArmour) e.armorFrames = d.moves[d.attackMove]!.startup;`. Change `spawnGang` signature to `(state, kind, x, y, variant = 0)` and set `e.variant = variant`.

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/entities/gang.ts test/core/entities/gang-trio.test.ts
git commit -m "feat(core): knife and heavy gang types with super-armour wind-up"
```

### Task 8.2: Attacker tickets and ring positions

**Files:**
- Create: `src/core/ai/tickets.ts`, `test/core/ai/tickets.test.ts`
- Modify: `src/core/entities/gang.ts`, `src/core/sim/tick.ts`

**Interfaces:**
- Produces: `MAX_ATTACKERS = 2`, `TICKET_COOLDOWN = 45`, `RING_DISTANCE = 72`, `assignAttackTickets(state)`, `releaseTicket(e)`, `ringPosition(state, e): { x: number; y: number }`, `isGangKind(kind)`; gang state `ring`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/ai/tickets.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { MAX_ATTACKERS, isGangKind } from '@core/ai/tickets';
import { applyKnockdown } from '@core/combat/resolve';

describe('attacker tickets', () => {
  it('never more than 2 attackers at any tick across a 5-enemy fight', () => {
    const w = createWorld(1); const h = heroOf(w);
    const kinds = ['brawler', 'knife', 'heavy', 'brawler', 'knife'] as const;
    kinds.forEach((k, i) => spawnGang(w, k, h.pos.x + 60 + i * 30, h.pos.y + (i % 3) * 10));
    let maxTickets = 0, sawRing = false, sawAttack = false;
    for (let i = 0; i < 1200; i++) {
      tick(w, EMPTY_INPUT);
      const gangs = w.entities.filter((e) => isGangKind(e.kind));
      maxTickets = Math.max(maxTickets, gangs.filter((e) => e.attackTicket).length);
      if (gangs.some((e) => e.state === 'ring')) sawRing = true;
      if (gangs.some((e) => e.state === 'punch' || e.state === 'stab' || e.state === 'slam')) sawAttack = true;
    }
    expect(maxTickets).toBe(MAX_ATTACKERS);
    expect(sawRing && sawAttack).toBe(true);
  });
  it('releases a ticket on knockdown and on death', () => {
    const w = createWorld(1); const h = heroOf(w);
    const a = spawnGang(w, 'brawler', h.pos.x + 40, h.pos.y);
    const b = spawnGang(w, 'brawler', h.pos.x - 40, h.pos.y);
    const c = spawnGang(w, 'brawler', h.pos.x + 200, h.pos.y);
    tick(w, EMPTY_INPUT);
    expect(a.attackTicket && b.attackTicket).toBe(true); expect(c.attackTicket).toBe(false);
    applyKnockdown(w, a, 1); tick(w, EMPTY_INPUT);
    expect(a.attackTicket).toBe(false);
    b.hp = 0; applyKnockdown(w, b, 1); for (let i = 0; i < 60; i++) tick(w, EMPTY_INPUT);
    expect(b.attackTicket).toBe(false);
    expect(c.attackTicket).toBe(true);
  });
  it('ring enemies hover at ring distance and rotate in when a ticket frees', () => {
    const w = createWorld(1); const h = heroOf(w);
    const gangs = [0, 1, 2].map((i) => spawnGang(w, 'brawler', h.pos.x + 50 + i * 20, h.pos.y));
    const holders = new Set<number>();
    for (let i = 0; i < 1500; i++) { tick(w, EMPTY_INPUT); gangs.forEach((g) => { if (g.attackTicket) holders.add(g.id); }); }
    expect(holders.size).toBe(3);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `tickets.ts`**

```ts
// src/core/ai/tickets.ts
import type { Entity, EntityKind } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { heroOf, WALK_BAND } from '../sim/state';

export const MAX_ATTACKERS = 2;
export const TICKET_COOLDOWN = 45;
export const RING_DISTANCE = 72;
const OUT_OF_ACTION = new Set(['hurt', 'knockdown', 'down', 'getup', 'dead', 'grabbed', 'thrown']);

export const isGangKind = (k: EntityKind): boolean => k === 'brawler' || k === 'knife' || k === 'heavy';

export function releaseTicket(e: Entity): void {
  if (!e.attackTicket) return;
  e.attackTicket = false;
  e.ticketCooldown = TICKET_COOLDOWN;
}

export function assignAttackTickets(state: WorldState): void {
  const hero = heroOf(state);
  const gangs = state.entities.filter((e) => isGangKind(e.kind) && !e.dead);
  for (const g of gangs) if (g.attackTicket && (OUT_OF_ACTION.has(g.state) || g.hp <= 0)) releaseTicket(g);
  let held = gangs.filter((g) => g.attackTicket).length;
  if (held >= MAX_ATTACKERS) return;
  const candidates = gangs
    .filter((g) => !g.attackTicket && g.ticketCooldown === 0 && !OUT_OF_ACTION.has(g.state))
    .sort((a, b) => (Math.abs(a.pos.x - hero.pos.x) - Math.abs(b.pos.x - hero.pos.x)) || (a.id - b.id));
  for (const g of candidates) { if (held >= MAX_ATTACKERS) break; g.attackTicket = true; held++; }
}

/** Deterministic hover point: same side of the hero as the enemy, RING_DISTANCE away, depth offset by id. */
export function ringPosition(state: WorldState, e: Entity): { x: number; y: number } {
  const hero = heroOf(state);
  const side = e.pos.x >= hero.pos.x ? 1 : -1;
  const lane = (e.id % 3) - 1; // -1, 0, 1
  const y = Math.max(WALK_BAND.minY, Math.min(WALK_BAND.maxY, hero.pos.y + lane * 24));
  return { x: hero.pos.x + side * RING_DISTANCE, y };
}
```

- [ ] **Step 4: Use tickets in `updateGang`**

Replace the `idle`/`approach` cases and the move-finished branch:
```ts
  if (move) {
    e.vel.x = 0; e.vel.y = 0;
    if (e.stateFrame >= moveTotal(move)) { setState(e, 'idle'); e.cooldown = d.attackCooldown; releaseTicket(e); }
    return;
  }
  switch (e.state) {
    case 'idle':
      e.vel.x = 0; e.vel.y = 0;
      if (e.cooldown === 0) setState(e, e.attackTicket ? 'approach' : 'ring');
      break;
    case 'ring': {
      const p = ringPosition(state, e);
      approach(e, d, p.x, p.y, 6);
      e.facing = target.pos.x >= e.pos.x ? 1 : -1;
      if (e.attackTicket) setState(e, 'approach');
      break;
    }
    case 'approach': {
      if (!e.attackTicket) { setState(e, 'ring'); break; }
      const inRange = approach(e, d, target.pos.x, target.pos.y, d.reach);
      if (inRange) { setState(e, d.attackMove); if (d.superArmour) e.armorFrames = d.moves[d.attackMove]!.startup; e.vel.x = 0; e.vel.y = 0; }
      break;
    }
    default:
      setState(e, 'idle');
  }
```
(import `releaseTicket`, `ringPosition`.) In `tick.ts`: `import { assignAttackTickets } from '../ai/tickets';` and `POST_UPDATE_SYSTEMS = [assignAttackTickets, resolveHits]` — tickets are assigned **before** hits so a freshly stunned holder is released the same tick. Note: the brawler test from 06 must still pass — a lone brawler always gets a ticket on its first tick.

- [ ] **Step 5: Run tests + commit**

```bash
npm test
git add src/core/ai/tickets.ts src/core/entities/gang.ts src/core/sim/tick.ts test/core/ai/tickets.test.ts
git commit -m "feat(core): attacker-ticket group AI with ring positions and rotation"
```

### Task 8.3: Palette-swap hook in the view + a five-enemy scene

**Files:**
- Modify: `src/adapters/phaser/views/anim-table.ts`, `src/adapters/phaser/views/EntityView.ts`, `src/adapters/phaser/scenes/GameScene.ts`

**Interfaces:**
- Produces: `variantAtlasKey(base: string, variant: number): string` → `base` for 0, `${base}-v${variant}` otherwise; `EntityViews` resolves `spec.atlas` through it and falls back to the base atlas if the variant texture is missing; box views tint by `VARIANT_TINT = [0xffffff, 0xffd0d0, 0xd0ffd0, 0xd0d0ff]`.

- [ ] **Step 1: Implement the hook** — in `anim-table.ts`:
```ts
export const VARIANT_TINT = [0xffffff, 0xffd0d0, 0xd0ffd0, 0xd0d0ff] as const;
export const variantAtlasKey = (base: string, variant: number): string => (variant === 0 ? base : `${base}-v${variant}`);
```
In `EntityViews.sync`/`place`: choose `const atlasKey = this.scene.textures.exists(variantAtlasKey(spec.atlas, e.variant)) ? variantAtlasKey(spec.atlas, e.variant) : spec.atlas;` for sprite creation and frame lookup (frame names keep the base prefix `${spec.atlas}/...` — ticket 13 builds variant atlases with the same frame names). For rectangles keep the base fill colour and apply `v.setStrokeStyle(2, VARIANT_TINT[e.variant] ?? 0xffffff)` so variants are visible on boxes.

- [ ] **Step 2: Scene** — replace the single brawler spawn in `GameScene.create()` with:
```ts
    spawnGang(this.world, 'brawler', 300, 176, 0);
    spawnGang(this.world, 'knife', 340, 150, 1);
    spawnGang(this.world, 'heavy', 360, 200, 2);
    spawnGang(this.world, 'brawler', 380, 168, 1);
    spawnGang(this.world, 'knife', 250, 190, 0);
```

- [ ] **Step 3: Browser check** — `npm run dev`: at most two boxes close in at once; the others hover at ring distance on both sides and swap in after an attack or a knockdown; the purple heavy keeps winding up through light hits; the orange knife darts in fast. Stroke colours differ by variant.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/anim-table.ts src/adapters/phaser/views/EntityView.ts src/adapters/phaser/scenes/GameScene.ts
git commit -m "feat(adapter): palette-swap variant hook and a five-enemy test fight"
```

**Ticket 08 verification gate:** five acceptance boxes; Vitest proves ≤2 attackers over 1200 ticks and ticket release on knockdown/death.

---

# Ticket 09 — HUD, score pop-ups, pickups + breakable crates, name-cards

**Delivers:** top strip with health bar, six-digit score and credits on reserved-palette plates; score numbers pop at hit points; crates break into a lunch pail (health) or scrap gears (points); each enemy type's first appearance slams a name-card.

### Task 9.1: Bitmap fonts from Press Start 2P (OFL) via a build tool

**Files:**
- Create: `tools/fonts/build-retro-font.ts`, `assets/sources/fonts/PressStart2P-Regular.ttf`, `assets/sources/fonts/OFL.txt`, `public/assets/fonts/hud8.png`, `public/assets/fonts/display16.png`, `src/adapters/phaser/views/fonts.ts`
- Modify: `assets/LICENSES.md`, `package.json`, `src/adapters/phaser/scenes/BootScene.ts`

**Interfaces:**
- Produces: `RETRO_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ"` (59 glyphs, 16 per row); `installFonts(scene)` registers bitmap fonts `'hud8'` (8×8) and `'display16'` (16×16); script `fonts:build`.

- [ ] **Step 1: Fetch the font and licence**

```bash
mkdir -p assets/sources/fonts
curl -L -o assets/sources/fonts/PressStart2P-Regular.ttf https://github.com/google/fonts/raw/main/ofl/pressstart2p/PressStart2P-Regular.ttf
curl -L -o assets/sources/fonts/OFL.txt https://github.com/google/fonts/raw/main/ofl/pressstart2p/OFL.txt
npm i -D @napi-rs/canvas
```
Add a `LICENSES.md` row: `Press Start 2P | Google Fonts (CodeMan38) | — | — | date | — | SIL OFL 1.1 (assets/sources/fonts/OFL.txt) | no`.

- [ ] **Step 2: Write the tool**

```ts
// tools/fonts/build-retro-font.ts — npx tsx tools/fonts/build-retro-font.ts
import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

export const RETRO_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CELL = 8, PER_ROW = 16;

async function build(): Promise<void> {
  GlobalFonts.registerFromPath('assets/sources/fonts/PressStart2P-Regular.ttf', 'PressStart2P');
  const rows = Math.ceil(RETRO_CHARS.length / PER_ROW);
  const canvas = createCanvas(CELL * PER_ROW, CELL * rows);
  const ctx = canvas.getContext('2d');
  ctx.font = `${CELL}px PressStart2P`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < RETRO_CHARS.length; i++) ctx.fillText(RETRO_CHARS[i] as string, (i % PER_ROW) * CELL, Math.floor(i / PER_ROW) * CELL);
  const raw = Buffer.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  for (let i = 0; i < raw.length; i += 4) { const on = (raw[i + 3] as number) >= 128; raw[i] = raw[i + 1] = raw[i + 2] = 255; raw[i + 3] = on ? 255 : 0; }
  mkdirSync('public/assets/fonts', { recursive: true });
  const base = sharp(raw, { raw: { width: canvas.width, height: canvas.height, channels: 4 } });
  await base.clone().png().toFile('public/assets/fonts/hud8.png');
  await base.clone().resize(canvas.width * 2, canvas.height * 2, { kernel: 'nearest' }).png().toFile('public/assets/fonts/display16.png');
  console.log(`fonts: ${RETRO_CHARS.length} glyphs, ${canvas.width}x${canvas.height} (hud8) and 2x (display16)`);
}
build().catch((e) => { console.error(e); process.exit(1); });
```
Script: `"fonts:build": "tsx tools/fonts/build-retro-font.ts"`. Run it; open `hud8.png`: crisp white glyphs, 8-px cells, digits legible.

- [ ] **Step 3: Font registration in the adapter**

```ts
// src/adapters/phaser/views/fonts.ts
import Phaser from 'phaser';
export const RETRO_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function installFonts(scene: Phaser.Scene): void {
  for (const [key, size] of [['hud8', 8], ['display16', 16]] as const) {
    if (scene.cache.bitmapFont.exists(key)) continue;
    scene.cache.bitmapFont.add(key, Phaser.GameObjects.RetroFont.Parse(scene, {
      image: key, width: size, height: size, chars: RETRO_CHARS, charsPerRow: 16, 'offset.x': 0, 'offset.y': 0, 'spacing.x': 0, 'spacing.y': 0, lineSpacing: 0,
    }));
  }
}
```
Add to `BootScene.MANIFEST`: `{ key: 'hud8', type: 'image', url: '/assets/fonts/hud8.png' }`, `{ key: 'display16', type: 'image', url: '/assets/fonts/display16.png' }`. In `GameScene.create()` first line: `installFonts(this);`. Replace the monospace `pauseText` with `this.add.bitmapText(BASE_W / 2, BASE_H / 2, 'display16', '').setOrigin(0.5)`.

- [ ] **Step 4: Commit**

```bash
npm run check
git add tools/fonts/build-retro-font.ts assets/sources/fonts public/assets/fonts src/adapters/phaser/views/fonts.ts src/adapters/phaser/scenes/BootScene.ts src/adapters/phaser/scenes/GameScene.ts assets/LICENSES.md package.json package-lock.json
git commit -m "feat(adapter): 8x8 and 16x16 retro bitmap fonts built from Press Start 2P (OFL)"
```

### Task 9.2: Core HUD rules — health colour, score format, name-card timeline, enemy names

**Files:**
- Create: `src/core/arcade/hud.ts`, `test/core/arcade/hud.test.ts`

**Interfaces:**
- Produces: `HealthBand = 'green' | 'amber' | 'red'`; `healthBand(hp, maxHp)` (> 50 % green, > 25 % amber, else red); `formatScore(n)` (6 digits, zero-padded, clamped to 999999); `NAME_CARD = { inFrames: 6, holdFrames: 24, outFrames: 4, total: 34 }`; `nameCardX(frame: number, screenW: number, cardW: number): number | null` (constant-velocity slide from `-cardW` to centre, hold, exit right; `null` when finished); `ENEMY_NAMES: Record<string, string>`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/arcade/hud.test.ts
import { describe, it, expect } from 'vitest';
import { healthBand, formatScore, nameCardX, NAME_CARD, ENEMY_NAMES } from '@core/arcade/hud';

describe('hud rules', () => {
  it('health bands', () => {
    expect(healthBand(100, 100)).toBe('green');
    expect(healthBand(51, 100)).toBe('green');
    expect(healthBand(50, 100)).toBe('amber');
    expect(healthBand(26, 100)).toBe('amber');
    expect(healthBand(25, 100)).toBe('red');
    expect(healthBand(0, 100)).toBe('red');
  });
  it('score format is six digits, clamped', () => {
    expect(formatScore(0)).toBe('000000');
    expect(formatScore(1234)).toBe('001234');
    expect(formatScore(1_000_000)).toBe('999999');
  });
  it('name-card slides in over 6 frames, holds 24, exits over 4 at constant velocity', () => {
    const w = 384, cw = 200, centre = (w - cw) / 2;
    expect(nameCardX(0, w, cw)).toBe(-cw);
    expect(nameCardX(NAME_CARD.inFrames, w, cw)).toBe(centre);
    const step = nameCardX(1, w, cw)! - nameCardX(0, w, cw)!;
    expect(nameCardX(2, w, cw)! - nameCardX(1, w, cw)!).toBe(step);
    expect(nameCardX(NAME_CARD.inFrames + NAME_CARD.holdFrames, w, cw)).toBe(centre);
    expect(nameCardX(NAME_CARD.total, w, cw)).toBeNull();
    expect(nameCardX(NAME_CARD.total - 1, w, cw)!).toBeGreaterThan(centre);
  });
  it('every enemy kind has a display name', () => {
    for (const k of ['brawler', 'knife', 'heavy', 'feral', 'boss']) expect(ENEMY_NAMES[k]).toMatch(/^[A-Z ]+$/);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/arcade/hud.ts
export type HealthBand = 'green' | 'amber' | 'red';
export function healthBand(hp: number, maxHp: number): HealthBand {
  const r = hp / maxHp;
  return r > 0.5 ? 'green' : r > 0.25 ? 'amber' : 'red';
}
export const SCORE_MAX = 999_999;
export const formatScore = (n: number): string => String(Math.max(0, Math.min(SCORE_MAX, Math.floor(n)))).padStart(6, '0');

export const NAME_CARD = { inFrames: 6, holdFrames: 24, outFrames: 4, total: 34 } as const;
/** x of the card's left edge at `frame`, or null once the card has left. Constant velocity, no easing (Design §4). */
export function nameCardX(frame: number, screenW: number, cardW: number): number | null {
  const centre = (screenW - cardW) / 2;
  if (frame < NAME_CARD.inFrames) return -cardW + ((centre + cardW) * frame) / NAME_CARD.inFrames;
  if (frame < NAME_CARD.inFrames + NAME_CARD.holdFrames) return centre;
  const t = frame - NAME_CARD.inFrames - NAME_CARD.holdFrames;
  if (t >= NAME_CARD.outFrames) return null;
  return centre + ((screenW - centre) * t) / NAME_CARD.outFrames;
}

/** Working names (final names are an open question in HANDOFF.md; only this table changes). */
export const ENEMY_NAMES: Record<string, string> = {
  brawler: 'PIT BRAWLER', knife: 'SHIV', heavy: 'CRUSHER', feral: 'FERAL RIG', boss: 'THE FOREMAN',
};
```

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run test/core/arcade/hud.test.ts
git add src/core/arcade/hud.ts test/core/arcade/hud.test.ts
git commit -m "feat(core): HUD rules for health bands, score format and the name-card timeline"
```

### Task 9.3: Crates, pickups, and the once-per-type name-card system

**Files:**
- Create: `src/core/entities/items.ts`, `src/core/arcade/namecards.ts`, `test/core/entities/items.test.ts`, `test/core/arcade/namecards.test.ts`
- Modify: `src/core/sim/tick.ts`

**Interfaces:**
- Produces: `spawnCrate(state, x, y, contents: PickupKind): Entity` (hp 1, `pickupKind` = contents); `spawnPickup(state, kind, x, y)`; `updateCrate`, `updatePickup` registered in `ENTITY_UPDATERS`; `LUNCHPAIL_HEAL = 40`; `PICKUP_RADIUS = { x: 12, y: 8 }`; `nameCardSystem(state)` in `POST_UPDATE_SYSTEMS`.

- [ ] **Step 1: Write the failing tests**

```ts
// test/core/entities/items.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnCrate, spawnPickup, LUNCHPAIL_HEAL } from '@core/entities/items';
import { SCORE } from '@core/arcade/score';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };

describe('crates and pickups', () => {
  it('a hit breaks the crate and drops its contents', () => {
    const w = createWorld(1); const h = heroOf(w);
    const c = spawnCrate(w, h.pos.x + 20, h.pos.y, 'lunchpail');
    tick(w, inp({ attack: true })); run(w, 20);
    expect(w.entities.includes(c)).toBe(false);
    const p = w.entities.find((e) => e.kind === 'pickup');
    expect(p?.pickupKind).toBe('lunchpail');
    expect(w.score).toBe(SCORE.hit + SCORE.crate);
  });
  it('lunch pail heals, clamped to maxHp; gear adds points', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.hp = 90;
    spawnPickup(w, 'lunchpail', h.pos.x + 10, h.pos.y);
    run(w, 3);
    expect(h.hp).toBe(100);
    expect(LUNCHPAIL_HEAL).toBe(40);
    spawnPickup(w, 'gear', h.pos.x + 10, h.pos.y);
    run(w, 3);
    expect(w.score).toBe(SCORE.gear);
    expect(w.entities.filter((e) => e.kind === 'pickup')).toHaveLength(0);
  });
  it('pickups are not collected across the depth tolerance', () => {
    const w = createWorld(1); const h = heroOf(w);
    spawnPickup(w, 'gear', h.pos.x, h.pos.y + 20);
    run(w, 3);
    expect(w.score).toBe(0);
  });
});
```

```ts
// test/core/arcade/namecards.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';

describe('name-cards', () => {
  it('fires once per enemy type per game, on first appearance', () => {
    const w = createWorld(1); const h = heroOf(w);
    const cards: string[] = [];
    spawnGang(w, 'brawler', h.pos.x + 300, h.pos.y);
    tick(w, EMPTY_INPUT); cards.push(...w.events.filter((e) => e.type === 'namecard').map((e) => (e as { kind: string }).kind));
    spawnGang(w, 'brawler', h.pos.x + 320, h.pos.y); spawnGang(w, 'knife', h.pos.x + 340, h.pos.y);
    tick(w, EMPTY_INPUT); cards.push(...w.events.filter((e) => e.type === 'namecard').map((e) => (e as { kind: string }).kind));
    for (let i = 0; i < 100; i++) { tick(w, EMPTY_INPUT); cards.push(...w.events.filter((e) => e.type === 'namecard').map((e) => (e as { kind: string }).kind)); }
    expect(cards).toEqual(['brawler', 'knife']);
    expect(w.seenNameCards).toEqual(['brawler', 'knife']);
  });
});
```

- [ ] **Step 2: Run to verify they fail** — Expected: FAIL.

- [ ] **Step 3: Implement `items.ts`**

```ts
// src/core/entities/items.ts
import type { InputFrame } from '../types';
import type { Entity, PickupKind } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit, heroOf, spawn } from '../sim/state';
import { DEPTH_TOLERANCE } from '../combat/hit';
import { SCORE } from '../arcade/score';

export const LUNCHPAIL_HEAL = 40;
export const PICKUP_RADIUS = { x: 12, y: DEPTH_TOLERANCE } as const;
export const CRATE_HURTBOX = { x: -12, y: 0, w: 24, h: 24 } as const;

export function spawnCrate(state: WorldState, x: number, y: number, contents: PickupKind): Entity {
  const c = spawn(state, 'crate', x, y);
  c.hp = 1; c.maxHp = 1; c.pickupKind = contents;
  return c;
}
export function spawnPickup(state: WorldState, kind: PickupKind, x: number, y: number): Entity {
  const p = spawn(state, 'pickup', x, y);
  p.pickupKind = kind;
  return p;
}

export function updateCrate(state: WorldState, c: Entity, _input: InputFrame): void {
  c.stateFrame++;
  if (c.state === 'break' && c.stateFrame === 1) {
    state.score += SCORE.crate;
    emit(state, { type: 'score', amount: SCORE.crate, x: c.pos.x, y: c.pos.y - 24 });
    emit(state, { type: 'sfx', id: 'crate' });
    spawnPickup(state, c.pickupKind ?? 'gear', c.pos.x, c.pos.y);
    c.dead = true;
  }
}

export function updatePickup(state: WorldState, p: Entity, _input: InputFrame): void {
  p.stateFrame++;
  const hero = heroOf(state);
  if (hero.pos.z > 0 || hero.state === 'dead') return;
  if (Math.abs(hero.pos.x - p.pos.x) > PICKUP_RADIUS.x || Math.abs(hero.pos.y - p.pos.y) > PICKUP_RADIUS.y) return;
  if (p.pickupKind === 'lunchpail') hero.hp = Math.min(hero.maxHp, hero.hp + LUNCHPAIL_HEAL);
  else { state.score += SCORE.gear; emit(state, { type: 'score', amount: SCORE.gear, x: p.pos.x, y: p.pos.y - 24 }); }
  emit(state, { type: 'pickup', kind: p.pickupKind ?? 'gear', x: p.pos.x, y: p.pos.y });
  emit(state, { type: 'sfx', id: 'pickup' });
  p.dead = true;
}
```
In `resolve.ts` replace the inline crate hurtbox literal with `CRATE_HURTBOX` (import from items). In `tick.ts` register `crate: updateCrate, pickup: updatePickup`.

- [ ] **Step 4: Implement `namecards.ts` and register**

```ts
// src/core/arcade/namecards.ts
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import { ENEMY_NAMES } from './hud';

/** First appearance of each enemy type (and the boss) fires one namecard event per game. */
export function nameCardSystem(state: WorldState): void {
  for (const e of state.entities) {
    if (!(e.kind in ENEMY_NAMES) || state.seenNameCards.includes(e.kind)) continue;
    state.seenNameCards.push(e.kind);
    emit(state, { type: 'namecard', kind: e.kind });
    emit(state, { type: 'sfx', id: 'namecard' });
  }
}
```
`tick.ts`: `POST_UPDATE_SYSTEMS = [assignAttackTickets, resolveHits, nameCardSystem]`.

- [ ] **Step 5: Run tests + commit**

```bash
npm test
git add src/core/entities/items.ts src/core/arcade/namecards.ts src/core/combat/resolve.ts src/core/sim/tick.ts test/core/entities/items.test.ts test/core/arcade/namecards.test.ts
git commit -m "feat(core): breakable crates, walk-over pickups and once-per-type name-cards"
```

### Task 9.4: Adapter — HUD plates, score pops, name-card banner

**Files:**
- Create: `src/adapters/phaser/views/hud-colours.ts`, `src/adapters/phaser/views/Hud.ts`, `src/adapters/phaser/views/ScorePop.ts`, `src/adapters/phaser/views/NameCard.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`, `src/adapters/phaser/views/EntityView.ts` (boxes for crate/pickup already exist)

**Interfaces:**
- Produces: `HUD_COLOURS` (provisional hex; ticket 04 rewrites this file to read the reserved slots from `assets/palette.json`); `HudModel { hp; maxHp; score; credits; weapon: { kind; heat; max } | null; creditFlash: number }`; `Hud(scene)` with `render(model)`; `ScorePops(scene)` with `spawn(amount, x, y)` and `step(n)`; `NameCardView(scene)` with `show(text)` and `step(n)` (all frame-stepped by sim ticks, never by wall time).

- [ ] **Step 1: Colours (provisional)**

```ts
// src/adapters/phaser/views/hud-colours.ts
/** Provisional until ticket 04 freezes assets/palette.json; then this file reads the reserved slots. */
export const HUD_COLOURS = {
  plate: 0x0c0a0e, brass: 0xb08d3c, text: 0xe8dcc0,
  healthGreen: 0x3fbf5a, healthAmber: 0xe0a030, healthRed: 0xd03030,
  heatCyan: 0x40d0e0, heatWhite: 0xffffff, gold: 0xf0c040, danger: 0xe0207a,
} as const;
```

- [ ] **Step 2: HUD**

```ts
// src/adapters/phaser/views/Hud.ts
import Phaser from 'phaser';
import { formatScore, healthBand } from '@core/arcade/hud';
import { HUD_COLOURS } from './hud-colours';

export interface HudModel { hp: number; maxHp: number; score: number; credits: number; weapon: { kind: string; heat: number; max: number } | null; creditFlash: number }

// All positions on the 8-px grid inside the 16-px top band (Design §3.2).
const HEALTH = { x: 8, y: 4, w: 96, h: 8 };
const SCORE_X = 128, CREDITS_X = 296, TEXT_Y = 4;
const HEAT = { x: 8, y: 208, w: 64, h: 8 };

export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private score: Phaser.GameObjects.BitmapText;
  private credits: Phaser.GameObjects.BitmapText;
  constructor(private scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(2000).setScrollFactor(0);
    this.score = scene.add.bitmapText(SCORE_X, TEXT_Y, 'hud8', 'SCORE 000000').setDepth(2001).setTint(HUD_COLOURS.text);
    this.credits = scene.add.bitmapText(CREDITS_X, TEXT_Y, 'hud8', 'CREDIT 0').setDepth(2001).setTint(HUD_COLOURS.text);
  }
  render(m: HudModel): void {
    const g = this.g; g.clear();
    // plates: one shared style (dark plate + brass border) so the three elements read as one group (Design §3.2)
    const PLATES = [{ x: HEALTH.x - 4, w: HEALTH.w + 8 }, { x: SCORE_X - 4, w: 108 }, { x: CREDITS_X - 4, w: 76 }];
    for (const p of PLATES) {
      g.fillStyle(HUD_COLOURS.plate, 1); g.fillRect(p.x, 0, p.w, 16);
      g.lineStyle(1, HUD_COLOURS.brass, 1); g.strokeRect(p.x + 0.5, 0.5, p.w - 1, 15);
    }
    // health: bar length is the primary cue, colour secondary
    const band = healthBand(m.hp, m.maxHp);
    const col = band === 'green' ? HUD_COLOURS.healthGreen : band === 'amber' ? HUD_COLOURS.healthAmber : HUD_COLOURS.healthRed;
    const fill = Math.round((HEALTH.w - 4) * Math.max(0, m.hp) / m.maxHp);
    g.fillStyle(col, 1); g.fillRect(HEALTH.x + 4, HEALTH.y, fill, HEALTH.h);
    for (let x = HEALTH.x + 4 + 8; x < HEALTH.x + 4 + fill; x += 8) { g.fillStyle(HUD_COLOURS.plate, 1); g.fillRect(x, HEALTH.y, 1, HEALTH.h); } // segments
    this.score.setText(`SCORE ${formatScore(m.score)}`);
    this.credits.setText(`CREDIT ${m.credits}`);
    // coin-accepted pulse: 1.0 → 1.15 → 1.0 over 2 frames, hand-stepped
    this.credits.setScale(m.creditFlash === 2 ? 1.15 : 1);
    // weapon heat (ticket 11 fills the model; drawing lives here so the layout is fixed now)
    if (m.weapon) {
      g.fillStyle(HUD_COLOURS.plate, 1); g.fillRect(HEAT.x - 4, HEAT.y - 4, HEAT.w + 8, HEAT.h + 8);
      const seg = HEAT.w / m.weapon.max;
      for (let i = 0; i < m.weapon.heat; i++) {
        const t = i / Math.max(1, m.weapon.max - 1);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(HUD_COLOURS.heatCyan), Phaser.Display.Color.ValueToColor(HUD_COLOURS.heatWhite), 1, t);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
        g.fillRect(HEAT.x + i * seg, HEAT.y, Math.ceil(seg) - 1, HEAT.h);
      }
      if (m.weapon.heat === 1) { g.lineStyle(1, HUD_COLOURS.healthRed, 1); g.strokeRect(HEAT.x - 4.5, HEAT.y - 4.5, HEAT.w + 9, HEAT.h + 9); }
    }
  }
}
```

- [ ] **Step 3: Score pops and name-card**

```ts
// src/adapters/phaser/views/ScorePop.ts
import type Phaser from 'phaser';
import { HUD_COLOURS } from './hud-colours';
const LIFE = 40;
export class ScorePops {
  private pops: Array<{ t: Phaser.GameObjects.BitmapText; age: number; wx: number; wy: number }> = [];
  constructor(private scene: Phaser.Scene) {}
  spawn(amount: number, wx: number, wy: number): void {
    const t = this.scene.add.bitmapText(0, 0, 'hud8', String(amount)).setOrigin(0.5, 1).setDepth(1500).setTint(HUD_COLOURS.gold);
    this.pops.push({ t, age: 0, wx, wy });
  }
  /** Advance by n sim ticks and reposition against the camera. */
  step(n: number, cameraX: number): void {
    for (const p of this.pops) { p.age += n; p.t.setPosition(Math.round(p.wx - cameraX), Math.round(p.wy - p.age)); }
    this.pops = this.pops.filter((p) => { if (p.age >= LIFE) { p.t.destroy(); return false; } return true; });
  }
}
```

```ts
// src/adapters/phaser/views/NameCard.ts
import type Phaser from 'phaser';
import { nameCardX, NAME_CARD } from '@core/arcade/hud';
import { HUD_COLOURS } from './hud-colours';
import { BASE_W } from '@shell/scale';

const CARD_W = 256, CARD_H = 32, CARD_Y = 96;
export class NameCardView {
  private g: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.BitmapText;
  private frame = NAME_CARD.total;
  private queue: string[] = [];
  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(2500).setVisible(false);
    this.text = scene.add.bitmapText(0, 0, 'display16', '').setOrigin(0.5).setDepth(2501).setTint(HUD_COLOURS.text).setVisible(false);
  }
  show(name: string): void { this.queue.push(name); }
  step(n: number): void {
    if (this.frame >= NAME_CARD.total && this.queue.length > 0) { this.text.setText(this.queue.shift() as string); this.frame = 0; }
    if (this.frame >= NAME_CARD.total) { this.g.setVisible(false); this.text.setVisible(false); return; }
    this.frame += n;
    const x = nameCardX(this.frame, BASE_W, CARD_W);
    if (x === null) { this.frame = NAME_CARD.total; this.g.setVisible(false); this.text.setVisible(false); return; }
    this.g.clear().setVisible(true);
    this.g.fillStyle(HUD_COLOURS.plate, 1).fillRect(Math.round(x), CARD_Y, CARD_W, CARD_H);
    this.g.lineStyle(2, HUD_COLOURS.brass, 1).strokeRect(Math.round(x) + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);
    this.text.setVisible(true).setPosition(Math.round(x) + CARD_W / 2, CARD_Y + CARD_H / 2);
  }
}
```

- [ ] **Step 4: Wire into `GameScene`**

Fields: `hud`, `pops`, `nameCard`, `creditFlash = 0`. In `create()`: construct them; spawn two crates: `spawnCrate(this.world, 200, 190, 'lunchpail'); spawnCrate(this.world, 240, 150, 'gear');`. In `update()` change the fixed-step call so events are consumed per tick:
```ts
    const steps = advanceFixedStep(this.fixed, delta, () => {
      tick(this.world, input);
      for (const ev of this.world.events) {
        if (ev.type === 'score') this.pops.spawn(ev.amount, ev.x, ev.y);
        else if (ev.type === 'namecard') this.nameCard.show(ENEMY_NAMES[ev.kind] ?? ev.kind.toUpperCase());
      }
    });
    this.views.sync(this.world);
    this.pops.step(steps, this.world.camera.x);
    this.nameCard.step(steps);
    const hero = heroOf(this.world);
    this.hud.render({ hp: hero.hp, maxHp: hero.maxHp, score: this.world.score, credits: 0, weapon: null, creditFlash: this.creditFlash });
```
(imports: `ENEMY_NAMES`, `heroOf`, `spawnCrate`.) The HUD, pops and name-card objects must ignore the camera: HUD uses `setScrollFactor(0)`; since this scene positions world objects by subtracting `camera.x` manually (the Phaser camera never scrolls), nothing else is needed.

- [ ] **Step 5: Browser check** — `npm run dev`: top band shows the brass-bordered health bar, `SCORE 000000`, `CREDIT 0`; hits pop gold numbers that rise and vanish; breaking the crates drops a pail (heals) and a gear (+200); the first brawler slams `PIT BRAWLER` across the screen at constant speed (6 in / 24 hold / 4 out), the first knife slams `SHIV`, a second brawler does not. Health bar goes amber below half and red below a quarter; length is obviously the primary cue.

- [ ] **Step 6: Commit**

```bash
npm run check
git add src/adapters/phaser/views/hud-colours.ts src/adapters/phaser/views/Hud.ts src/adapters/phaser/views/ScorePop.ts src/adapters/phaser/views/NameCard.ts src/adapters/phaser/scenes/GameScene.ts
git commit -m "feat(adapter): HUD plates, rising score pops and constant-velocity name-cards"
```

**Ticket 09 verification gate:** six acceptance boxes; HUD positions all on the 8-px grid inside 16 px (assert by reading the constants); Vitest covers score arithmetic, health clamp, once-per-type.

---

# Ticket 04 — Master palette lock: Foundry Gates backgrounds + palette.json; hero re-quantised

**Delivers:** section-1 sky/mid/ground parallax layers in-engine, the 64-colour master palette frozen in `assets/palette.json` with the `Design.md` §2.1 group structure and reserved slots, hero re-quantised to it. ⛔ **Human gates: credits (three Nano Banana Pro generations + retries); owner signs off the look.**

### Task 4.1: ⛔ Foundry Gates layers on Nano Banana Pro

**Files:**
- Create: `assets/sources/bg/s1-sky.png`, `assets/sources/bg/s1-mid.png`, `assets/sources/bg/s1-ground.png`, matching `*.prompt.txt`
- Modify: `assets/LICENSES.md`

- [ ] **Step 1: Prompts from the `Design.md` §3.6 background template**

`s1-sky.prompt.txt`:
```
Foundry Gates — sky/far parallax layer, occult-industrial foundry, 1993 arcade beat-'em-up background art style,
night skyline of smokestacks silhouetted against a molten-orange horizon glow, distant furnace light, low cloud,
seamless horizontal tiling suitable for side-scroll looping, muted industrial palette with molten-orange accent lighting,
no characters, no text, no real-world brand or trademarked structure.
```
`s1-mid.prompt.txt`: `… mid parallax layer … chain-link fencing, rusted gantries, the great iron gate of the foundry with occult sigils worked into the metal, on a transparent-friendly flat #808080 backdrop above the ground line …`
`s1-ground.prompt.txt`: `… ground parallax layer … cracked asphalt and steel plating floor strip, oil stains, scattered scrap, seamless horizontal tiling, the floor occupies the whole image height …`

- [ ] **Step 2: Generate** — balance check; `mcp__higgsfield__generate_image` ×3 with Nano Banana Pro at **21:9**; `jobs_wait`; download to `assets/sources/bg/`. Add three `LICENSES.md` rows + ledger. Regenerate a layer at most twice if it has text, characters or a recognisable landmark.

- [ ] **Step 3: Commit**

```bash
git add assets/sources/bg assets/LICENSES.md
git commit -m "art: Foundry Gates sky, mid and ground source layers"
```

### Task 4.2: Master palette file with groups and reserved slots

**Files:**
- Create: `tools/art/make-master-palette.ts`, `assets/palette.json`, `test/tools/master-palette.test.ts`
- Modify: `tools/art/palette.ts` (`loadPaletteFile(path, opts)`), `tools/art/manifests/hero.json`

**Interfaces:**
- Produces: `PaletteFile.groups[i] = { name, slots: number[], reserved?: boolean }`; `loadPaletteFile(path, { worldOnly?: boolean })` — `worldOnly` drops reserved groups; group layout **fixed**: neutrals 8 (0–7), skin 6 (8–13), molten 8 (14–21), infernal 6 (22–27), industrial 10 (28–37), ui-chrome 10 (38–47, reserved), hud-state 8 (48–55, reserved), score-pickup 4 (56–59, reserved), reserve 4 (60–63, reserved). Reserved hex values are hand-authored **here** (they are UI tokens, not derived from art):

```
ui-chrome (38–47): #0c0a0e #16121a #221b24 #2f2530 #3d3140 #6b5a2e #8a7439 #b08d3c #d4b25a #e8dcc0
hud-state (48–55): #3fbf5a #2a8f45 #e0a030 #b07a20 #d03030 #8f2020 #40d0e0 #ffffff
score-pickup (56–59): #f0c040 #c89a2a #ffe58a #7a5a12
reserve (60–63): #ff3ea8 #ff7a3e #ffd23e #ffffff   (boss phase-2 emissive; held until ticket 16)
```

- [ ] **Step 1: Write the failing test**

```ts
// test/tools/master-palette.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { loadPaletteFile, type PaletteFile } from '../../tools/art/palette';

describe('assets/palette.json', () => {
  it('has exactly 64 colours in the Design §2.1 group structure with reserved slots', () => {
    if (!existsSync('assets/palette.json')) return; // built in Task 4.2 step 3
    const f = JSON.parse(readFileSync('assets/palette.json', 'utf8')) as PaletteFile;
    expect(f.colours).toHaveLength(64);
    expect(new Set(f.colours).size).toBe(64);
    expect(f.colours.every((c) => /^#[0-9a-f]{6}$/.test(c))).toBe(true);
    const names = f.groups.map((g) => g.name);
    expect(names).toEqual(['neutrals', 'skin', 'molten', 'infernal', 'industrial', 'ui-chrome', 'hud-state', 'score-pickup', 'reserve']);
    expect(f.groups.map((g) => g.slots.length)).toEqual([8, 6, 8, 6, 10, 10, 8, 4, 4]);
    expect(f.groups.filter((g) => g.reserved).map((g) => g.name)).toEqual(['ui-chrome', 'hud-state', 'score-pickup', 'reserve']);
    expect(f.groups.flatMap((g) => g.slots)).toEqual(Array.from({ length: 64 }, (_, i) => i));
    expect(loadPaletteFile('assets/palette.json', { worldOnly: true })).toHaveLength(38);
    expect(loadPaletteFile('assets/palette.json')).toHaveLength(64);
  });
});
```

- [ ] **Step 2: Extend `loadPaletteFile`** in `tools/art/palette.ts`:
```ts
export interface PaletteFile { name: string; groups: Array<{ name: string; slots: number[]; reserved?: boolean }>; colours: string[] }
export function loadPaletteFile(path: string, opts: { worldOnly?: boolean } = {}): RGB[] {
  const f = JSON.parse(readFileSync(path, 'utf8')) as PaletteFile;
  const keep = new Set<number>();
  for (const g of f.groups) if (!(opts.worldOnly && g.reserved)) g.slots.forEach((s) => keep.add(s));
  if (f.groups.length === 0) f.colours.forEach((_, i) => keep.add(i));
  return f.colours.filter((_, i) => keep.has(i)).map(unhex);
}
```

- [ ] **Step 3: The palette tool**

```ts
// tools/art/make-master-palette.ts — npx tsx tools/art/make-master-palette.ts
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { buildPalette, hex, type RGB } from './palette';

const SOURCES = ['assets/sources/hero/walk.png', 'assets/sources/hero/attack.png', 'assets/sources/bg/s1-sky.png', 'assets/sources/bg/s1-mid.png', 'assets/sources/bg/s1-ground.png'];
const RESERVED: Record<string, string[]> = {
  'ui-chrome': ['#0c0a0e', '#16121a', '#221b24', '#2f2530', '#3d3140', '#6b5a2e', '#8a7439', '#b08d3c', '#d4b25a', '#e8dcc0'],
  'hud-state': ['#3fbf5a', '#2a8f45', '#e0a030', '#b07a20', '#d03030', '#8f2020', '#40d0e0', '#ffffff'],
  'score-pickup': ['#f0c040', '#c89a2a', '#ffe58a', '#7a5a12'],
  'reserve': ['#ff3ea8', '#ff7a3e', '#ffd23e', '#ffffff'],
};
const WORLD_GROUPS: Array<[string, number]> = [['neutrals', 8], ['skin', 6], ['molten', 8], ['infernal', 6], ['industrial', 10]];

function hsv(c: RGB): { h: number; s: number; v: number } {
  const [r, g, b] = c.map((x) => x / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
/** Heuristic classifier; the owner hand-adjusts once afterwards (Solution-PRD §6.1). */
function classify(c: RGB): string {
  const { h, s, v } = hsv(c);
  if (s < 0.18) return 'neutrals';
  if (h >= 300 || h < 12) return s > 0.45 ? 'infernal' : 'industrial';
  if (h >= 12 && h < 60 && s > 0.55 && v > 0.55) return 'molten';
  if (h >= 12 && h < 45 && s <= 0.55) return 'skin';
  return 'industrial';
}

async function main(): Promise<void> {
  const chunks: Uint8Array[] = [];
  for (const p of SOURCES) chunks.push(new Uint8Array(await sharp(p).ensureAlpha().resize({ width: 320 }).raw().toBuffer()));
  const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0)); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  const world = buildPalette(all, 38);
  const buckets: Record<string, RGB[]> = {}; for (const [g] of WORLD_GROUPS) buckets[g] = [];
  for (const c of world) buckets[classify(c)]!.push(c);
  // fill/trim each group to its slot count: overflow spills into 'industrial', shortfall borrows from the largest bucket
  const colours: string[] = []; const groups: Array<{ name: string; slots: number[]; reserved?: boolean }> = [];
  const spill: RGB[] = [];
  for (const [g, n] of WORLD_GROUPS) { const b = buckets[g]!; while (b.length > n) spill.push(b.pop() as RGB); }
  for (const [g, n] of WORLD_GROUPS) {
    const b = buckets[g]!;
    while (b.length < n && spill.length) b.push(spill.pop() as RGB);
    while (b.length < n) { const big = WORLD_GROUPS.map(([k]) => buckets[k]!).sort((x, y) => y.length - x.length)[0]!; b.push(big.pop() as RGB); }
    groups.push({ name: g, slots: b.map((_, i) => colours.length + i) }); colours.push(...b.map(hex));
  }
  for (const [g, hexes] of Object.entries(RESERVED)) { groups.push({ name: g, slots: hexes.map((_, i) => colours.length + i), reserved: true }); colours.push(...hexes); }
  if (colours.length !== 64) throw new Error(`expected 64 colours, got ${colours.length}`);
  writeFileSync('assets/palette.json', JSON.stringify({ name: 'slag-city-master', groups, colours }, null, 1));
  console.log('wrote assets/palette.json');
}
main().catch((e) => { console.error(e); process.exit(1); });
```
Run it; run the test. ⛔ **Owner hand-adjusts once** (swap colours between world groups, nudge hex values) in `assets/palette.json`, then the test must still pass. Update `tools/art/manifests/hero.json`: `"palette": "assets/palette.json"` and add `"worldOnly": true` (add `worldOnly?: boolean` to `AtlasManifest` and pass it to `loadPaletteFile`).

- [ ] **Step 4: Commit**

```bash
npx vitest run test/tools
git add tools/art/make-master-palette.ts tools/art/palette.ts tools/art/build-atlas.ts tools/art/manifests/hero.json assets/palette.json test/tools/master-palette.test.ts
git commit -m "art: freeze the 64-colour master palette with reserved UI/HUD slots"
```

### Task 4.3: Background build tool + seam check; hero re-quantised

**Files:**
- Create: `tools/art/build-background.ts`, `tools/art/seam-check.ts`, `tools/art/manifests/bg-s1.json`, `test/tools/seam-check.test.ts`, `public/assets/backgrounds/s1-{sky,mid,ground}.png`
- Modify: `public/assets/atlases/hero.{png,json}` (rebuilt), `package.json`

**Interfaces:**
- Produces: `BgManifest = { section: string; palette: string; layers: Array<{ name: 'sky' | 'mid' | 'ground'; source: string; height: number; loop: boolean; bgKey?: string }> }`; `seamScore(png): Promise<number>` (mean abs RGB diff between the first and last columns, 0–255; **fail if > 24**); scripts `art:bg`, `art:seam`.

- [ ] **Step 1: Write the failing seam test**

```ts
// test/tools/seam-check.test.ts
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { seamScore, SEAM_MAX } from '../../tools/art/seam-check';
const TMP = '/Volumes/E Drive/Dev/.scratch/slag-city-test/seam';
describe('seam check', () => {
  it('a flat image scores 0; a hard left/right contrast fails', async () => {
    mkdirSync(TMP, { recursive: true });
    await sharp({ create: { width: 64, height: 16, channels: 4, background: '#404040' } }).png().toFile(`${TMP}/flat.png`);
    await sharp({ create: { width: 64, height: 16, channels: 4, background: '#000000' } })
      .composite([{ input: { create: { width: 32, height: 16, channels: 4, background: '#ffffff' } }, left: 32, top: 0 }]).png().toFile(`${TMP}/split.png`);
    expect(await seamScore(`${TMP}/flat.png`)).toBe(0);
    expect(await seamScore(`${TMP}/split.png`)).toBeGreaterThan(SEAM_MAX);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// tools/art/seam-check.ts — npx tsx tools/art/seam-check.ts <png>
import sharp from 'sharp';
export const SEAM_MAX = 24;
export async function seamScore(png: string): Promise<number> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let y = 0; y < info.height; y++) {
    const l = (y * info.width) * 4, r = (y * info.width + info.width - 1) * 4;
    sum += Math.abs(data[l]! - data[r]!) + Math.abs(data[l + 1]! - data[r + 1]!) + Math.abs(data[l + 2]! - data[r + 2]!);
  }
  return sum / (info.height * 3);
}
if (process.argv[1]?.endsWith('seam-check.ts')) {
  const p = process.argv[2]; if (!p) { console.error('usage: seam-check <png>'); process.exit(2); }
  seamScore(p).then((s) => { console.log(`${p}: seam ${s.toFixed(1)} (max ${SEAM_MAX})`); process.exit(s > SEAM_MAX ? 1 : 0); });
}
```

```ts
// tools/art/build-background.ts — npx tsx tools/art/build-background.ts tools/art/manifests/bg-s1.json
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { loadPaletteFile, quantise } from './palette';
import { seamScore, SEAM_MAX } from './seam-check';

export interface BgManifest { section: string; palette: string; layers: Array<{ name: 'sky' | 'mid' | 'ground'; source: string; height: number; loop: boolean; bgKey?: string }> }

export async function buildBackground(m: BgManifest): Promise<string[]> {
  mkdirSync('public/assets/backgrounds', { recursive: true });
  const palette = loadPaletteFile(m.palette, { worldOnly: true });
  const outs: string[] = [];
  for (const L of m.layers) {
    const meta = await sharp(L.source).metadata();
    const width = Math.round((meta.width as number) * (L.height / (meta.height as number)));
    let raw = new Uint8Array(await sharp(L.source).ensureAlpha().resize(width, L.height, { kernel: 'lanczos3' }).raw().toBuffer());
    if (L.bgKey) { const k = L.bgKey; const kr = parseInt(k.slice(1, 3), 16), kg = parseInt(k.slice(3, 5), 16), kb = parseInt(k.slice(5, 7), 16);
      for (let i = 0; i < raw.length; i += 4) if (Math.abs(raw[i]! - kr) <= 28 && Math.abs(raw[i + 1]! - kg) <= 28 && Math.abs(raw[i + 2]! - kb) <= 28) raw[i + 3] = 0; }
    raw = quantise(raw, palette);
    const out = `public/assets/backgrounds/${m.section}-${L.name}.png`;
    await sharp(Buffer.from(raw), { raw: { width, height: L.height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(out);
    if (L.loop) { const s = await seamScore(out); if (s > SEAM_MAX) throw new Error(`${out}: visible loop seam (${s.toFixed(1)} > ${SEAM_MAX}) — regenerate the source, do not patch`); }
    outs.push(out); console.log(`bg ${out} ${width}x${L.height}`);
  }
  return outs;
}
if (process.argv[1]?.endsWith('build-background.ts')) {
  const p = process.argv[2]; if (!p) { console.error('usage: build-background <manifest>'); process.exit(2); }
  buildBackground(JSON.parse(readFileSync(p, 'utf8')) as BgManifest).catch((e) => { console.error(e); process.exit(1); });
}
```

`tools/art/manifests/bg-s1.json`:
```json
{ "section": "s1", "palette": "assets/palette.json", "layers": [
  { "name": "sky", "source": "assets/sources/bg/s1-sky.png", "height": 224, "loop": true },
  { "name": "mid", "source": "assets/sources/bg/s1-mid.png", "height": 224, "loop": true, "bgKey": "#808080" },
  { "name": "ground", "source": "assets/sources/bg/s1-ground.png", "height": 112, "loop": true }
] }
```
Scripts: `"art:bg": "tsx tools/art/build-background.ts"`, `"art:seam": "tsx tools/art/seam-check.ts"`.

- [ ] **Step 3: Build everything against the frozen palette**

```bash
npx vitest run test/tools
npm run art:bg tools/art/manifests/bg-s1.json     # fails loudly on a seam → regenerate that layer (Task 4.1)
npm run art:atlas tools/art/manifests/hero.json   # hero re-quantised to palette.json (world slots only)
```
Open each output: no banding, no colour drift vs the source; ground strip tiles cleanly when placed side by side (`sharp` two-up: `node -e "…extend/composite…"` or view in an image editor).

- [ ] **Step 4: Commit**

```bash
git add tools/art/build-background.ts tools/art/seam-check.ts tools/art/manifests/bg-s1.json test/tools/seam-check.test.ts public/assets/backgrounds public/assets/atlases/hero.png public/assets/atlases/hero.json package.json
git commit -m "art: Foundry Gates layers quantised to the master palette with a loop-seam gate; hero re-quantised"
```

### Task 4.4: Parallax in-engine + HUD colours from the reserved slots

**Files:**
- Create: `src/adapters/phaser/views/Parallax.ts`
- Modify: `src/adapters/phaser/views/hud-colours.ts`, `src/adapters/phaser/scenes/BootScene.ts`, `src/adapters/phaser/scenes/GameScene.ts`, `tsconfig.json` (`resolveJsonModule: true`)

**Interfaces:**
- Produces: `Parallax(scene, section: string)` with `sync(cameraX)`; layer scroll ratios `PARALLAX_RATIOS = { sky: 0.15, mid: 0.5, ground: 1 }`; `HUD_COLOURS` derived from `assets/palette.json` reserved slots by index.

- [ ] **Step 1: Parallax view**

```ts
// src/adapters/phaser/views/Parallax.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
export const PARALLAX_RATIOS = { sky: 0.15, mid: 0.5, ground: 1 } as const;
export class Parallax {
  private layers: Array<{ ts: Phaser.GameObjects.TileSprite; ratio: number }> = [];
  constructor(scene: Phaser.Scene, section: string) {
    for (const name of ['sky', 'mid', 'ground'] as const) {
      const key = `${section}-${name}`;
      if (!scene.textures.exists(key)) continue;
      const h = scene.textures.get(key).getSourceImage().height;
      const ts = scene.add.tileSprite(0, BASE_H - h, BASE_W, h, key).setOrigin(0, 0).setDepth(-100 + this.layers.length);
      this.layers.push({ ts, ratio: PARALLAX_RATIOS[name] });
    }
  }
  sync(cameraX: number): void { for (const l of this.layers) l.ts.tilePositionX = Math.round(cameraX * l.ratio); }
}
```
`BootScene.MANIFEST` += `{ key: 's1-sky', type: 'image', url: '/assets/backgrounds/s1-sky.png' }` (and mid, ground). In `GameScene.create()` before views: `this.parallax = new Parallax(this, 's1');` and in `update()`: `this.parallax.sync(this.world.camera.x);`. Remove the band outline graphics from ticket 05 (keep it behind `import.meta.env.DEV && ?band` if still wanted).

- [ ] **Step 2: HUD colours from the palette**

```ts
// src/adapters/phaser/views/hud-colours.ts
import palette from '../../../../assets/palette.json';
const c = (i: number): number => parseInt((palette.colours[i] as string).slice(1), 16);
// Reserved slot indices are fixed by ticket 04 Task 4.2: ui-chrome 38–47, hud-state 48–55, score-pickup 56–59, reserve 60–63.
export const HUD_COLOURS = {
  plate: c(38), brass: c(45), text: c(47),
  healthGreen: c(48), healthAmber: c(50), healthRed: c(52),
  heatCyan: c(54), heatWhite: c(55), gold: c(56), danger: c(60),
} as const;
```

- [ ] **Step 3: ⛔ Browser check — owner signs off the look** — `npm run dev`: three layers scroll at different rates as the hero walks right; the ground strip loops with no seam; the re-quantised hero sits naturally on the palette; HUD reads instantly against the background. Screenshot to `docs/verification/04-palette-lock.png`; owner verdict in `docs/verification/04-palette-lock.md`.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/Parallax.ts src/adapters/phaser/views/hud-colours.ts src/adapters/phaser/scenes/BootScene.ts src/adapters/phaser/scenes/GameScene.ts tsconfig.json docs/verification/04-palette-lock.*
git commit -m "feat(adapter): Foundry Gates parallax and HUD colours from the reserved palette slots"
```

**Ticket 04 verification gate:** five acceptance boxes; `palette.json` test green; seam gate green; `LICENSES.md` rows for the three layers; owner sign-off recorded.

---

# Ticket 10 — Feral machine (neutral hazard) + arm-cannon drop

**Delivers:** a feral devil-machine bursts from a wall vent and pounces on the nearest body, hero or gang; both sides can kill it; it drops an arm-cannon pickup on death.

### Task 10.1: Side-agnostic targeting + weapon pickup entity

**Files:**
- Create: `src/core/ai/targeting.ts`, `test/core/ai/targeting.test.ts`
- Modify: `src/core/entities/items.ts`

**Interfaces:**
- Produces: `nearestBody(state, self: Entity, filter?: (e: Entity) => boolean): Entity | undefined` (Euclidean on x/y over live bodies, excluding `self` and other ferals; ties by lower id); `spawnWeaponPickup(state, kind: WeaponKind, x, y, heat): Entity` (kind `weaponPickup`, `weapon = { kind, heat }`).

- [ ] **Step 1: Write the failing test**

```ts
// test/core/ai/targeting.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, spawn } from '@core/sim/state';
import { spawnGang } from '@core/entities/gang';
import { nearestBody } from '@core/ai/targeting';

describe('nearestBody', () => {
  it('has no faction preference: picks whichever body is closer', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100; h.pos.y = 160;
    const g = spawnGang(w, 'brawler', 130, 160);
    const f = spawn(w, 'feral', 120, 160);
    expect(nearestBody(w, f)?.id).toBe(g.id);
    f.pos.x = 105;
    expect(nearestBody(w, f)?.id).toBe(h.id);
  });
  it('ignores dead bodies and other ferals', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100;
    const g = spawnGang(w, 'brawler', 121, 160); g.dead = true;
    const f2 = spawn(w, 'feral', 122, 160);
    const f = spawn(w, 'feral', 120, 160);
    expect(nearestBody(w, f)?.id).toBe(h.id);
    expect(f2.kind).toBe('feral');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/ai/targeting.ts
import type { Entity } from '../sim/entity';
import { isBody } from '../sim/entity';
import type { WorldState } from '../sim/state';

export function nearestBody(state: WorldState, self: Entity, filter: (e: Entity) => boolean = () => true): Entity | undefined {
  let best: Entity | undefined; let bestD = Infinity;
  for (const e of state.entities) {
    if (e.id === self.id || !isBody(e) || e.dead || e.state === 'dead' || !filter(e)) continue;
    if (e.kind === 'feral' && self.kind === 'feral') continue;   // a feral never targets another feral; gangs may
    const d = (e.pos.x - self.pos.x) ** 2 + (e.pos.y - self.pos.y) ** 2;
    if (d < bestD || (d === bestD && best && e.id < best.id)) { bestD = d; best = e; }
  }
  return best;
}
```
In `items.ts`:
```ts
export function spawnWeaponPickup(state: WorldState, kind: WeaponKind, x: number, y: number, heat: number): Entity {
  const p = spawn(state, 'weaponPickup', x, y);
  p.weapon = { kind, heat }; p.weaponKind = kind;
  return p;
}
```
(import `WeaponKind`.)

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/ai/targeting.ts src/core/entities/items.ts test/core/ai/targeting.test.ts
git commit -m "feat(core): side-agnostic nearest-body targeting and weapon pickup entities"
```

### Task 10.2: Feral FSM — emerge, stalk, telegraphed pounce, death drop

**Files:**
- Create: `src/core/entities/feral.ts`, `test/core/entities/feral.test.ts`
- Modify: `src/core/sim/tick.ts`, `src/core/entities/gang.ts`

**Interfaces:**
- Produces: `FERAL_DATA: ActorData & { reach: number; attackCooldown: number }`; `spawnFeral(state, x, y): Entity` (state `emerge`, invulnerable 20 frames, `weaponKind = 'cannon'` = "carries the drop"); `updateFeral`; feral states `emerge`, `idle`, `stalk`, `pounce`; `FERAL_EMERGE_FRAMES = 20`; gang self-defence: `nearestFeralThreat(state, e): Entity | undefined` (within 60 px x, 24 px y).

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/feral.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { spawnFeral, FERAL_DATA } from '@core/entities/feral';

const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let k = 0; k < n; k++) tick(w, EMPTY_INPUT); };

describe('feral machine', () => {
  it('emerges invulnerable, then stalks the nearest body and pounces with telegraph frames', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 60;
    const g = spawnGang(w, 'brawler', 330, 170); g.cooldown = 9999; g.state = 'idle';
    const f = spawnFeral(w, 300, 170);
    expect(f.invulnFrames).toBeGreaterThan(0);
    run(w, 25);
    expect(f.state).toBe('stalk'); expect(f.targetId).toBe(g.id);
    let telegraph = 0;
    for (let i = 0; i < 300; i++) { tick(w, EMPTY_INPUT); if (f.state === 'pounce' && f.stateFrame <= FERAL_DATA.moves.pounce!.startup) telegraph++; if (g.hp < g.maxHp) break; }
    expect(telegraph).toBe(FERAL_DATA.moves.pounce!.startup);
    expect(g.hp).toBeLessThan(g.maxHp);
  });
  it('damages the hero the same way and retargets when its target dies', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100;
    const g = spawnGang(w, 'brawler', 320, 170); g.cooldown = 9999; g.hp = 1;
    const f = spawnFeral(w, 300, 170);
    run(w, 25); expect(f.targetId).toBe(g.id);
    run(w, 400);
    expect(f.targetId).toBe(h.id);
    expect(h.hp).toBeLessThan(100);
  });
  it('gang attacks kill it and it drops exactly one arm-cannon', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 30;
    spawnGang(w, 'brawler', 300, 170); spawnGang(w, 'brawler', 340, 170);
    const f = spawnFeral(w, 320, 170); f.hp = 8;
    run(w, 900);
    expect(w.entities.includes(f)).toBe(false);
    expect(w.entities.filter((e) => e.kind === 'weaponPickup' && e.weapon?.kind === 'cannon')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement `feral.ts`**

```ts
// src/core/entities/feral.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { byId, emit, spawn } from '../sim/state';
import type { ActorData } from '../combat/frame-data';
import { registerActorData, moveTotal } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { nearestBody } from '../ai/targeting';
import { approach } from './gang';
import { spawnWeaponPickup } from './items';
import { WEAPON_HEAT } from '../weapons/heat';

export const FERAL_EMERGE_FRAMES = 20;
export const FERAL_DATA: ActorData & { reach: number; attackCooldown: number } = {
  walkSpeed: { x: 1.4, y: 1 }, hp: 40, hurtbox: { x: -20, y: 0, w: 40, h: 28 }, jumpVz: 0,
  reach: 44, attackCooldown: 50,
  moves: { pounce: { startup: 14, active: 10, recovery: 20, hitbox: { x: -6, y: 0, w: 40, h: 30 }, damage: 12, level: 'heavy', pushback: 4 } },
};
registerActorData('feral', FERAL_DATA);

export function spawnFeral(state: WorldState, x: number, y: number): Entity {
  const f = spawn(state, 'feral', x, y);
  f.hp = FERAL_DATA.hp; f.maxHp = FERAL_DATA.hp;
  f.weaponKind = 'cannon';                 // the drop it carries
  setState(f, 'emerge'); f.invulnFrames = FERAL_EMERGE_FRAMES;
  emit(state, { type: 'sfx', id: 'feral_emerge' });
  return f;
}

export function updateFeral(state: WorldState, e: Entity, _input: InputFrame): void {
  e.stateFrame++;
  const stunned = updateStunState(state, e);
  if (e.state === 'dead' && e.weaponKind) {          // drop exactly once
    spawnWeaponPickup(state, 'cannon', e.pos.x, e.pos.y, WEAPON_HEAT.cannon);
    e.weaponKind = null;
    emit(state, { type: 'sfx', id: 'weapon_drop' });
  }
  if (stunned) return;
  const current = byId(state, e.targetId);
  if (!current || current.dead || current.state === 'dead') e.targetId = nearestBody(state, e)?.id ?? null;
  const target = byId(state, e.targetId);
  const move = FERAL_DATA.moves[e.state];
  if (move) {
    if (e.stateFrame === move.startup + 1) { e.vel.x = 3 * e.facing; e.vel.z = 2; }   // leap on the first active frame
    if (e.stateFrame > move.startup + move.active) e.vel.x = 0;
    if (e.stateFrame >= moveTotal(move)) { setState(e, 'idle'); e.cooldown = FERAL_DATA.attackCooldown; }
    return;
  }
  switch (e.state) {
    case 'emerge':
      e.vel.x = 0; e.vel.y = 0;
      if (e.stateFrame >= FERAL_EMERGE_FRAMES) setState(e, 'idle');
      break;
    case 'idle':
      e.vel.x = 0; e.vel.y = 0;
      if (e.cooldown === 0 && target) setState(e, 'stalk');
      break;
    case 'stalk': {
      if (!target) { setState(e, 'idle'); break; }
      e.targetId = nearestBody(state, e)?.id ?? e.targetId;   // always the nearest body, no faction preference
      const t = byId(state, e.targetId) ?? target;
      if (approach(e, FERAL_DATA, t.pos.x, t.pos.y, FERAL_DATA.reach)) { setState(e, 'pounce'); e.vel.x = 0; e.vel.y = 0; }
      break;
    }
    default:
      setState(e, 'idle');
  }
}
```
Create `src/core/weapons/heat.ts` now with only the constant (ticket 11 adds the rest): `export const WEAPON_HEAT = { cannon: 6, blade: 8 } as const;`.
`tick.ts`: `feral: updateFeral`.

- [ ] **Step 4: Gang self-defence against ferals** — in `gang.ts` add:
```ts
export function nearestFeralThreat(state: WorldState, e: Entity): Entity | undefined {
  return nearestBody(state, e, (o) => o.kind === 'feral' && Math.abs(o.pos.x - e.pos.x) <= 60 && Math.abs(o.pos.y - e.pos.y) <= 24);
}
```
In `updateGang`, replace the target line with:
```ts
  const threat = nearestFeralThreat(state, e);
  const target = threat ?? byId(state, e.targetId) ?? heroOf(state);
  const mayAttack = e.attackTicket || threat !== undefined;
```
and use `mayAttack` where `e.attackTicket` gates `idle → approach` and `approach → ring`.

- [ ] **Step 5: Run tests + commit**

```bash
npm test
git add src/core/entities/feral.ts src/core/weapons/heat.ts src/core/entities/gang.ts src/core/ai/targeting.ts src/core/sim/tick.ts test/core/entities/feral.test.ts test/core/ai/targeting.test.ts
git commit -m "feat(core): neutral feral machine with telegraphed pounce, gang self-defence and cannon drop"
```

### Task 10.3: Adapter — vent burst placement + scene

**Files:**
- Modify: `src/adapters/phaser/views/anim-table.ts`, `src/adapters/phaser/scenes/GameScene.ts`

- [ ] **Step 1:** Add `feral` and `weaponPickup` entries to `ANIM_TABLE` mapping every feral state (`emerge`, `idle`, `stalk`, `pounce`, `hurt`, `knockdown`, `down`, `getup`, `dead`) to `{ atlas: 'feral', action: <same name or 'move' for stalk>, fps: 8, loop: state !== 'pounce' }` — the atlas does not exist until ticket 13, so boxes render; the table is complete now.
- [ ] **Step 2:** In `GameScene.create()` add a dev key `F` (DEV only) that calls `spawnFeral(this.world, this.world.camera.x + 360, 150)` — the "wall vent" is at the right screen edge until ticket 14 places real vents.
- [ ] **Step 3: Browser check** — `npm run dev`: press `F`; the green box flickers (emerging), then chases whichever box is nearest, crouches for 14 frames, leaps; gangs turn on it when it comes close; when it dies a cyan bar (the cannon pickup) drops.
- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/anim-table.ts src/adapters/phaser/scenes/GameScene.ts
git commit -m "feat(adapter): feral spawn hotkey and animation table entries"
```

**Ticket 10 verification gate:** five acceptance boxes; Vitest covers side-agnostic targeting, gang kill, single drop.

---

# Ticket 11 — Salvage weapons + weapon-heat HUD

**Delivers:** Attack over a dropped weapon picks it up; the arm-cannon fires six shots then breaks in sparks, the blade-limb swings eight times then breaks; knockdown drops the held weapon with its remaining heat; a bottom-left heat bar counts remaining uses and flashes on the last one.

### Task 11.1: Heat rules

**Files:**
- Modify: `src/core/weapons/heat.ts`
- Create: `test/core/weapons/heat.test.ts`

**Interfaces:**
- Produces: `WEAPON_HEAT = { cannon: 6, blade: 8 }`; `useWeapon(state, hero): 'used' | 'broke' | 'none'` — decrements heat; at 0 emits `weaponBreak` + `sfx weapon_break`, sets a 1-frame 1-px shake, and nulls `hero.weapon`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/weapons/heat.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { useWeapon, WEAPON_HEAT } from '@core/weapons/heat';

describe('weapon heat', () => {
  it('cannon breaks on exactly the 6th use, blade on the 8th', () => {
    for (const kind of ['cannon', 'blade'] as const) {
      const w = createWorld(1); const h = heroOf(w);
      h.weapon = { kind, heat: WEAPON_HEAT[kind] };
      const results: string[] = [];
      for (let i = 0; i < WEAPON_HEAT[kind] + 1; i++) results.push(useWeapon(w, h));
      expect(results.filter((r) => r === 'used')).toHaveLength(WEAPON_HEAT[kind] - 1);
      expect(results[WEAPON_HEAT[kind] - 1]).toBe('broke');
      expect(results[WEAPON_HEAT[kind]]).toBe('none');
      expect(h.weapon).toBeNull();
      expect(w.events.filter((e) => e.type === 'weaponBreak')).toHaveLength(1);
      expect(w.shake).toEqual({ frames: 1, px: 1 });
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/weapons/heat.ts
import type { Entity } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';

export const WEAPON_HEAT = { cannon: 6, blade: 8 } as const;

export function useWeapon(state: WorldState, hero: Entity): 'used' | 'broke' | 'none' {
  if (!hero.weapon) return 'none';
  hero.weapon.heat -= 1;
  if (hero.weapon.heat > 0) return 'used';
  emit(state, { type: 'weaponBreak', kind: hero.weapon.kind, x: hero.pos.x, y: hero.pos.y - 40 });
  emit(state, { type: 'sfx', id: 'weapon_break' });
  state.shake = { frames: 1, px: 1 };
  hero.weapon = null;
  return 'broke';
}
```

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/weapons/heat.ts test/core/weapons/heat.test.ts
git commit -m "feat(core): weapon heat counters that break the cannon at 6 and the blade at 8"
```

### Task 11.2: Pick-up, weaponAttack states, projectile, drop on knockdown

**Files:**
- Modify: `src/core/combat/frame-data.ts`, `src/core/entities/hero.ts`, `src/core/entities/items.ts`, `src/core/combat/resolve.ts`, `src/core/sim/tick.ts`
- Create: `test/core/entities/hero-weapons.test.ts`

**Interfaces:**
- Produces: `HERO_DATA.moves.bladeSwing`, `HERO_DATA.moves.cannonFire`; hero states `bladeSwing`, `cannonFire`; `spawnProjectile(state, kind: 'cannon' | 'glob', x, y, z, dir: Facing, ownerFaction): Entity` (state = kind, `vel.x = PROJECTILE_SPEED[kind] * dir`, lifetime 60); `PROJECTILE_MOVES: Record<'cannon' | 'glob', MoveData>`; `updateProjectile`; `attackMoveFor(att): MoveData | null` (thrown → `THROWN_MOVE`, projectile → `PROJECTILE_MOVES[state]`, else `activeMove`); knockdown drops the held weapon.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/hero-weapons.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { spawnWeaponPickup } from '@core/entities/items';
import { applyKnockdown } from '@core/combat/resolve';
import { WEAPON_HEAT } from '@core/weapons/heat';
import { HERO_DATA, moveTotal } from '@core/combat/frame-data';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };
const tap = (w: ReturnType<typeof createWorld>) => { tick(w, inp({ attack: true })); tick(w, EMPTY_INPUT); };

describe('salvage weapons', () => {
  it('Attack over a weapon picks it up instead of punching', () => {
    const w = createWorld(1); const h = heroOf(w);
    spawnWeaponPickup(w, 'cannon', h.pos.x + 4, h.pos.y, 6);
    tap(w);
    expect(h.weapon).toEqual({ kind: 'cannon', heat: 6 });
    expect(h.state).not.toBe('attack1');
    expect(w.entities.filter((e) => e.kind === 'weaponPickup')).toHaveLength(0);
  });
  it('cannon fires a projectile that hurts an enemy at range; 6 shots then it breaks', () => {
    const w = createWorld(1); const h = heroOf(w); h.weapon = { kind: 'cannon', heat: WEAPON_HEAT.cannon };
    const g = spawnGang(w, 'brawler', h.pos.x + 150, h.pos.y); g.cooldown = 9999; g.state = 'idle';
    tap(w); expect(h.state).toBe('cannonFire');
    run(w, 60);
    expect(g.hp).toBeLessThan(g.maxHp);
    for (let i = 0; i < 5; i++) { tap(w); run(w, moveTotal(HERO_DATA.moves.cannonFire!) + 1); }
    expect(h.weapon).toBeNull();
  });
  it('blade swings hit like a heavy melee move and break on the 8th swing', () => {
    const w = createWorld(1); const h = heroOf(w); h.weapon = { kind: 'blade', heat: WEAPON_HEAT.blade };
    for (let i = 0; i < 8; i++) { tap(w); expect(h.state).toBe('bladeSwing'); run(w, moveTotal(HERO_DATA.moves.bladeSwing!) + 1); }
    expect(h.weapon).toBeNull();
    expect(HERO_DATA.moves.bladeSwing!.level).toBe('heavy');
  });
  it('knockdown drops the held weapon as a pickup with its remaining heat', () => {
    const w = createWorld(1); const h = heroOf(w); h.weapon = { kind: 'blade', heat: 3 };
    applyKnockdown(w, h, 1);
    expect(h.weapon).toBeNull();
    const p = w.entities.find((e) => e.kind === 'weaponPickup');
    expect(p?.weapon).toEqual({ kind: 'blade', heat: 3 });
    run(w, 120, EMPTY_INPUT);
    tap(w);
    expect(h.weapon).toEqual({ kind: 'blade', heat: 3 });
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Frame data + projectiles**

`frame-data.ts` `HERO_DATA.moves` +=
```ts
    bladeSwing: { startup: 4, active: 4, recovery: 12, hitbox: { x: 8, y: 12, w: 46, h: 32 }, damage: 12, level: 'heavy', pushback: 4 },
    cannonFire: { startup: 4, active: 1, recovery: 16, hitbox: { x: 0, y: 0, w: 0, h: 0 }, damage: 0, level: 'light', pushback: 0 },
```
`items.ts` +=
```ts
export const PROJECTILE_SPEED = { cannon: 6, glob: 3 } as const;
export const PROJECTILE_LIFE = 60;
export const PROJECTILE_MOVES: Record<'cannon' | 'glob', MoveData> = {
  cannon: { startup: 0, active: 1, recovery: 0, hitbox: { x: -4, y: -4, w: 8, h: 8 }, damage: 14, level: 'heavy', pushback: 4 },
  glob:   { startup: 0, active: 1, recovery: 0, hitbox: { x: -6, y: -6, w: 12, h: 12 }, damage: 10, level: 'heavy', pushback: 3 },
};
export function spawnProjectile(state: WorldState, kind: 'cannon' | 'glob', x: number, y: number, z: number, dir: Facing, owner: Faction): Entity {
  const p = spawn(state, 'projectile', x, y);
  p.state = kind; p.pos.z = z; p.vel.x = PROJECTILE_SPEED[kind] * dir; p.facing = dir; p.ownerFaction = owner; p.removeIn = PROJECTILE_LIFE;
  return p;
}
export function updateProjectile(state: WorldState, p: Entity, _input: InputFrame): void {
  p.stateFrame++;
  if (p.state === 'glob') { if (p.pos.z > 0) { /* gravity handled by physics */ } else p.dead = true; }
  if (p.hitIds.length > 0) p.dead = true;   // one hit per projectile
  if (p.pos.x < state.camera.x - 16 || p.pos.x > state.camera.x + 400) p.dead = true;
}
```
(imports `MoveData`, `Facing`, `Faction`.) Physics: projectiles skip gravity unless `state === 'glob'` — in `physics.ts` change the gravity condition to `if ((e.pos.z > 0 || e.vel.z > 0) && !(e.kind === 'projectile' && e.state === 'cannon'))`. `tick.ts`: `projectile: updateProjectile`.

`resolve.ts`:
```ts
export function attackMoveFor(att: Entity): MoveData | null {
  if (att.state === 'thrown' && att.pos.z > 0) return THROWN_MOVE;
  if (att.kind === 'projectile') return PROJECTILE_MOVES[att.state as 'cannon' | 'glob'] ?? null;
  return activeMove(att);
}
```
Use it in `resolveHits` (`const move = attackMoveFor(att)`; `thrown` flag becomes `att.state === 'thrown'`). `canHit` already routes projectiles through `faction()` = `ownerFaction`. In `applyKnockdown` add at the top:
```ts
  if (vic.kind === 'hero' && vic.weapon) { spawnWeaponPickup(state, vic.weapon.kind, vic.pos.x, vic.pos.y, vic.weapon.heat); vic.weapon = null; emit(state, { type: 'sfx', id: 'weapon_drop' }); }
```

- [ ] **Step 4: Hero pick-up and weapon attacks**

In `hero.ts` `case 'idle': case 'walk':` replace the attack branch with:
```ts
      if (pressed(state, input, 'attack')) {
        const over = state.entities.find((p) => p.kind === 'weaponPickup' && Math.abs(p.pos.x - hero.pos.x) <= PICKUP_RADIUS.x && Math.abs(p.pos.y - hero.pos.y) <= PICKUP_RADIUS.y);
        if (over && over.weapon && !hero.weapon) {
          hero.weapon = { ...over.weapon }; over.dead = true;
          emit(state, { type: 'pickup', kind: over.weapon.kind, x: over.pos.x, y: over.pos.y }); emit(state, { type: 'sfx', id: 'weapon_pickup' });
          break;
        }
        setState(hero, hero.weapon ? (hero.weapon.kind === 'blade' ? 'bladeSwing' : 'cannonFire') : 'attack1');
        hero.chainQueued = false; hero.vel.x = 0; hero.vel.y = 0;
        break;
      }
```
In the generic `if (move)` block, before the chain/end logic:
```ts
    if ((hero.state === 'cannonFire' || hero.state === 'bladeSwing') && hero.stateFrame === move.startup + 1) {
      if (hero.state === 'cannonFire') { spawnProjectile(state, 'cannon', hero.pos.x + hero.facing * 16, hero.pos.y, 28, hero.facing, 'hero'); emit(state, { type: 'sfx', id: 'cannon' }); }
      hero.weaponUsePending = true;
    }
    if (hero.stateFrame >= moveTotal(move)) {
      if (hero.weaponUsePending) { hero.weaponUsePending = false; useWeapon(state, hero); }
      const next = hero.chainQueued ? nextChain('hero', hero.state) : null;
      hero.chainQueued = false;
      setState(hero, next ?? 'idle');
    }
```
(`weaponUsePending` is already an `Entity` field, default `false`.) Weapon moves are not chainable (`nextChain` finds nothing for them).

- [ ] **Step 5: Run tests + commit**

```bash
npm test
git add src/core/combat/frame-data.ts src/core/entities/hero.ts src/core/entities/items.ts src/core/combat/resolve.ts src/core/sim/physics.ts src/core/sim/entity.ts src/core/sim/tick.ts test/core/entities/hero-weapons.test.ts
git commit -m "feat(core): weapon pick-up, cannon projectiles, blade swings and drop-on-knockdown"
```

### Task 11.3: Heat bar + sparks in the adapter

**Files:**
- Create: `src/adapters/phaser/views/Sparks.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`, `src/adapters/phaser/views/anim-table.ts`

- [ ] **Step 1: Sparks (frame-stepped, 6 gold pixels)**

```ts
// src/adapters/phaser/views/Sparks.ts
import type Phaser from 'phaser';
import { HUD_COLOURS } from './hud-colours';
const LIFE = 18;
export class Sparks {
  private parts: Array<{ r: Phaser.GameObjects.Rectangle; vx: number; vy: number; age: number; wx: number; wy: number }> = [];
  constructor(private scene: Phaser.Scene) {}
  burst(wx: number, wy: number): void {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.parts.push({ r: this.scene.add.rectangle(0, 0, 2, 2, HUD_COLOURS.gold).setDepth(1600), vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 1.5, age: 0, wx, wy });
    }
  }
  step(n: number, cameraX: number): void {
    for (const p of this.parts) for (let i = 0; i < n; i++) { p.age++; p.wx += p.vx; p.vy += 0.15; p.wy += p.vy; }
    for (const p of this.parts) p.r.setPosition(Math.round(p.wx - cameraX), Math.round(p.wy));
    this.parts = this.parts.filter((p) => { if (p.age >= LIFE) { p.r.destroy(); return false; } return true; });
  }
}
```

- [ ] **Step 2: Wire** — in `GameScene`: `sparks` field; event loop: `else if (ev.type === 'weaponBreak') this.sparks.burst(ev.x, ev.y);`; `this.sparks.step(steps, this.world.camera.x)`; HUD model `weapon: hero.weapon ? { kind: hero.weapon.kind, heat: hero.weapon.heat, max: WEAPON_HEAT[hero.weapon.kind] } : null`. `anim-table.ts` hero: `bladeSwing`/`cannonFire` → `action: 'attack'` (ticket 12 swaps to `weapon-swing` / `cannon-fire`); `projectile` kind: no atlas (box).

- [ ] **Step 3: Browser check** — `npm run dev`: `F` → kill the feral → stand over the cyan bar and press J: the bottom-left heat bar appears with 6 cyan→white segments; each J fires a fast orange square that knocks a box back; the last segment is outlined red; on the 6th shot the bar vanishes, gold sparks burst, and a 1-px jolt hits the screen. Get knocked down while holding a weapon: the bar drops as a pickup and comes back with the same count when re-picked.

- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/Sparks.ts src/adapters/phaser/scenes/GameScene.ts src/adapters/phaser/views/anim-table.ts
git commit -m "feat(adapter): weapon-heat bar with final-use flash and break sparks"
```

**Ticket 11 verification gate:** five acceptance boxes; Vitest proves breaks at exactly 6/8 and heat preserved through drop.

---

# Ticket 12 — Hero sprites wired to the full FSM

**Delivers:** every hero action from tickets 05, 07 and 11 plays on generated frames quantised to the master palette; feet never slide between states; hitboxes re-checked against real frames. ⛔ **Human gates: credits (13 AutoSprite runs); owner play-tests the hero in motion.**

### Task 12.1: ⛔ AutoSprite sheets for the remaining hero actions

**Files:**
- Create: `assets/sources/hero/{idle,jump,combo2,combo3,grab,throw,hurt,knockdown,getup,jump-attack,weapon-swing,cannon-fire,special}.png` + `.prompt.txt` each
- Modify: `assets/LICENSES.md`

- [ ] **Step 1: Budget check** — read the ledger; 13 runs × the measured cost must fit under the ceiling with the gang/feral/boss runs still to come (18 + 5 + 6 per `Solution-PRD.md` §6). If not, stop and surface the shortfall to the owner.

- [ ] **Step 2: Run each action** (reference = the M0 hero reference media id; `frame_size: 256`; `is_humanoid: true`; flat `#808080` background; "feet on the same floor line as the walk cycle" in every prompt):

| action | preset | frame_count | prompt core |
|---|---|---|---|
| idle | idle | 4 | subtle breathing stance, hammer resting on shoulder |
| jump | jump | 4 | crouch, rise, apex, fall |
| combo2 | custom | 4 | second hit of a three-hit chain: rising hammer-butt strike |
| combo3 | custom | 5 | finishing overhead slam that launches the target |
| grab | custom | 2 | holding an enemy by the collar in front |
| throw | custom | 4 | hip-throw forward |
| hurt | custom | 2 | flinch back from a body hit |
| knockdown | custom | 3 | launched backward, airborne, landing on back |
| getup | custom | 4 | rolling up from the floor to standing |
| jump-attack | custom | 3 | mid-air downward hammer swing |
| weapon-swing | custom | 4 | wide horizontal swing with a jagged blade-limb |
| cannon-fire | custom | 3 | bracing and firing an arm-cannon from the hip, recoil |
| special | custom | 6 | spinning full-circle hammer sweep with a burst of sparks |

`jobs_wait`, download each sheet, save the prompt, add a `LICENSES.md` row + ledger row per run. Reject any run whose provider resolves to Kling; regenerate a sheet at most twice if limbs detach or the floor line drifts.

- [ ] **Step 3: Commit**

```bash
git add assets/sources/hero assets/LICENSES.md
git commit -m "art: AutoSprite sheets for the full hero move-set"
```

### Task 12.2: Rebuild the hero atlas with all actions; anim table on real actions

**Files:**
- Modify: `tools/art/manifests/hero.json`, `public/assets/atlases/hero.{png,json}`, `src/adapters/phaser/views/anim-table.ts`

- [ ] **Step 1: Manifest** — add every action with its frame count (and `cols` per the measured layout), `scaleFrom: "walk"` unchanged so the hero stays 64 px. Run `npm run art:atlas tools/art/manifests/hero.json`. Open the atlas: every frame's feet on the bottom edge (the union-crop guarantees it); if a jump frame's apex made the union tall enough to shrink the standing frames, that is expected — the *scale* comes from `walk`, only the frame cell grows.

- [ ] **Step 2: Anim table** — replace the hero block:
```ts
  hero: {
    idle: { atlas: 'hero', action: 'idle', fps: 6, loop: true },
    walk: { atlas: 'hero', action: 'walk', fps: 10, loop: true },
    jump: { atlas: 'hero', action: 'jump', fps: 0, loop: false },       // spread over the airtime by stateFrame (see frameIndexFor totalFrames)
    attack1: { atlas: 'hero', action: 'attack', fps: 0, loop: false },
    attack2: { atlas: 'hero', action: 'combo2', fps: 0, loop: false },
    attack3: { atlas: 'hero', action: 'combo3', fps: 0, loop: false },
    jumpAttack: { atlas: 'hero', action: 'jump-attack', fps: 0, loop: false },
    grab: { atlas: 'hero', action: 'grab', fps: 4, loop: true },
    throw: { atlas: 'hero', action: 'throw', fps: 0, loop: false },
    special: { atlas: 'hero', action: 'special', fps: 0, loop: false },
    bladeSwing: { atlas: 'hero', action: 'weapon-swing', fps: 0, loop: false },
    cannonFire: { atlas: 'hero', action: 'cannon-fire', fps: 0, loop: false },
    hurt: { atlas: 'hero', action: 'hurt', fps: 12, loop: false },
    knockdown: { atlas: 'hero', action: 'knockdown', fps: 12, loop: false },
    down: { atlas: 'hero', action: 'knockdown', fps: 0, loop: true, hold: 2 },
    getup: { atlas: 'hero', action: 'getup', fps: 0, loop: false },
    dead: { atlas: 'hero', action: 'knockdown', fps: 0, loop: true, hold: 2 },
  },
```
Extend `AnimSpec` with `hold?: number` (a fixed frame index for looping specs with `fps: 0`) and make `frameIndexFor` honour it: `if (spec.loop && spec.fps === 0) return Math.min(frameCount - 1, spec.hold ?? 0);`. For `jump`/`getup`/`hurt`/`knockdown` (non-move states) `EntityViews.place` passes `totalFrames` = `HIT_FEEL.getupFrames` for `getup`, `HIT_FEEL.hitstun.light` for `hurt`, `36` for `jump` (airtime), else `undefined` — add a small `STATE_LENGTHS: Record<string, number>` in `anim-table.ts` for that.

- [ ] **Step 3: Commit**

```bash
npm run check
git add tools/art/manifests/hero.json public/assets/atlases/hero.png public/assets/atlases/hero.json src/adapters/phaser/views/anim-table.ts
git commit -m "art: full hero atlas wired to every FSM state"
```

### Task 12.3: Hitbox re-check against real frames + ⛔ owner play-test

**Files:**
- Modify: `src/core/combat/frame-data.ts` (rect values only)
- Create: `docs/verification/12-hero-hitboxes.md` (+ screenshots)

- [ ] **Step 1:** `npm run dev`, press `H`. For attack1/2/3, jumpAttack, bladeSwing, special, throw: screenshot the active frames (`H` shows red rects). Adjust `hitbox` rects so each covers the visible weapon arc and nothing more; adjust `hurtbox` to the body. Keep `attack*.hitbox.x + w ≥ 34` (the combo test spawns the target at +24) or update the spacing in `test/core/entities/hero-combo.test.ts` in the same commit with a note.
- [ ] **Step 2:** `npm test` — all green.
- [ ] **Step 3:** ⛔ Owner plays 3 minutes: walk, combo, jump attack, grab/throw, special, cannon, blade, get knocked down. Verdict + screenshots in `docs/verification/12-hero-hitboxes.md`.
- [ ] **Step 4: Commit**

```bash
git add src/core/combat/frame-data.ts docs/verification/12-hero-hitboxes.md docs/verification/*.png
git commit -m "art: hero hitboxes fitted to the generated frames; owner sign-off recorded"
```

**Ticket 12 verification gate:** five acceptance boxes; `LICENSES.md` has a row per sheet; owner sign-off recorded.

---

# Ticket 13 — Gang + feral sprites wired

**Delivers:** three gang types and the feral on real frames; gang variants by palette swap (no extra generations); feral on a non-humanoid sheet. ⛔ **Human gate: credits (4 references + ~24 AutoSprite runs).**

### Task 13.1: ⛔ References with the hero as style anchor

**Files:**
- Create: `assets/sources/{brawler,knife,heavy,feral}/reference.png` + `reference.prompt.txt`, `docs/art/candidates/*`
- Modify: `assets/LICENSES.md`

- [ ] **Step 1:** Prompts from the `Design.md` §3.6 template with `image_references` = hero reference. Silhouette rules from §3.5: brawler *bulky, bare-knuckle, patched coveralls*; knife *lean, one raised-knife read from any frame*; heavy *widest silhouette, visible wind-up tell*; feral appends the non-humanoid clause verbatim (`non-humanoid, four-legged/insectoid scrap-metal chassis, visible molten seams, no face, mechanical silhouette distinct from all humanoid characters`). 2 candidates each.
- [ ] **Step 2:** ⛔ Owner picks; the three gang silhouettes must be tellable apart at 64 px — check by downscaling the candidates with `sharp` to 64 px tall and viewing side by side (`docs/art/candidates/gang-silhouettes-64px.png`).
- [ ] **Step 3:** `LICENSES.md` rows + ledger; commit `art: gang and feral references`.

### Task 13.2: ⛔ AutoSprite sheets

- [ ] **Step 1:** Per gang type: `idle` 4, `walk` 6, `attack` 4 (brawler punch / knife stab / heavy slam), `hurt` 2, `knockdown` 3, `getup` 4; heavy adds `windup` 3 (custom: "raising both arms for a slow overhead slam, telegraphing"). Feral (`is_humanoid: false`): `idle` 4, `move` 6, `pounce` 5 (crouch telegraph → leap), `hurt` 2, `death` 4 (collapse into scrap). Save under `assets/sources/<kind>/<action>.png` + prompts; rows + ledger. Reject Kling.
- [ ] **Step 2:** Commit `art: gang and feral AutoSprite sheets`.

### Task 13.3: Atlases, palette-swap variants, anim table, hitboxes

**Files:**
- Create: `tools/art/manifests/{brawler,knife,heavy,feral}.json`, `public/assets/atlases/{brawler,knife,heavy,feral}*.{png,json}`
- Modify: `tools/art/build-atlas.ts` (swaps), `src/adapters/phaser/views/anim-table.ts`, `src/adapters/phaser/scenes/BootScene.ts`, `src/core/entities/gang.ts` / `feral.ts` (rect values), `test/tools/build-atlas.test.ts`

**Interfaces:**
- Produces: `AtlasManifest.swaps?: Record<string, Record<string, string>>` — variant name → `{ '#fromHex': '#toHex' }` applied after quantisation (both hexes must be palette colours); each variant writes `<name>-<variant>.png/json` with identical frame names. `variantAtlasKey('brawler', 1)` = `'brawler-v1'` (ticket 08 hook).

- [ ] **Step 1: Failing test addition** — in `test/tools/build-atlas.test.ts` add a case: manifest with `swaps: { v1: { '#ff0000': '#00ff00' } }` → `dummy-v1.png` exists, its JSON has the same frame keys as `dummy.json`, and it contains no `255,0,0` pixels but does contain `0,255,0`.
- [ ] **Step 2: Implement** in `buildAtlas` after writing the base atlas:
```ts
  for (const [variant, map] of Object.entries(m.swaps ?? {})) {
    const from = Object.keys(map).map(unhex), to = Object.values(map).map(unhex);
    const swapped = cells.map((c) => { const o = Buffer.from(c); for (let i = 0; i < o.length; i += 4) { if (o[i + 3] === 0) continue; const k = from.findIndex((f) => f[0] === o[i] && f[1] === o[i + 1] && f[2] === o[i + 2]); if (k >= 0) { o[i] = to[k]![0]; o[i + 1] = to[k]![1]; o[i + 2] = to[k]![2]; } } return o; });
    const vpng = join(m.outDir, `${m.name}-${variant}.png`), vjson = join(m.outDir, `${m.name}-${variant}.json`);
    await sharp({ create: { width: atlasW, height: frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite(swapped.map((c, i) => ({ input: c, raw: { width: frameW, height: frameH, channels: 4 }, left: i * frameW, top: 0 }))).png().toFile(vpng);
    writeFileSync(vjson, JSON.stringify({ frames, meta: { app: 'slag-city build-atlas', image: basename(vpng), size: { w: atlasW, h: frameH }, scale: '1', slagcity: { origin: [0.5, 1], scale, frameW, frameH } } }, null, 1));
  }
```
(import `unhex`.) Manifests: gang types `targetHeight` 64 (heavy 68), `scaleFrom: "walk"`, `worldOnly: true`; brawler/knife/heavy each with `swaps: { v1: {...}, v2: {...} }` mapping two coverall/skin colours to other palette colours of the same group (pick after looking at the quantised base atlas; record the choice in the manifest). Feral: `targetHeight` 40, `scaleFrom: "idle"`.
- [ ] **Step 3: Build** — run `art:atlas` for the four manifests; register base + variant atlases in `BootScene.MANIFEST`.
- [ ] **Step 4: Anim table** — gangs: `idle/ring → idle`, `approach → walk`, `punch|stab|slam → attack` (heavy: `slam` startup frames → `windup` when `stateFrame ≤ startup`: add an optional `startupAction` to `AnimSpec` and honour it in `EntityViews.place`), `hurt`, `knockdown`, `down/dead → knockdown hold 2`, `getup`, `grabbed → hurt hold 0`, `thrown → knockdown hold 1`. Feral: `emerge → idle`, `idle`, `stalk → move`, `pounce`, `hurt`, `knockdown/down → hurt hold 1`, `dead → death`.
- [ ] **Step 5: Hitboxes** — with `H`, fit `GANG_DATA.*.hurtbox`, move hitboxes and `FERAL_DATA` rects; `npm test` green (ticket 08/10 tests use relative spacing; adjust spacing constants in the same commit if a rect shrinks past them).
- [ ] **Step 6: Browser check** — five-enemy fight + `F` feral on real frames; variants visibly differ; the heavy's wind-up reads as "don't interrupt"; the feral reads as non-human.
- [ ] **Step 7: Commit**

```bash
npm run check
git add tools/art public/assets/atlases src/adapters/phaser/views/anim-table.ts src/adapters/phaser/views/EntityView.ts src/adapters/phaser/scenes/BootScene.ts src/core/entities/gang.ts src/core/entities/feral.ts test/tools/build-atlas.test.ts assets/LICENSES.md
git commit -m "art: gang and feral atlases with palette-swap variants wired to the FSMs"
```

**Ticket 13 verification gate:** five acceptance boxes; variant atlases built from the base sheets only (no extra generations in the ledger).

---

# Ticket 21 — Marquee / logo + bezel art + 1200×630 OG image

**Delivers:** real marquee logo and side-art bezel in the cabinet; the same marquee art exported as the OG image. ⛔ **Human gates: final title chosen + trademark lookup done; credits.**

### Task 21.1: ⛔ Final title + trademark lookup

**Files:**
- Create: `docs/legal/title-check.md`

- [ ] **Step 1:** Owner picks from the CLEAR list (`Discovery-PRD.md` §9): SLAG CITY, IRON EXORCIST, MOLTEN SAINTS, INFERNAL WORKS, FURNACE OF THE DAMNED.
- [ ] **Step 2:** Search USPTO (tmsearch.uspto.gov) and EUIPO eSearch for the exact phrase and close variants in Classes 9 and 41; record query strings, dates, and hits (live/dead, class, owner) in `docs/legal/title-check.md`. A live mark in class 9/41 for games = pick another name.
- [ ] **Step 3:** Update `index.html <title>`, `package.json name` if changed, `ENEMY_NAMES` untouched. Commit `chore: lock the final title after trademark lookup`. Folder rename is a separate user decision (`HANDOFF.md`).

### Task 21.2: ⛔ Logo, bezel panels, small logo

**Files:**
- Create: `assets/sources/ui/logo.png`, `assets/sources/ui/logo.svg`, `assets/sources/ui/bezel-left.png`, `assets/sources/ui/bezel-right.png`, `public/assets/ui/marquee.png` (768×160), `public/assets/ui/marquee-small.png` (160×48, replaces the placeholder), `public/assets/ui/bezel-left.png`, `public/assets/ui/bezel-right.png` (each 96×672), prompts, `LICENSES.md` rows

- [ ] **Step 1: Logo** — `generate_image` (Nano Banana Pro): `"<TITLE>" arcade marquee logo, 1993 cabinet marquee lettering, heavy blocky chrome-and-brass letters with molten-orange glow bleeding from the seams, occult-industrial ornament (rivets, chains, a small forge sigil), flat near-black background, centered, no other text, no real-world brand`. 2 candidates; ⛔ owner picks.
- [ ] **Step 2: Vector clean-up** — `mcp__recraft__vectorize_image` on the chosen PNG → `logo.svg`; rasterise with `sharp` to 768×160 (`marquee.png`, letterbox on `#0c0a0e`) and 160×48 (`marquee-small.png`). Recraft's licence recorded in `LICENSES.md`.
- [ ] **Step 3: Bezel panels** — two generations (or one mirrored): `arcade cabinet side art panel, vertical, occult-industrial motif: riveted steel, hanging chains, furnace glow bleeding from the inner edge, brass trim, no text, no characters`. Downscale to 96×672, quantise to the world palette (`art:bg`-style one-off with `sharp` + `quantise`), save.
- [ ] **Step 4: Shell wiring** — `cabinet.ts`: marquee `img.src = '/assets/ui/marquee.png'`; add `#bezel-left`/`#bezel-right` absolutely positioned panels (`background: url(/assets/ui/bezel-left.png) center / cover`) at `BEZEL_PAD` width each side — widen `BEZEL_PAD` to 96 only when `viewportWidth ≥ 384*k + 2*96`, else keep 24 (recompute in `chromeHeight`'s sibling `chromeWidth()` and pass `viewportW − chromeWidth()` to `computeIntegerScale`). The gate card's `<img>` already points at `marquee-small.png`.
- [ ] **Step 5: Commit** `art: marquee logo, side-art bezel and small logo wired into the cabinet`.

### Task 21.3: OG image

**Files:**
- Create: `tools/art/make-og.ts`, `public/og.png` (1200×630)
- Modify: `index.html` (tags land in ticket 24; the image is produced here)

- [ ] **Step 1: Tool**
```ts
// tools/art/make-og.ts — npx tsx tools/art/make-og.ts
import sharp from 'sharp';
async function main(): Promise<void> {
  const bg = await sharp('assets/sources/bg/s1-sky.png').resize(1200, 630, { fit: 'cover', position: 'left' }).modulate({ brightness: 0.85 }).toBuffer();
  const logo = await sharp('assets/sources/ui/logo.svg').resize({ width: 640 }).toBuffer();
  await sharp(bg).composite([{ input: logo, left: 64, top: Math.round((630 - (await sharp(logo).metadata()).height!) / 2) }]).png().toFile('public/og.png');
  console.log('wrote public/og.png 1200x630');
}
main().catch((e) => { console.error(e); process.exit(1); });
```
Flat PNG, no scanlines (Design §3.8). Check at thumbnail size (`sharp public/og.png -> 300×158`) that the title is legible.
- [ ] **Step 2: Commit** `art: 1200x630 OG image from the marquee logo over the Foundry Gates sky`.

**Ticket 21 verification gate:** four acceptance boxes; `docs/legal/title-check.md` present; no third-party IP in any prompt (grep prompts for brand names).

---

# Ticket 14 — Stage 1 layout: three sections, scroll-locks, spawn tables, hazards, camera

**Delivers:** the full Foundry District walk — Foundry Gates → Conveyor Floor (belts, molten channel, chain hoists) → Furnace Hall (telegraphed ladle pours, catwalks) → the boss door — with scroll-locked fights from data tables; a competent run takes 6–8 minutes. Backgrounds beyond section 1 are flat placeholders until ticket 17.

### Task 14.1: Stage data + spawn-table test against Solution-PRD §4

**Files:**
- Create: `src/core/stage/stage1.ts`, `test/core/stage/stage1-data.test.ts`

**Interfaces:**
- Produces:
```ts
export interface SpawnEntry { kind: 'brawler' | 'knife' | 'heavy' | 'feral' | 'crate'; x: number; y: number; delay: number; variant?: number; contents?: PickupKind; vent?: boolean }
export interface ScrollLock { camX: number; entries: SpawnEntry[] }
export type Hazard =
  | { type: 'belt'; x1: number; x2: number; y1: number; y2: number; push: number }
  | { type: 'channel'; x1: number; x2: number; y1: number; y2: number }
  | { type: 'ladle'; x: number; w: number; period: number; tellFrames: number; damageFrames: number };
export interface Section { name: string; bg: 's1' | 's2' | 's3'; startX: number; hazards: Hazard[] }
export interface StageData { width: number; sections: Section[]; locks: ScrollLock[]; bossDoorX: number }
export const STAGE1: StageData;
export function sectionIndexAt(stage: StageData, x: number): number;
```

- [ ] **Step 1: Write the failing test (the PRD table, as assertions)**

```ts
// test/core/stage/stage1-data.test.ts
import { describe, it, expect } from 'vitest';
import { STAGE1, sectionIndexAt } from '@core/stage/stage1';

const kinds = (i: number) => STAGE1.locks[i]!.entries.filter((e) => e.kind !== 'crate').map((e) => e.kind).sort();
const sectionOf = (lock: { camX: number }) => sectionIndexAt(STAGE1, lock.camX + 192);

describe('stage 1 data (Solution-PRD §4)', () => {
  it('has three sections then the boss door, in order', () => {
    expect(STAGE1.sections.map((s) => s.name)).toEqual(['Foundry Gates', 'Conveyor Floor', 'Furnace Hall']);
    expect(STAGE1.locks.every((l, i, a) => i === 0 || l.camX > a[i - 1]!.camX)).toBe(true);
    expect(STAGE1.bossDoorX).toBeGreaterThan(STAGE1.locks[STAGE1.locks.length - 1]!.camX + 384);
    expect(STAGE1.bossDoorX).toBeLessThanOrEqual(STAGE1.width - 384);
  });
  it('section 1: two fights — 2 brawlers, then 3 brawlers + 1 knife; a health crate', () => {
    const s1 = STAGE1.locks.filter((l) => sectionOf(l) === 0);
    expect(s1).toHaveLength(2);
    expect(kinds(STAGE1.locks.indexOf(s1[0]!))).toEqual(['brawler', 'brawler']);
    expect(kinds(STAGE1.locks.indexOf(s1[1]!))).toEqual(['brawler', 'brawler', 'brawler', 'knife']);
    expect(s1.flatMap((l) => l.entries).some((e) => e.kind === 'crate' && e.contents === 'lunchpail')).toBe(true);
  });
  it('section 2: three fights, adds the heavy, first feral from a wall vent; belts and a molten channel', () => {
    const s2 = STAGE1.locks.filter((l) => sectionOf(l) === 1);
    expect(s2).toHaveLength(3);
    expect(s2.flatMap((l) => l.entries).some((e) => e.kind === 'heavy')).toBe(true);
    const ferals = s2.flatMap((l) => l.entries).filter((e) => e.kind === 'feral');
    expect(ferals).toHaveLength(1); expect(ferals[0]!.vent).toBe(true);
    const hz = STAGE1.sections[1]!.hazards.map((h) => h.type);
    expect(hz).toContain('belt'); expect(hz).toContain('channel');
  });
  it('section 3: mixed gangs, two ferals at once, final gauntlet; ladle pours', () => {
    const s3 = STAGE1.locks.filter((l) => sectionOf(l) === 2);
    expect(s3.length).toBeGreaterThanOrEqual(2);
    expect(s3.some((l) => l.entries.filter((e) => e.kind === 'feral').length === 2)).toBe(true);
    const last = s3[s3.length - 1]!;
    expect(last.entries.filter((e) => e.kind !== 'crate').length).toBeGreaterThanOrEqual(6);
    expect(STAGE1.sections[2]!.hazards.some((h) => h.type === 'ladle')).toBe(true);
  });
  it('no feral appears before section 2', () => {
    expect(STAGE1.locks.filter((l) => sectionOf(l) === 0).flatMap((l) => l.entries).some((e) => e.kind === 'feral')).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement** (positions are world x; `y` in the walkable band; `delay` in frames after the lock engages)

```ts
// src/core/stage/stage1.ts
import type { PickupKind } from '../sim/entity';

export interface SpawnEntry { kind: 'brawler' | 'knife' | 'heavy' | 'feral' | 'crate'; x: number; y: number; delay: number; variant?: number; contents?: PickupKind; vent?: boolean }
export interface ScrollLock { camX: number; entries: SpawnEntry[] }
export type Hazard =
  | { type: 'belt'; x1: number; x2: number; y1: number; y2: number; push: number }
  | { type: 'channel'; x1: number; x2: number; y1: number; y2: number }
  | { type: 'ladle'; x: number; w: number; period: number; tellFrames: number; damageFrames: number };
export interface Section { name: string; bg: 's1' | 's2' | 's3'; startX: number; hazards: Hazard[] }
export interface StageData { width: number; sections: Section[]; locks: ScrollLock[]; bossDoorX: number }

const R = (camX: number, off: number): number => camX + off;   // spawn just outside the right edge (off ≥ 400) or left (off < 0)

export const STAGE1: StageData = {
  width: 4400,
  sections: [
    { name: 'Foundry Gates', bg: 's1', startX: 0, hazards: [] },
    { name: 'Conveyor Floor', bg: 's2', startX: 1400, hazards: [
      { type: 'belt', x1: 1500, x2: 1900, y1: 128, y2: 160, push: 0.6 },
      { type: 'belt', x1: 2100, x2: 2500, y1: 176, y2: 208, push: -0.6 },
      { type: 'channel', x1: 1950, x2: 2050, y1: 184, y2: 208 },
    ] },
    { name: 'Furnace Hall', bg: 's3', startX: 2800, hazards: [
      { type: 'ladle', x: 3000, w: 72, period: 240, tellFrames: 60, damageFrames: 30 },
      { type: 'ladle', x: 3450, w: 72, period: 300, tellFrames: 60, damageFrames: 30 },
    ] },
  ],
  locks: [
    // § Foundry Gates — teaches combo, jump, grab→throw; health crate
    { camX: 320,  entries: [ { kind: 'brawler', x: R(320, 420), y: 160, delay: 0 }, { kind: 'brawler', x: R(320, 460), y: 190, delay: 40 },
                             { kind: 'crate', x: 560, y: 200, delay: 0, contents: 'lunchpail' } ] },
    { camX: 900,  entries: [ { kind: 'brawler', x: R(900, 420), y: 150, delay: 0, variant: 1 }, { kind: 'brawler', x: R(900, -40), y: 190, delay: 30 },
                             { kind: 'knife', x: R(900, 440), y: 175, delay: 60 }, { kind: 'brawler', x: R(900, 480), y: 200, delay: 240, variant: 2 } ] },
    // § Conveyor Floor — hazards, neutral hazard, salvage
    { camX: 1520, entries: [ { kind: 'brawler', x: R(1520, 420), y: 170, delay: 0 }, { kind: 'brawler', x: R(1520, -40), y: 190, delay: 20, variant: 1 },
                             { kind: 'heavy', x: R(1520, 460), y: 180, delay: 90 } ] },
    { camX: 2000, entries: [ { kind: 'knife', x: R(2000, 420), y: 150, delay: 0 }, { kind: 'knife', x: R(2000, -40), y: 200, delay: 40, variant: 1 },
                             { kind: 'brawler', x: R(2000, 440), y: 185, delay: 80 },
                             { kind: 'feral', x: 2340, y: 140, delay: 150, vent: true },
                             { kind: 'crate', x: 2260, y: 205, delay: 0, contents: 'gear' } ] },
    { camX: 2450, entries: [ { kind: 'heavy', x: R(2450, 420), y: 175, delay: 0, variant: 1 }, { kind: 'knife', x: R(2450, -40), y: 150, delay: 30 },
                             { kind: 'brawler', x: R(2450, 440), y: 200, delay: 60 }, { kind: 'brawler', x: R(2450, 480), y: 160, delay: 200, variant: 2 } ] },
    // § Furnace Hall — everything at once, final gauntlet
    { camX: 3050, entries: [ { kind: 'brawler', x: R(3050, 420), y: 165, delay: 0 }, { kind: 'knife', x: R(3050, -40), y: 195, delay: 20 },
                             { kind: 'feral', x: 3400, y: 135, delay: 60, vent: true }, { kind: 'feral', x: 2760, y: 205, delay: 60, vent: true },
                             { kind: 'crate', x: 3300, y: 205, delay: 0, contents: 'lunchpail' } ] },
    { camX: 3550, entries: [ { kind: 'heavy', x: R(3550, 420), y: 170, delay: 0 }, { kind: 'knife', x: R(3550, -40), y: 150, delay: 0, variant: 1 },
                             { kind: 'brawler', x: R(3550, 440), y: 200, delay: 60, variant: 1 }, { kind: 'brawler', x: R(3550, -60), y: 175, delay: 120 },
                             { kind: 'knife', x: R(3550, 460), y: 185, delay: 240, variant: 2 }, { kind: 'heavy', x: R(3550, 480), y: 160, delay: 300, variant: 1 },
                             { kind: 'crate', x: 3800, y: 205, delay: 0, contents: 'gear' } ] },
  ],
  bossDoorX: 4000,
};

export function sectionIndexAt(stage: StageData, x: number): number {
  let i = 0;
  for (let k = 0; k < stage.sections.length; k++) if (x >= stage.sections[k]!.startX) i = k;
  return i;
}
```

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run test/core/stage
git add src/core/stage/stage1.ts test/core/stage/stage1-data.test.ts
git commit -m "feat(core): stage 1 data — sections, scroll-locks, spawn tables and hazards"
```

### Task 14.2: Scroll-lock engine — lock, spawn, release, boss door

**Files:**
- Create: `src/core/stage/spawn.ts`, `src/core/stage/locks.ts`, `test/core/stage/locks.test.ts`
- Modify: `src/core/sim/state.ts` (`stage.stageData`, `SimEvent 'bossDoor'`), `src/core/sim/tick.ts`, `src/core/sim/camera.ts`

**Interfaces:**
- Produces: `createWorld(seed, stageWidth?, stage?: StageData)` — when `stage` is given, `state.stageWidth = stage.width` and `state.stage.lockCleared = stage.locks.map(() => false)`; `attachStage(state, stage)`; `spawnEntry(state, entry, lockIndex): Entity`; `lockSystem(state)` in `POST_UPDATE_SYSTEMS`; `state.stage.lockFrame: number` (frames since the current lock engaged; -1 when none); `SimEvent { type: 'bossDoor' }` emitted once when the last lock is cleared and `camera.x ≥ bossDoorX − 384`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/stage/locks.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { STAGE1 } from '@core/stage/stage1';
import type { StageData } from '@core/stage/stage1';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const MINI: StageData = { width: 2000, sections: [{ name: 'A', bg: 's1', startX: 0, hazards: [] }], bossDoorX: 1500,
  locks: [{ camX: 200, entries: [{ kind: 'brawler', x: 620, y: 160, delay: 0 }, { kind: 'brawler', x: 660, y: 190, delay: 30 }] }] };

describe('scroll locks', () => {
  it('locks the camera at camX, spawns the table with delays, releases when all are dead', () => {
    const w = createWorld(1, undefined, MINI); const h = heroOf(w);
    for (let i = 0; i < 400 && w.camera.lockX === null; i++) tick(w, inp({ right: true }));
    expect(w.camera.lockX).toBe(200);
    expect(w.entities.filter((e) => e.kind === 'brawler')).toHaveLength(1);
    for (let i = 0; i < 31; i++) tick(w, EMPTY_INPUT);
    expect(w.entities.filter((e) => e.kind === 'brawler')).toHaveLength(2);
    for (let i = 0; i < 100; i++) tick(w, inp({ right: true }));
    expect(w.camera.x).toBe(200);                                        // camera does not advance while locked
    for (const g of w.entities.filter((e) => e.kind === 'brawler')) { g.hp = 0; g.state = 'dead'; g.dead = true; }
    tick(w, EMPTY_INPUT);
    expect(w.camera.lockX).toBeNull();
    expect(w.stage.lockCleared).toEqual([true]);
    expect(w.events.some((e) => e.type === 'lockRelease')).toBe(true);
    h.pos.x = 1400; let door = 0;
    for (let i = 0; i < 300; i++) { tick(w, inp({ right: true })); door += w.events.filter((e) => e.type === 'bossDoor').length; }
    expect(door).toBe(1);
  });
  it('the full stage engages every lock in order as the hero walks right (enemies auto-killed)', () => {
    const w = createWorld(1, undefined, STAGE1);
    const seen: number[] = [];
    for (let i = 0; i < 20000 && !w.events.some((e) => e.type === 'bossDoor'); i++) {
      tick(w, inp({ right: true }));
      if (w.camera.lockX !== null && seen[seen.length - 1] !== w.camera.lockIndex) seen.push(w.camera.lockIndex);
      if (w.stage.lockFrame > 600) for (const e of w.entities) if (e.kind !== 'hero' && e.kind !== 'crate' && e.kind !== 'pickup') { e.hp = 0; e.state = 'dead'; e.dead = true; }
    }
    expect(seen).toEqual(STAGE1.locks.map((_, i) => i));
    expect(w.stage.lockCleared.every(Boolean)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

`state.ts`: extend `WorldState.stage` with `stageData: StageData | null; lockFrame: number` (import the type only — no cycle: `stage1.ts` imports only `PickupKind`); `createWorld(seed, stageWidth = SCREEN.w * 3, stage: StageData | null = null)` sets `stageWidth = stage?.width ?? stageWidth`, `stage.stageData = stage`, `lockCleared = stage ? stage.locks.map(() => false) : []`, `lockFrame: -1`. Add `| { type: 'bossDoor' }` to `SimEvent`.

```ts
// src/core/stage/spawn.ts
import type { Entity } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { spawnGang } from '../entities/gang';
import { spawnFeral } from '../entities/feral';
import { spawnCrate } from '../entities/items';
import type { SpawnEntry } from './stage1';

export function spawnEntry(state: WorldState, entry: SpawnEntry, lockIndex: number): Entity {
  let e: Entity;
  if (entry.kind === 'crate') e = spawnCrate(state, entry.x, entry.y, entry.contents ?? 'gear');
  else if (entry.kind === 'feral') e = spawnFeral(state, entry.x, entry.y);
  else e = spawnGang(state, entry.kind, entry.x, entry.y, entry.variant ?? 0);
  e.lockIndex = lockIndex;
  return e;
}
```

```ts
// src/core/stage/locks.ts
import type { WorldState } from '../sim/state';
import { emit, SCREEN } from '../sim/state';
import { spawnEntry } from './spawn';
import { isBody } from '../sim/entity';

export function lockSystem(state: WorldState): void {
  const stage = state.stage.stageData;
  if (!stage) return;
  const i = state.camera.lockIndex;
  if (state.camera.lockX === null) {
    if (i < stage.locks.length && state.camera.x >= stage.locks[i]!.camX) {
      state.camera.lockX = stage.locks[i]!.camX; state.camera.x = stage.locks[i]!.camX; state.stage.lockFrame = 0;
      emit(state, { type: 'sfx', id: 'lock' });
    } else if (i >= stage.locks.length && !state.stage.bossDoorReached && state.camera.x >= stage.bossDoorX - SCREEN.w) {
      state.stage.bossDoorReached = true; state.camera.lockX = stage.bossDoorX - SCREEN.w; state.camera.x = state.camera.lockX;
      emit(state, { type: 'bossDoor' });
    }
    return;
  }
  if (state.stage.bossDoorReached) return;            // the boss (ticket 15) releases this lock
  const lock = stage.locks[i]!;
  for (const entry of lock.entries) if (entry.delay === state.stage.lockFrame) spawnEntry(state, entry, i);
  state.stage.lockFrame++;
  const maxDelay = Math.max(...lock.entries.map((e) => e.delay));
  const remaining = state.entities.some((e) => e.lockIndex === i && isBody(e) && !e.dead && e.state !== 'dead');
  if (state.stage.lockFrame > maxDelay && !remaining) {
    state.stage.lockCleared[i] = true; state.camera.lockX = null; state.camera.lockIndex = i + 1; state.stage.lockFrame = -1;
    emit(state, { type: 'lockRelease', index: i }); emit(state, { type: 'sfx', id: 'lock_release' });
  }
}
```
(add `bossDoorReached: boolean` to `stage`, default false.) `camera.ts`: when `lockX !== null` the camera stays at `lockX` (already) — also clamp the hero to the screen while locked (already). `tick.ts`: `POST_UPDATE_SYSTEMS = [lockSystem, assignAttackTickets, resolveHits, nameCardSystem]`. Feral vent spawns use `spawnFeral` at the entry's x/y — the "vent" is an art/anim concern (`emerge` state) and a background element in ticket 17.

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/stage/spawn.ts src/core/stage/locks.ts src/core/sim/state.ts src/core/sim/tick.ts test/core/stage/locks.test.ts
git commit -m "feat(core): scroll-lock engine with delayed spawn tables, release and the boss door"
```

### Task 14.3: Hazards — belts, molten channel, telegraphed ladle pours

**Files:**
- Create: `src/core/stage/hazards.ts`, `test/core/stage/hazards.test.ts`
- Modify: `src/core/combat/resolve.ts` (`applyHazardHit`), `src/core/sim/state.ts` (`SimEvent 'hazardTell'`), `src/core/sim/tick.ts`

**Interfaces:**
- Produces: `hazardSystem(state)`; `applyHazardHit(state, vic, damage, level, dir)`; `CHANNEL = { damage: 8 }`, `LADLE = { damage: 15 }`; `SimEvent { type: 'hazardTell'; x: number; y: number; frames: number }` emitted on the first tell frame of each pour; `ladlePhase(h, frame): 'idle' | 'tell' | 'pour'`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/stage/hazards.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import type { StageData } from '@core/stage/stage1';
import { ladlePhase } from '@core/stage/hazards';

const stage = (hazards: StageData['sections'][0]['hazards']): StageData =>
  ({ width: 2000, sections: [{ name: 'A', bg: 's1', startX: 0, hazards }], locks: [], bossDoorX: 1500 });

describe('hazards', () => {
  it('a belt pushes bodies along x while inside its y-band', () => {
    const w = createWorld(1, undefined, stage([{ type: 'belt', x1: 0, x2: 500, y1: 128, y2: 160, push: 0.6 }])); const h = heroOf(w);
    h.pos.y = 140; const x0 = h.pos.x;
    for (let i = 0; i < 10; i++) tick(w, EMPTY_INPUT);
    expect(h.pos.x).toBeCloseTo(x0 + 6);
    h.pos.y = 190; const x1 = h.pos.x;
    for (let i = 0; i < 10; i++) tick(w, EMPTY_INPUT);
    expect(h.pos.x).toBe(x1);
  });
  it('the molten channel knocks down anything touching it from any side, once per contact', () => {
    const w = createWorld(1, undefined, stage([{ type: 'channel', x1: 100, x2: 200, y1: 184, y2: 208 }])); const h = heroOf(w);
    h.pos.x = 90; h.pos.y = 195; h.vel.x = 0;
    for (let i = 0; i < 12; i++) tick(w, { ...EMPTY_INPUT, right: true });
    expect(h.state === 'knockdown' || h.state === 'down').toBe(true);
    expect(h.hp).toBe(92);
    expect(h.vel.x <= 0 || h.state === 'down').toBe(true);   // pushed back out, away from the channel
  });
  it('ladle pours show a tell for tellFrames before damage frames, on a fixed period', () => {
    const L = { type: 'ladle' as const, x: 300, w: 72, period: 240, tellFrames: 60, damageFrames: 30 };
    expect(ladlePhase(L, 0)).toBe('tell'); expect(ladlePhase(L, 59)).toBe('tell');
    expect(ladlePhase(L, 60)).toBe('pour'); expect(ladlePhase(L, 89)).toBe('pour');
    expect(ladlePhase(L, 90)).toBe('idle'); expect(ladlePhase(L, 240)).toBe('tell');
    const w = createWorld(1, undefined, stage([L])); const h = heroOf(w);
    h.pos.x = 300; h.pos.y = 170;
    let tells = 0;
    for (let i = 0; i < 260; i++) { tick(w, EMPTY_INPUT); tells += w.events.filter((e) => e.type === 'hazardTell').length; }
    expect(tells).toBe(1);          // the tell edge at frame 240 (frames 0..59 are mid-tell at boot, no edge)
    expect(h.hp).toBe(85);          // one pour (frames 60..89) hits once, not on every damage frame
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

`resolve.ts` — refactor the victim side of `applyHit` into a reusable function and add:
```ts
export function applyHazardHit(state: WorldState, vic: Entity, damage: number, level: HitLevel, dir: Facing): void {
  vic.hp -= damage; vic.flashFrames = HIT_FEEL.flashFrames;
  state.hitstop = Math.max(state.hitstop, HIT_FEEL.hitstop[level]);
  if (HIT_FEEL.shakePx[level] > 0) state.shake = { frames: HIT_FEEL.shakeFrames, px: HIT_FEEL.shakePx[level] };
  emit(state, { type: 'sfx', id: `hit_${level}` });
  if (level === 'launch' || vic.hp <= 0) { applyKnockdown(state, vic, dir); return; }
  setState(vic, 'hurt'); vic.hitstun = HIT_FEEL.hitstun[level === 'heavy' ? 'heavy' : 'light']; vic.vel.x = 3 * dir; vic.vel.y = 0;
}
```

```ts
// src/core/stage/hazards.ts
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import { isBody } from '../sim/entity';
import type { Facing } from '../types';
import { applyHazardHit } from '../combat/resolve';
import type { Hazard } from './stage1';
import { sectionIndexAt } from './stage1';

export const CHANNEL = { damage: 8 } as const;
export const LADLE = { damage: 15 } as const;
const NO_CONTACT = new Set(['knockdown', 'down', 'getup', 'dead', 'thrown']);

export function ladlePhase(h: Extract<Hazard, { type: 'ladle' }>, frame: number): 'idle' | 'tell' | 'pour' {
  const p = frame % h.period;
  return p < h.tellFrames ? 'tell' : p < h.tellFrames + h.damageFrames ? 'pour' : 'idle';
}

export function hazardSystem(state: WorldState): void {
  const stage = state.stage.stageData;
  if (!stage) return;
  const hazards = stage.sections.flatMap((s) => s.hazards);
  for (const h of hazards) {
    if (h.type === 'ladle' && ladlePhase(h, state.frame) === 'tell' && ladlePhase(h, state.frame - 1) !== 'tell') emit(state, { type: 'hazardTell', x: h.x, y: 120, frames: h.tellFrames });
    for (const e of state.entities) {
      if (!isBody(e) || e.dead) continue;
      if (h.type === 'belt') {
        if (e.pos.z === 0 && e.pos.x >= h.x1 && e.pos.x <= h.x2 && e.pos.y >= h.y1 && e.pos.y <= h.y2) e.pos.x += h.push;
      } else if (h.type === 'channel') {
        if (NO_CONTACT.has(e.state) || e.invulnFrames > 0 || e.pos.z > 0) continue;
        if (e.pos.x >= h.x1 && e.pos.x <= h.x2 && e.pos.y >= h.y1 && e.pos.y <= h.y2) {
          const dir: Facing = e.pos.x < (h.x1 + h.x2) / 2 ? -1 : 1;   // throw it back the way it came
          applyHazardHit(state, e, CHANNEL.damage, 'launch', dir);
          emit(state, { type: 'sfx', id: 'sizzle' });
        }
      } else if (h.type === 'ladle') {
        if (ladlePhase(h, state.frame) !== 'pour' || NO_CONTACT.has(e.state) || e.invulnFrames > 0) continue;
        if (Math.abs(e.pos.x - h.x) <= h.w / 2) { applyHazardHit(state, e, LADLE.damage, 'heavy', e.pos.x < h.x ? -1 : 1); e.invulnFrames = h.damageFrames; }  // once per pour
      }
    }
  }
  state.stage.sectionIndex = sectionIndexAt(stage, state.camera.x + 192);
}
```
`tick.ts`: `POST_UPDATE_SYSTEMS = [lockSystem, hazardSystem, assignAttackTickets, resolveHits, nameCardSystem]`. `state.ts`: add the `hazardTell` event.

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/stage/hazards.ts src/core/combat/resolve.ts src/core/sim/state.ts src/core/sim/tick.ts test/core/stage/hazards.test.ts
git commit -m "feat(core): conveyor belts, molten channel knockdown and telegraphed ladle pours"
```

### Task 14.4: Adapter — real stage in the scene, hazard placeholders, section backgrounds, ⛔ timed runs

**Files:**
- Create: `src/adapters/phaser/views/HazardView.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`, `src/adapters/phaser/views/Parallax.ts`

- [ ] **Step 1:** `GameScene.create()`: `this.world = createWorld(1, undefined, STAGE1)`; remove the hard-coded spawns and the `F` hotkey (keep `H`). `Parallax` takes the section index each frame: `sync(cameraX, sectionBg)` — if the `${bg}-sky` textures are missing, draw a flat rect per layer in a section-specific placeholder colour from the world palette (`industrial` slot for s2, `molten` slot for s3) so the section change is visible.
- [ ] **Step 2:** `HazardView`: draws belts as striped rects scrolling at `push` px/frame, the channel as an orange (`molten` slot) glow strip, ladles as a bracket at `x` with a growing tell bar during `hazardTell` (frame-stepped by ticks) and a pour column during the pour phase — all from `STAGE1` data + `ladlePhase(h, world.frame)`; nothing timed by wall clock.
- [ ] **Step 3: ⛔ Timed runs** — owner plays start → boss door twice with a stopwatch; record both times, deaths, and where the pacing sagged in `docs/verification/14-timed-runs.md`. Target 6–8 min. Tune **only** `STAGE1` (counts, delays, lock positions) — never enemy stats — and re-run until two runs land in range. Each tuning change re-runs `npm test` (the data test pins the PRD's counts; if a tuning change violates a count the PRD wins and the delay/position is what moves).
- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/HazardView.ts src/adapters/phaser/views/Parallax.ts src/adapters/phaser/scenes/GameScene.ts src/core/stage/stage1.ts docs/verification/14-timed-runs.md
git commit -m "feat: play stage 1 end to end with hazard placeholders; pacing tuned to 6-8 minutes"
```

**Ticket 14 verification gate:** six acceptance boxes; two timed runs in range; Vitest covers lock release, belt push, channel knockdown.

---

# Ticket 15 — Boss "the Foreman": both phases, tear-open, blade-limb drop

**Delivers:** in the furnace pit the devil-mech fights as a slow heavy brawler; at 50 % HP it tears itself open (invulnerable), becomes 1.3× faster with an emissive tint, throws molten globs, and rips off its blade arm, which lands as a pickup; defeat ends the stage.

### Task 15.1: Boss data, phase 1 FSM, no-launch rule, defeat

**Files:**
- Create: `src/core/entities/boss.ts`, `test/core/entities/boss.test.ts`
- Modify: `src/core/combat/resolve.ts` (boss cannot be launched), `src/core/sim/tick.ts`, `src/core/stage/locks.ts` (spawn on `bossDoor`, release on defeat)

**Interfaces:**
- Produces: `BOSS_DATA: ActorData & { reach: number; attackCooldown: number }` with moves `swing`, `pound`, `throwGlob`; `spawnBoss(state, x, y)`; `updateBoss`; boss states `idle`, `approach`, `swing`, `pound`, `tearOpen`, `throwGlob`, `hurt`, `dying`, `dead`; `BOSS_PHASE2_AT = 0.5`, `BOSS_PHASE2_SPEED = 1.3`, `TEAR_OPEN_FRAMES = 60`; `SimEvent 'bossPhase2'`/`'bossDefeated'` (already in the union).

- [ ] **Step 1: Write the failing test**

```ts
// test/core/entities/boss.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnBoss, BOSS_DATA, BOSS_PHASE2_SPEED, TEAR_OPEN_FRAMES } from '@core/entities/boss';
import { applyHit } from '@core/combat/resolve';
import { HERO_DATA } from '@core/combat/frame-data';
import { WEAPON_HEAT } from '@core/weapons/heat';

const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let k = 0; k < n; k++) tick(w, EMPTY_INPUT); };

describe('the Foreman', () => {
  it('phase 1: telegraphed swing/pound with super-armour, never launched by hero hits', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnBoss(w, h.pos.x + 50, h.pos.y);
    let attacked = false;
    for (let i = 0; i < 600; i++) { tick(w, EMPTY_INPUT); if ((b.state === 'swing' || b.state === 'pound') && b.stateFrame === 1) { attacked = true; expect(b.armorFrames).toBeGreaterThan(0); break; } }
    expect(attacked).toBe(true);
    applyHit(w, h, b, HERO_DATA.moves.attack3!);
    expect(b.state).not.toBe('knockdown');
    expect(w.entities.some((e) => e.kind === 'boss')).toBe(true);
  });
  it('transitions at exactly 50%: invulnerable tear-open, then 1.3x speed, tint, blade drop once, glob attack', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100;
    const b = spawnBoss(w, 400, h.pos.y);
    run(w, 5);
    b.hp = Math.floor(BOSS_DATA.hp * 0.5) + 1; applyHit(w, h, b, { ...HERO_DATA.moves.attack1!, damage: 1 });
    tick(w, EMPTY_INPUT);
    expect(b.state).toBe('tearOpen'); expect(b.invulnFrames).toBeGreaterThanOrEqual(TEAR_OPEN_FRAMES);
    let phase2Events = 0;
    for (let i = 0; i < TEAR_OPEN_FRAMES + 5; i++) { tick(w, EMPTY_INPUT); phase2Events += w.events.filter((e) => e.type === 'bossPhase2').length; }
    expect(phase2Events).toBe(1);
    expect(b.phase).toBe(2); expect(b.speedMul).toBe(BOSS_PHASE2_SPEED); expect(b.tint).toBe(true);
    const blades = w.entities.filter((e) => e.kind === 'weaponPickup' && e.weapon?.kind === 'blade');
    expect(blades).toHaveLength(1); expect(blades[0]!.weapon!.heat).toBe(WEAPON_HEAT.blade);
    let glob = false;
    for (let i = 0; i < 900 && !glob; i++) { tick(w, EMPTY_INPUT); if (w.entities.some((e) => e.kind === 'projectile' && e.state === 'glob')) glob = true; }
    expect(glob).toBe(true);
  });
  it('a glob respects the depth rule', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100; h.pos.y = 150;
    const b = spawnBoss(w, 400, 190); b.phase = 2; b.speedMul = BOSS_PHASE2_SPEED; b.weaponKind = null; b.state = 'idle';
    for (let i = 0; i < 1200; i++) { tick(w, EMPTY_INPUT); h.pos.y = 150; h.pos.x = 100; b.pos.y = 190; b.pos.x = 400; }
    expect(h.hp).toBe(100);
  });
  it('defeat: dying → dead once, bossDefeated event once, stage flag set, score awarded', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnBoss(w, h.pos.x + 60, h.pos.y);
    b.hp = 1; applyHit(w, h, b, HERO_DATA.moves.attack1!);
    let defeated = 0;
    for (let i = 0; i < 200; i++) { tick(w, EMPTY_INPUT); defeated += w.events.filter((e) => e.type === 'bossDefeated').length; }
    expect(defeated).toBe(1); expect(w.stage.bossDefeated).toBe(true); expect(w.score).toBeGreaterThanOrEqual(5000);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/entities/boss.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit, heroOf, spawn } from '../sim/state';
import type { ActorData } from '../combat/frame-data';
import { registerActorData, moveTotal } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { approach } from './gang';
import { spawnProjectile, spawnWeaponPickup } from './items';
import { WEAPON_HEAT } from '../weapons/heat';
import { rngNext } from '../sim/rng';
import { SCORE } from '../arcade/score';

export const BOSS_PHASE2_AT = 0.5;
export const BOSS_PHASE2_SPEED = 1.3;
export const TEAR_OPEN_FRAMES = 60;
export const DYING_FRAMES = 90;

export const BOSS_DATA: ActorData & { reach: number; attackCooldown: number } = {
  walkSpeed: { x: 0.6, y: 0.4 }, hp: 300, hurtbox: { x: -24, y: 0, w: 48, h: 120 }, jumpVz: 0,
  reach: 64, attackCooldown: 50,
  moves: {
    swing:     { startup: 20, active: 6, recovery: 26, hitbox: { x: 10, y: 20, w: 64, h: 50 }, damage: 16, level: 'heavy', pushback: 5 },
    pound:     { startup: 26, active: 6, recovery: 34, hitbox: { x: -30, y: 0, w: 110, h: 24 }, damage: 20, level: 'launch', pushback: 6 },
    throwGlob: { startup: 18, active: 1, recovery: 30, hitbox: { x: 0, y: 0, w: 0, h: 0 }, damage: 0, level: 'light', pushback: 0 },
  },
};
registerActorData('boss', BOSS_DATA);

export function spawnBoss(state: WorldState, x: number, y: number): Entity {
  const b = spawn(state, 'boss', x, y);
  b.hp = BOSS_DATA.hp; b.maxHp = BOSS_DATA.hp; b.targetId = state.heroId;
  b.weaponKind = 'blade';   // the arm it will tear off
  return b;
}

export function updateBoss(state: WorldState, b: Entity, _input: InputFrame): void {
  b.stateFrame++;
  const hero = heroOf(state);
  if (b.state === 'dying') {
    b.vel.x = 0; b.vel.y = 0;
    if (b.stateFrame >= DYING_FRAMES) { setState(b, 'dead'); b.removeIn = 60; }
    return;
  }
  if (b.state === 'dead') return;
  if (b.hp <= 0) {
    setState(b, 'dying'); b.invulnFrames = 9999;
    state.stage.bossDefeated = true; state.score += SCORE.boss;
    emit(state, { type: 'bossDefeated' }); emit(state, { type: 'sfx', id: 'boss_death' });
    return;
  }
  if (b.state === 'tearOpen') {
    b.vel.x = 0; b.vel.y = 0;
    if (b.stateFrame >= TEAR_OPEN_FRAMES) {
      b.phase = 2; b.speedMul = BOSS_PHASE2_SPEED; b.tint = true; b.invulnFrames = 0;
      if (b.weaponKind === 'blade') { spawnWeaponPickup(state, 'blade', b.pos.x - b.facing * 40, b.pos.y, WEAPON_HEAT.blade); b.weaponKind = null; }
      emit(state, { type: 'bossPhase2' }); emit(state, { type: 'sfx', id: 'boss_phase2' });
      setState(b, 'idle'); b.cooldown = 20;
    }
    return;
  }
  if (b.phase === 1 && b.hp <= BOSS_DATA.hp * BOSS_PHASE2_AT) {
    setState(b, 'tearOpen'); b.invulnFrames = TEAR_OPEN_FRAMES; b.vel.x = 0; b.vel.y = 0;
    emit(state, { type: 'sfx', id: 'boss_tear' });
    return;
  }
  if (updateStunState(state, b)) return;
  const move = BOSS_DATA.moves[b.state];
  if (move) {
    b.vel.x = 0; b.vel.y = 0;
    if (b.state === 'throwGlob' && b.stateFrame === move.startup + 1) {
      const p = spawnProjectile(state, 'glob', b.pos.x + b.facing * 30, b.pos.y, 70, b.facing, 'gang');
      p.vel.z = 2.5; emit(state, { type: 'sfx', id: 'glob' });
    }
    if (b.stateFrame >= moveTotal(move)) { setState(b, 'idle'); b.cooldown = Math.round(BOSS_DATA.attackCooldown / b.speedMul); }
    return;
  }
  switch (b.state) {
    case 'idle':
      b.vel.x = 0; b.vel.y = 0; b.facing = hero.pos.x >= b.pos.x ? 1 : -1;
      if (b.cooldown === 0) {
        const far = Math.abs(hero.pos.x - b.pos.x) > 120;
        if (b.phase === 2 && far && rngNext(state.rng) < 0.6) setState(b, 'throwGlob');
        else setState(b, 'approach');
      }
      break;
    case 'approach': {
      if (approach(b, BOSS_DATA, hero.pos.x, hero.pos.y, BOSS_DATA.reach)) {
        const mv = rngNext(state.rng) < 0.5 ? 'swing' : 'pound';
        setState(b, mv); b.armorFrames = BOSS_DATA.moves[mv]!.startup; b.vel.x = 0; b.vel.y = 0;
      }
      break;
    }
    default:
      setState(b, 'idle');
  }
}
```
`resolve.ts` `applyHit`: the launch branch becomes `if (vic.kind !== 'boss' && (move.level === 'launch' || vic.hp <= 0 || vic.pos.z > 0)) { applyKnockdown(...); return; }` and for the boss with `hp <= 0` just `return` (the boss FSM handles dying). `updateStunState` is only reached for `hurt`. `tick.ts`: `boss: updateBoss`. `locks.ts`: on the `bossDoor` branch also `spawnBoss(state, state.camera.x + 300, 176)`; and in the locked-with-`bossDoorReached` branch: `if (state.stage.bossDefeated) { state.camera.lockX = null; }`. `physics.ts`: globs fall with gravity (`state === 'glob'` is not excluded) and `updateProjectile` kills a glob when it lands.

- [ ] **Step 4: Run tests + commit**

```bash
npm test
git add src/core/entities/boss.ts src/core/combat/resolve.ts src/core/stage/locks.ts src/core/sim/tick.ts test/core/entities/boss.test.ts
git commit -m "feat(core): the Foreman — phase 1 brawler, 50% tear-open, phase 2 globs and blade drop, defeat"
```

### Task 15.2: Adapter — boss in the pit, phase-2 tint flag, defeat signal

**Files:**
- Modify: `src/adapters/phaser/views/anim-table.ts`, `src/adapters/phaser/views/EntityView.ts`, `src/adapters/phaser/scenes/GameScene.ts`

- [ ] **Step 1:** `ANIM_TABLE.boss`: `idle`, `approach → walk`, `swing`, `pound → ground-pound`, `tearOpen → tear-open`, `throwGlob → throw`, `hurt`, `dying → death`, `dead → death hold last`; phase-2 states use the same actions — the view applies the emissive tint when `e.tint` (`setTint` with the four `reserve` palette slots cycling per frame via `HUD_COLOURS.danger` and slots 61–63 — ticket 16 replaces the tint with a real recolor swap). Boxes: a magenta stroke when `tint`.
- [ ] **Step 2:** `GameScene`: on `bossDefeated` event show `STAGE CLEAR` (display16, centre) — the coin-op machine in ticket 18 takes over from here; log to console in DEV.
- [ ] **Step 3: Browser check** — walk to the pit: `THE FOREMAN` name-card slams; slow swings and a ground-pound with visible wind-ups; at half health it freezes (invulnerable), a cyan blade bar drops, it turns magenta-outlined and faster and lobs arcing globs that miss if you change lane; killing it shows `STAGE CLEAR`.
- [ ] **Step 4: Commit**

```bash
npm run check
git add src/adapters/phaser/views/anim-table.ts src/adapters/phaser/views/EntityView.ts src/adapters/phaser/scenes/GameScene.ts
git commit -m "feat(adapter): boss encounter with phase-2 tint flag and stage-clear signal"
```

**Ticket 15 verification gate:** five acceptance boxes; Vitest covers the 50 % transition, single blade spawn, depth rule on globs.

---

# Ticket 16 — Boss sprites wired (incl. phase-2 emissive recolor)

**Delivers:** the Foreman on ~120-px frames; phase 2 is the same silhouette with the four reserve palette slots swapped in and a torn arm socket. ⛔ **Human gates: credits (reference + ~10 runs); owner signs off the boss in motion.**

### Task 16.1: ⛔ Reference + sheets

- [ ] **Step 1: Reference** — `Design.md` §3.5/§3.6 template + `devil-mech boss, between war-mech and gargoyle: horns, furnace-glow chest cavity, molten seams along the plating, wide heavy stance, one arm ending in a jagged blade-limb; nothing resembling any existing robot franchise`, `image_references` = hero reference. 2 candidates; ⛔ owner picks (must read "big and slow" at 120 px). Save `assets/sources/boss/reference.png` + prompt; `LICENSES.md` row.
- [ ] **Step 2: Sheets** (`frame_size: 256`, `is_humanoid: true`): `idle` 4, `walk` 6, `swing` 5 (blade arm), `ground-pound` 6, `hurt` 2, `tear-open` 6 ("rips its own blade arm off, chest cavity flaring"), `throw` 4 ("hurls a molten glob with the remaining arm; torn socket visible"), `death` 6 ("collapses, furnace core going dark"). Phase-2 idle/walk are **not** generated: the recolor is a palette swap over the phase-1 frames (Design §3.5), and the torn socket is drawn only in `throw`/`tear-open` — accepted simplification; if the owner wants a socket on every phase-2 frame, add `idle-torn`/`walk-torn` runs here (2 more). Rows + ledger; reject Kling.
- [ ] **Step 3: Commit** `art: boss reference and AutoSprite sheets`.

### Task 16.2: Atlas at ~120 px, phase-2 recolor via the reserve slots

**Files:**
- Create: `tools/art/manifests/boss.json`, `public/assets/atlases/boss{,-p2}.{png,json}`
- Modify: `src/adapters/phaser/views/anim-table.ts`, `src/adapters/phaser/views/EntityView.ts`, `src/core/entities/boss.ts` (rects), `src/adapters/phaser/scenes/BootScene.ts`

- [ ] **Step 1: Manifest** — `targetHeight: 120`, `scaleFrom: "idle"`, `worldOnly: true`, `swaps: { p2: { "<molten-slot-hex>": "#ff3ea8", "<molten-slot-hex-2>": "#ff7a3e", "<infernal-slot-hex>": "#ffd23e", "<hot-white-slot-hex>": "#ffffff" } }` — the **from** colours are the boss's furnace-glow/seam colours read off the quantised base atlas; the **to** colours are exactly the four `reserve` slots (60–63). Because `swaps` map colours *within* the palette and the reserve slots are palette colours, `boss-p2.png` still contains only palette colours (the atlas test's palette assertion holds).
- [ ] **Step 2: Build** — `npm run art:atlas tools/art/manifests/boss.json`; register `boss` and `boss-p2` in `BootScene.MANIFEST`.
- [ ] **Step 3: View** — in `EntityViews.place`, for `kind === 'boss'` choose the atlas key `e.tint ? 'boss-p2' : 'boss'` (via `variantAtlasKey('boss', e.tint ? 'p2' : 0)` — widen `variantAtlasKey` to accept `number | string`); remove the magenta tint fallback from ticket 15. `ANIM_TABLE.boss` actions per Task 16.1 names.
- [ ] **Step 4: Hitboxes** — with `H`, fit `BOSS_DATA.hurtbox`, `swing`, `pound` rects; `npm test` green.
- [ ] **Step 5: ⛔ Owner signs off** the boss in motion (both phases); `docs/verification/16-boss.md`.
- [ ] **Step 6: Commit** `art: boss atlas with reserve-slot phase-2 recolor wired to the FSM`.

**Ticket 16 verification gate:** four acceptance boxes; phase 2 uses `boss-p2` built from the same sheets (ledger shows no extra runs for it).

---

# Ticket 17 — Remaining backgrounds: Conveyor Floor, Furnace Hall, boss pit

**Delivers:** sections 2, 3 and the boss pit on real parallax layers with hazards drawn as hazards. ⛔ **Human gate: credits (~12 generations incl. retries).**

### Task 17.1: ⛔ Generate

- [ ] **Step 1:** Per the `Design.md` §3.6 background template, 3 layers × 3 scenes: **Conveyor Floor** (interior; belts and *an unmistakable orange-glow molten channel strip* in the ground layer; chain hoists in the mid layer; a wall vent grille in the mid layer at the feral spawn side), **Furnace Hall** (catwalks; *ladle silhouettes visible in the mid layer*), **Boss pit** (furnace pit backdrop, sky = furnace wall glow). Same rules: 21:9, no text/characters/landmarks; ground layers must loop. Save under `assets/sources/bg/{s2,s3,pit}-{sky,mid,ground}.png` + prompts; rows + ledger.
- [ ] **Step 2:** Commit `art: Conveyor Floor, Furnace Hall and boss-pit source layers`.

### Task 17.2: Build, seam-gate, per-section scroll ratios, hazard art alignment

**Files:**
- Create: `tools/art/manifests/bg-{s2,s3,pit}.json`, `public/assets/backgrounds/{s2,s3,pit}-*.png`
- Modify: `src/adapters/phaser/views/Parallax.ts`, `src/adapters/phaser/views/HazardView.ts`, `src/adapters/phaser/scenes/BootScene.ts`, `src/core/stage/stage1.ts` (hazard x-ranges only, to line up with the art)

- [ ] **Step 1:** Build all three with `art:bg` (the seam gate fails a bad ground loop → regenerate that layer). Register the nine textures.
- [ ] **Step 2:** `Parallax`: ratios per section — `PARALLAX_RATIOS_BY_SECTION: Record<'s1'|'s2'|'s3'|'pit', {sky, mid, ground}>` = s1 `{0.15, 0.5, 1}`, s2 `{0.1, 0.45, 1}` (interior: flatter sky), s3 `{0.2, 0.55, 1}`, pit `{0.05, 0.4, 1}`; the pit uses `bg: 'pit'` once `stage.bossDoorReached`. Crossing a section boundary swaps textures at the exact camera x where `sectionIndexAt` changes (a hard cut is fine: the boundary is behind a scroll-lock so the camera is still).
- [ ] **Step 3:** Line up hazards with the art: adjust `STAGE1` channel/belt `x1..x2` and ladle `x` to where the painted strip/ladles are (read pixel columns off the quantised ground/mid layers with `sharp` + a one-off script, or by eye with `H`-style debug rects in `HazardView`). `HazardView` keeps drawing the tell bar + pour column (gameplay-critical readability) but drops the placeholder channel/belt fills now the art carries them.
- [ ] **Step 4:** Browser walk-through from gate to pit; `npm test` (stage data test still pins counts). Commit `art: sections 2-3 and boss pit on real parallax layers; hazards aligned to the art`.

**Ticket 17 verification gate:** four acceptance boxes; seam gate green for every ground layer.

---

# Ticket 18 — Coin-op state machine + credits economy

**Delivers:** BOOT → ATTRACT → COIN → PLAY → CONTINUE → PLAY | GAME OVER as an explicit machine outside the sim; unlimited coins; Start needs ≥1 credit; one life per credit; 10-s continue countdown resuming in place; hard-blink prompts; credits used tracked for the 1CC flag.

### Task 18.1: Pure arcade machine

**Files:**
- Create: `src/core/arcade/credits.ts`, `src/core/arcade/screen-machine.ts`, `test/core/arcade/screen-machine.test.ts`

**Interfaces:**
```ts
export type Screen = 'BOOT' | 'ATTRACT' | 'COIN' | 'PLAY' | 'CONTINUE' | 'GAME_OVER' | 'HISCORE_ENTRY';
export interface ArcadeState { screen: Screen; credits: number; usedThisGame: number; continueFrames: number; creditFlash: number; screenFrame: number; finalScore: number; stageReached: number }
export type ArcadeEvent = { type: 'boot' } | { type: 'coin' } | { type: 'start' } | { type: 'heroDead' } | { type: 'bossDefeated' } | { type: 'tick' } | { type: 'gameOverDone' } | { type: 'entryDone' } | { type: 'score'; score: number };
export const CONTINUE_FRAMES = 600;      // 10 s
export const GAME_OVER_FRAMES = 180;
export const BLINK_PERIOD = 40;          // 40 frames ≈ 1.5 Hz
export function createArcade(): ArcadeState;
export function reduceArcade(a: ArcadeState, ev: ArcadeEvent): ArcadeState;   // pure
export const blinkOn = (frame: number): boolean => frame % BLINK_PERIOD < BLINK_PERIOD / 2;
export function is1CC(usedThisGame: number): boolean;   // === 1
```
`credits.ts`: `insertCoin(c: number): number` (+1, unlimited), `canStart(c)`, `consume(c)`.

- [ ] **Step 1: Write the failing test**

```ts
// test/core/arcade/screen-machine.test.ts
import { describe, it, expect } from 'vitest';
import { createArcade, reduceArcade, CONTINUE_FRAMES, GAME_OVER_FRAMES, blinkOn, BLINK_PERIOD, is1CC } from '@core/arcade/screen-machine';

const ticks = (a: ReturnType<typeof createArcade>, n: number) => { for (let i = 0; i < n; i++) a = reduceArcade(a, { type: 'tick' }); return a; };

describe('coin-op machine', () => {
  it('boots to ATTRACT; coins add credits (unlimited) and move to COIN with a 2-frame flash', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    expect(a.screen).toBe('ATTRACT');
    for (let i = 0; i < 99; i++) a = reduceArcade(a, { type: 'coin' });
    expect(a.credits).toBe(99); expect(a.screen).toBe('COIN'); expect(a.creditFlash).toBe(2);
    a = ticks(a, 2); expect(a.creditFlash).toBe(0);
  });
  it('Start needs a credit, consumes exactly one, and counts credits used', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'start' }); expect(a.screen).toBe('ATTRACT');
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'coin' });
    a = reduceArcade(a, { type: 'start' });
    expect(a.screen).toBe('PLAY'); expect(a.credits).toBe(1); expect(a.usedThisGame).toBe(1);
  });
  it('death → CONTINUE for 600 frames; a coin resumes PLAY and increments credits used; timeout → GAME OVER', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'start' });
    a = reduceArcade(a, { type: 'heroDead' });
    expect(a.screen).toBe('CONTINUE'); expect(a.continueFrames).toBe(CONTINUE_FRAMES);
    a = ticks(a, 300);
    a = reduceArcade(a, { type: 'coin' });
    expect(a.screen).toBe('PLAY'); expect(a.usedThisGame).toBe(2); expect(a.credits).toBe(0);
    a = reduceArcade(a, { type: 'heroDead' });
    a = ticks(a, CONTINUE_FRAMES);
    expect(a.screen).toBe('GAME_OVER');
    a = ticks(a, GAME_OVER_FRAMES);
    expect(a.screen).toBe('HISCORE_ENTRY');      // ticket 19 decides entry vs. straight to attract; the machine always offers entry
    a = reduceArcade(a, { type: 'entryDone' });
    expect(a.screen).toBe('ATTRACT'); expect(a.usedThisGame).toBe(0);
  });
  it('a coin during CONTINUE with credits already banked still consumes one per continue', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    for (let i = 0; i < 3; i++) a = reduceArcade(a, { type: 'coin' });
    a = reduceArcade(a, { type: 'start' }); a = reduceArcade(a, { type: 'heroDead' });
    a = reduceArcade(a, { type: 'start' });   // Start also continues when a credit is banked
    expect(a.screen).toBe('PLAY'); expect(a.credits).toBe(1); expect(a.usedThisGame).toBe(2);
  });
  it('boss defeat ends the game into GAME_OVER (stage clear) and 1CC is credits used === 1', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'start' });
    a = reduceArcade(a, { type: 'bossDefeated' });
    expect(a.screen).toBe('GAME_OVER'); expect(is1CC(a.usedThisGame)).toBe(true);
  });
  it('blink is a hard 50% duty cycle at ~1.5 Hz', () => {
    expect(BLINK_PERIOD).toBe(40);
    expect(blinkOn(0)).toBe(true); expect(blinkOn(19)).toBe(true); expect(blinkOn(20)).toBe(false); expect(blinkOn(39)).toBe(false); expect(blinkOn(40)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// src/core/arcade/credits.ts
export const insertCoin = (credits: number): number => credits + 1;   // unlimited inserts — free demo
export const canStart = (credits: number): boolean => credits >= 1;
export const consume = (credits: number): number => Math.max(0, credits - 1);
```

```ts
// src/core/arcade/screen-machine.ts
import { canStart, consume, insertCoin } from './credits';

export type Screen = 'BOOT' | 'ATTRACT' | 'COIN' | 'PLAY' | 'CONTINUE' | 'GAME_OVER' | 'HISCORE_ENTRY';
export interface ArcadeState { screen: Screen; credits: number; usedThisGame: number; continueFrames: number; creditFlash: number; screenFrame: number; finalScore: number; stageReached: number }
export type ArcadeEvent = { type: 'boot' } | { type: 'coin' } | { type: 'start' } | { type: 'heroDead' } | { type: 'bossDefeated' } | { type: 'tick' } | { type: 'gameOverDone' } | { type: 'entryDone' } | { type: 'score'; score: number };

export const CONTINUE_FRAMES = 600;
export const GAME_OVER_FRAMES = 180;
export const BLINK_PERIOD = 40;
export const blinkOn = (frame: number): boolean => frame % BLINK_PERIOD < BLINK_PERIOD / 2;
export const is1CC = (usedThisGame: number): boolean => usedThisGame === 1;

export function createArcade(): ArcadeState {
  return { screen: 'BOOT', credits: 0, usedThisGame: 0, continueFrames: 0, creditFlash: 0, screenFrame: 0, finalScore: 0, stageReached: 1 };
}
const to = (a: ArcadeState, screen: Screen, patch: Partial<ArcadeState> = {}): ArcadeState => ({ ...a, ...patch, screen, screenFrame: 0 });

export function reduceArcade(a: ArcadeState, ev: ArcadeEvent): ArcadeState {
  switch (ev.type) {
    case 'boot': return to(a, 'ATTRACT');
    case 'coin': {
      const credits = insertCoin(a.credits);
      if (a.screen === 'ATTRACT' || a.screen === 'COIN') return to({ ...a, credits, creditFlash: 2 }, 'COIN');
      if (a.screen === 'CONTINUE') return to(a, 'PLAY', { credits: consume(credits), usedThisGame: a.usedThisGame + 1, creditFlash: 2, continueFrames: 0 });
      return { ...a, credits, creditFlash: 2 };
    }
    case 'start':
      if ((a.screen === 'COIN' || a.screen === 'ATTRACT') && canStart(a.credits)) return to(a, 'PLAY', { credits: consume(a.credits), usedThisGame: 1, finalScore: 0, stageReached: 1 });
      if (a.screen === 'CONTINUE' && canStart(a.credits)) return to(a, 'PLAY', { credits: consume(a.credits), usedThisGame: a.usedThisGame + 1, continueFrames: 0 });
      return a;
    case 'heroDead': return a.screen === 'PLAY' ? to(a, 'CONTINUE', { continueFrames: CONTINUE_FRAMES }) : a;
    case 'bossDefeated': return a.screen === 'PLAY' ? to(a, 'GAME_OVER') : a;
    case 'score': return { ...a, finalScore: ev.score };
    case 'tick': {
      const n = { ...a, screenFrame: a.screenFrame + 1, creditFlash: Math.max(0, a.creditFlash - 1) };
      if (n.screen === 'CONTINUE') { n.continueFrames -= 1; if (n.continueFrames <= 0) return to(n, 'GAME_OVER'); }
      if (n.screen === 'GAME_OVER' && n.screenFrame >= GAME_OVER_FRAMES) return to(n, 'HISCORE_ENTRY');
      return n;
    }
    case 'gameOverDone': return to(a, 'HISCORE_ENTRY');
    case 'entryDone': return to(a, a.credits > 0 ? 'COIN' : 'ATTRACT', { usedThisGame: 0 });
  }
}
```

- [ ] **Step 4: Run tests + commit**

```bash
npx vitest run test/core/arcade/screen-machine.test.ts
git add src/core/arcade/credits.ts src/core/arcade/screen-machine.ts test/core/arcade/screen-machine.test.ts
git commit -m "feat(core): coin-op screen machine with credits, continues and 1CC tracking"
```

### Task 18.2: Hero revive-in-place + world reset helpers

**Files:**
- Create: `src/core/arcade/session.ts`, `test/core/arcade/session.test.ts`

**Interfaces:**
- Produces: `newGameWorld(seed: number): WorldState` (`createWorld(seed, undefined, STAGE1)`); `reviveHero(state)` — hp = maxHp, state `idle`, `invulnFrames = 90`, `weapon = null`, position `camera.x + 60` on the band centre, `stage.heroDead = false`; keeps score, camera, lock, remaining enemies (resume in place at the current scroll-lock).

- [ ] **Step 1: Test**
```ts
// test/core/arcade/session.test.ts
import { describe, it, expect } from 'vitest';
import { newGameWorld, reviveHero } from '@core/arcade/session';
import { heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { applyKnockdown } from '@core/combat/resolve';

describe('session', () => {
  it('revives the hero in place: full health, invulnerable, same camera/lock/score', () => {
    const w = newGameWorld(3); const h = heroOf(w);
    w.camera.x = 320; w.camera.lockX = 320; w.score = 4200; h.weapon = { kind: 'blade', heat: 2 };
    h.hp = 0; applyKnockdown(w, h, 1); for (let i = 0; i < 80; i++) tick(w, EMPTY_INPUT);
    expect(w.stage.heroDead).toBe(true);
    reviveHero(w);
    expect(h.hp).toBe(h.maxHp); expect(h.state).toBe('idle'); expect(h.invulnFrames).toBe(90); expect(h.weapon).toBeNull();
    expect(w.stage.heroDead).toBe(false); expect(w.camera.lockX).toBe(320); expect(w.score).toBe(4200);
    expect(h.pos.x).toBe(380);
  });
});
```
- [ ] **Step 2: Implement**
```ts
// src/core/arcade/session.ts
import type { WorldState } from '../sim/state';
import { createWorld, heroOf, WALK_BAND } from '../sim/state';
import { setState } from '../sim/entity';
import { STAGE1 } from '../stage/stage1';

export const newGameWorld = (seed: number): WorldState => createWorld(seed, undefined, STAGE1);

export function reviveHero(state: WorldState): void {
  const h = heroOf(state);
  h.hp = h.maxHp; setState(h, 'idle'); h.invulnFrames = 90; h.weapon = null; h.grabbedId = null;
  h.hitstun = 0; h.vel = { x: 0, y: 0, z: 0 }; h.pos = { x: state.camera.x + 60, y: (WALK_BAND.minY + WALK_BAND.maxY) / 2, z: 0 };
  h.dead = false; h.removeIn = -1;
  state.stage.heroDead = false;
}
```
- [ ] **Step 3: Commit** `feat(core): new-game world and revive-in-place for continues`.

### Task 18.3: Adapter — screens, coin/start edges, blink, continue overlay

**Files:**
- Create: `src/adapters/phaser/screens/Attract.ts`, `src/adapters/phaser/screens/Continue.ts`, `src/adapters/phaser/screens/GameOver.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts`

**Interfaces:**
- Produces: each screen is a `Phaser.GameObjects.Container` subclass with `show()`, `hide()`, `step(arcade: ArcadeState, n: number)`; `GameScene.arcade: ArcadeState`; the scene routes input edges: `coin` (5 / Select) and `start` (Enter / Start) go to `reduceArcade` **before** the sim sees the frame; the sim only ticks while `arcade.screen === 'PLAY'` (ATTRACT ticks the demo world in ticket 19).

- [ ] **Step 1: Screens**
  - `Attract`: `display16` title text (`SLAG CITY` — replaced by the marquee logo image once ticket 21's `marquee.png` is in the manifest; use `this.textures.exists('marquee')`), `INSERT COIN` (`hud8`, bottom centre) shown when `credits === 0`, `PRESS START` when `credits > 0`; both visible only while `blinkOn(arcade.screenFrame)` — a hard `setVisible`, no alpha.
  - `Continue`: full-screen `plate` rect alpha 0.6 (the hero underneath is frozen because the sim is paused), the countdown digit `Math.ceil(continueFrames / 60)` in `display16` scaled ×2 at centre, `INSERT COIN TO CONTINUE` beneath, blinking with `blinkOn`; a `continue_tick` sfx event per second boundary.
  - `GameOver`: `GAME OVER` (`display16`) centre; or `STAGE CLEAR` when `world.stage.bossDefeated`.
- [ ] **Step 2: GameScene routing**
```ts
  override update(_t: number, delta: number): void {
    if (this.paused) return;
    const input = composeInput([this.keyboard, this.gamepad]);
    const coin = input.coin && !this.prevInput.coin, start = input.start && !this.prevInput.start;
    this.prevInput = input;
    if (coin) { this.arcade = reduceArcade(this.arcade, { type: 'coin' }); this.sfx('coin'); }
    if (start) { const before = this.arcade.screen; this.arcade = reduceArcade(this.arcade, { type: 'start' });
      if (this.arcade.screen === 'PLAY' && before !== 'PLAY') { if (before === 'CONTINUE') reviveHero(this.world); else this.world = newGameWorld(Date.now() >>> 0); this.sfx('start'); } }
    if (coin && this.arcade.screen === 'PLAY' && this.world.stage.heroDead) reviveHero(this.world);   // coin-continue
    const steps = advanceFixedStep(this.fixed, delta, () => {
      this.arcade = reduceArcade(this.arcade, { type: 'tick' });
      if (this.arcade.screen !== 'PLAY') return;
      tick(this.world, input);
      this.arcade = reduceArcade(this.arcade, { type: 'score', score: this.world.score });
      for (const ev of this.world.events) {
        if (ev.type === 'heroDead') this.arcade = reduceArcade(this.arcade, { type: 'heroDead' });
        else if (ev.type === 'bossDefeated') this.arcade = reduceArcade(this.arcade, { type: 'bossDefeated' });
        else this.routeEvent(ev);   // score pops, namecards, sparks (existing code)
      }
    });
    this.renderScreens(steps);   // show/hide per arcade.screen; HUD visible in PLAY/CONTINUE; credits + creditFlash from arcade
  }
```
(`prevInput` field initialised to `EMPTY_INPUT`; on `boot` in `create()`: `this.arcade = reduceArcade(createArcade(), { type: 'boot' }); this.world = newGameWorld(1);` so ATTRACT has a world to show behind the title.) `HISCORE_ENTRY` is a pass-through until ticket 19: `renderScreens` immediately dispatches `entryDone` when the screen is `HISCORE_ENTRY` and no entry component is registered.
- [ ] **Step 3: Browser check** — boots to the title with `INSERT COIN` hard-blinking at ~1.5 Hz; `5` → counter flashes (2-frame pulse) and `PRESS START` blinks; Enter → play with `CREDIT 0`; die → dimmed frame, hero frozen down, `10…0` counting each second, coin → resumes at the same lock with full health and a brief flicker; let it hit 0 → `GAME OVER` for 3 s → back to the title. Beat the boss → `STAGE CLEAR`.
- [ ] **Step 4: Commit** `feat(adapter): attract, continue and game-over screens driven by the coin-op machine`.

**Ticket 18 verification gate:** six acceptance boxes; Vitest covers credit arithmetic, continue resume, game-over path.

---

# Ticket 19 — Hi-scores (IndexedDB) + AAA entry + attract loop with replay

**Delivers:** top-10 initials entry persisted in IndexedDB with a 1CC marker; attract cycles title → replay demo → hi-score table with ≈500 ms crossfades; the demo replay is also a golden regression test.

### Task 19.1: kv-store port with memory fallback

**Files:**
- Create: `src/shell/kv-store.ts`, `test/shell/kv-store.test.ts`

**Interfaces:**
- Produces: `interface KvStore { get<T>(key: string): Promise<T | null>; put<T>(key: string, value: T): Promise<void> }`; `openKv(dbName = 'slagcity', storeName = 'kv'): Promise<KvStore>` — resolves to the IndexedDB store, or the in-memory store when `indexedDB` is undefined or `open` rejects; `memoryKv(): KvStore`; `HISCORES_KEY = 'hiscores'`.

- [ ] **Step 1: Test (node has no indexedDB → fallback path; the IDB path is exercised by the Playwright smoke in ticket 23)**
```ts
// test/shell/kv-store.test.ts
import { describe, it, expect } from 'vitest';
import { openKv, memoryKv } from '@shell/kv-store';
describe('kv-store', () => {
  it('falls back to memory when indexedDB is unavailable and round-trips values', async () => {
    const kv = await openKv();
    expect(await kv.get('x')).toBeNull();
    await kv.put('x', { a: 1 });
    expect(await kv.get<{ a: number }>('x')).toEqual({ a: 1 });
  });
  it('memory stores are isolated per instance', async () => {
    const a = memoryKv(), b = memoryKv();
    await a.put('k', 1);
    expect(await b.get('k')).toBeNull();
  });
});
```
- [ ] **Step 2: Implement (ported from `dino-arcade-pwa/js/rom-store.js` `openDB`; picker dropped)**
```ts
// src/shell/kv-store.ts
export interface KvStore { get<T>(key: string): Promise<T | null>; put<T>(key: string, value: T): Promise<void> }
export const HISCORES_KEY = 'hiscores';

export function memoryKv(): KvStore {
  const m = new Map<string, unknown>();
  return { get: async <T,>(k: string) => (m.has(k) ? (m.get(k) as T) : null), put: async (k, v) => { m.set(k, v); } };
}

function openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName); // out-of-line keys
    };
  });
}

export async function openKv(dbName = 'slagcity', storeName = 'kv'): Promise<KvStore> {
  if (typeof indexedDB === 'undefined') return memoryKv();
  let db: IDBDatabase;
  try { db = await openDB(dbName, storeName); } catch { return memoryKv(); }
  return {
    get: <T,>(key: string) => new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly'); const req = tx.objectStore(storeName).get(key);
      req.onerror = () => reject(new Error(`kv get failed: ${req.error}`)); req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    }),
    put: <T,>(key: string, value: T) => new Promise<void>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readwrite'); tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error(`kv put failed: ${tx.error}`));
    }),
  };
}
```
- [ ] **Step 3: Commit** `feat(shell): IndexedDB key-value store ported from the old openDB pattern with a memory fallback`.

### Task 19.2: Hi-score rules and AAA entry reducer

**Files:**
- Create: `src/core/arcade/hiscores.ts`, `src/core/arcade/initials.ts`, `test/core/arcade/hiscores.test.ts`

**Interfaces:**
```ts
export interface HiScoreRow { initials: string; score: number; credits: number; stage: number; date: string /* ISO-8601 */ }
export const TABLE_SIZE = 10;
export const DEFAULT_TABLE: HiScoreRow[];             // 10 seeded rows, descending, initials like 'SLG','IRN','MLT'…, credits 1 for the top three
export function qualifies(table: HiScoreRow[], score: number): boolean;
export function insertScore(table: HiScoreRow[], row: HiScoreRow): { table: HiScoreRow[]; index: number | null };  // sorted desc, ties: newer below, cut to 10
export const rowIs1CC = (r: HiScoreRow): boolean => r.credits === 1;
export function sanitiseTable(v: unknown): HiScoreRow[];  // defensive load: invalid → DEFAULT_TABLE
// initials.ts
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .';
export interface EntryState { letters: [number, number, number]; pos: 0 | 1 | 2; done: boolean }
export function createEntry(): EntryState;            // 'AAA', pos 0
export function reduceEntry(s: EntryState, a: 'up' | 'down' | 'confirm'): EntryState;
export const entryText = (s: EntryState): string;
```

- [ ] **Step 1: Test**
```ts
// test/core/arcade/hiscores.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_TABLE, insertScore, qualifies, rowIs1CC, sanitiseTable, TABLE_SIZE } from '@core/arcade/hiscores';
import { createEntry, reduceEntry, entryText, LETTERS } from '@core/arcade/initials';

const row = (score: number, credits = 2) => ({ initials: 'TST', score, credits, stage: 1, date: '2026-09-06T00:00:00.000Z' });

describe('hi-scores', () => {
  it('default table is 10 rows, sorted descending, ISO dates', () => {
    expect(DEFAULT_TABLE).toHaveLength(TABLE_SIZE);
    expect(DEFAULT_TABLE.every((r, i, a) => i === 0 || a[i - 1]!.score >= r.score)).toBe(true);
    expect(DEFAULT_TABLE.every((r) => !Number.isNaN(Date.parse(r.date)))).toBe(true);
  });
  it('qualifies only above the 10th score; insert keeps order and cuts to 10', () => {
    const t = DEFAULT_TABLE;
    expect(qualifies(t, t[9]!.score)).toBe(false);
    expect(qualifies(t, t[9]!.score + 1)).toBe(true);
    const { table, index } = insertScore(t, row(t[0]!.score + 1));
    expect(index).toBe(0); expect(table).toHaveLength(10); expect(table[0]!.initials).toBe('TST');
    expect(insertScore(t, row(0)).index).toBeNull();
  });
  it('flags 1CC rows', () => { expect(rowIs1CC(row(1, 1))).toBe(true); expect(rowIs1CC(row(1, 2))).toBe(false); });
  it('sanitise rejects garbage', () => {
    expect(sanitiseTable(null)).toEqual(DEFAULT_TABLE);
    expect(sanitiseTable([{ initials: 'AB', score: 'x' }])).toEqual(DEFAULT_TABLE);
    expect(sanitiseTable(DEFAULT_TABLE)).toEqual(DEFAULT_TABLE);
  });
});
describe('AAA entry', () => {
  it('cycles letters with wrap, confirm advances, third confirm finishes', () => {
    let s = createEntry(); expect(entryText(s)).toBe('AAA');
    s = reduceEntry(s, 'down'); expect(entryText(s)).toBe(LETTERS[LETTERS.length - 1] + 'AA');
    s = reduceEntry(s, 'up'); s = reduceEntry(s, 'up'); expect(entryText(s)).toBe('BAA');
    s = reduceEntry(s, 'confirm'); expect(s.pos).toBe(1);
    s = reduceEntry(s, 'confirm'); s = reduceEntry(s, 'confirm');
    expect(s.done).toBe(true); expect(entryText(s)).toBe('BAA');
  });
});
```
- [ ] **Step 2: Implement** both files exactly per the interface block (`DEFAULT_TABLE` scores 50000 down to 5000 in steps of 5000; `insertScore` uses `[...table, row].sort((a, b) => b.score - a.score || (a === row ? 1 : -1))`, then `slice(0, TABLE_SIZE)` and `indexOf(row)`; `sanitiseTable` checks array length ≤ 10, each row's types, `initials` 3 chars of `LETTERS`, `score` finite ≥ 0, `credits` integer ≥ 1, `stage` integer ≥ 1, `date` parseable; `reduceEntry` wraps modulo `LETTERS.length`).
- [ ] **Step 3: Commit** `feat(core): hi-score table rules with 1CC flag and the AAA entry reducer`.

### Task 19.3: Attract demo replay — recorder, golden, attract segments

**Files:**
- Create: `src/core/arcade/attract.ts`, `public/assets/replays/attract-demo.json`, `test/replays/attract-demo.json`, `test/core/attract-golden.test.ts`
- Modify: `src/adapters/phaser/scenes/GameScene.ts` (DEV recorder), `src/core/sim/replay.ts`

**Interfaces:**
- Produces: `AttractSegment = 'title' | 'demo' | 'table'`; `ATTRACT = { titleFrames: 300, tableFrames: 360, crossfadeFrames: 30 }` (30 frames ≈ 500 ms); `attractSegmentAt(frame, demoFrames): { segment; frameInSegment; fading: boolean }`; `ReplayFile = { seed: number; inputs: number[]; hash: string }`; `runReplay` already exists; DEV recorder: key `R` starts/stops recording the encoded inputs of the current game and downloads `attract-demo.json` (`seed` = the world's seed — store `seed` on `WorldState` at `createWorld`).

- [ ] **Step 1:** Add `seed: number` to `WorldState` (set in `createWorld`). Golden test:
```ts
// test/core/attract-golden.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runReplay } from '@core/sim/replay';
import { createWorld } from '@core/sim/state';
import { STAGE1 } from '@core/stage/stage1';
describe('attract demo golden', () => {
  it('replays to the committed hash', () => {
    const g = JSON.parse(readFileSync('test/replays/attract-demo.json', 'utf8')) as { seed: number; inputs: number[]; hash: string };
    expect(g.inputs.length).toBeGreaterThan(600);
    expect(runReplay(g.seed, g.inputs, createWorld(g.seed, undefined, STAGE1)).hash).toBe(g.hash);
  });
});
```
- [ ] **Step 2: Recorder** — in `GameScene` (DEV only): `R` toggles `this.recording: number[] | null`; every PLAY tick pushes `encodeInput(input)`; on stop, `JSON.stringify({ seed: this.world.seed, inputs, hash: hashState(this.world) })` is written to `window.__replay` and logged; the engineer saves it to both paths (`public/assets/replays/attract-demo.json` for the shipped attract, `test/replays/attract-demo.json` as the golden). Record a ~25-second demo of section 1 (start a fresh game with `R` held at Start so the seed is captured from frame 0).
- [ ] **Step 3: Attract module**
```ts
// src/core/arcade/attract.ts
export type AttractSegment = 'title' | 'demo' | 'table';
export const ATTRACT = { titleFrames: 300, tableFrames: 360, crossfadeFrames: 30 } as const;
export function attractSegmentAt(frame: number, demoFrames: number): { segment: AttractSegment; frameInSegment: number; fading: boolean } {
  const lens: Array<[AttractSegment, number]> = [['title', ATTRACT.titleFrames], ['demo', demoFrames], ['table', ATTRACT.tableFrames]];
  const total = lens.reduce((n, [, l]) => n + l, 0);
  let f = frame % total;
  for (const [segment, len] of lens) { if (f < len) return { segment, frameInSegment: f, fading: f >= len - ATTRACT.crossfadeFrames }; f -= len; }
  return { segment: 'title', frameInSegment: 0, fading: false };
}
```
- [ ] **Step 4:** `npm test` (golden green) and commit `feat: attract demo replay recorder, golden and segment timeline`.

### Task 19.4: Adapter — persistence, table screen, entry screen, attract loop with crossfade

**Files:**
- Create: `src/adapters/phaser/screens/HiScoreTable.ts`, `src/adapters/phaser/screens/HiScoreEntry.ts`, `src/shell/hiscore-store.ts`
- Modify: `src/adapters/phaser/screens/Attract.ts`, `src/adapters/phaser/scenes/GameScene.ts`, `src/adapters/phaser/scenes/BootScene.ts` (load `attract-demo.json` via `this.load.json('attract-demo', '/assets/replays/attract-demo.json')` — add `type: 'json'` to `AssetEntry`)

- [ ] **Step 1:** `hiscore-store.ts`: `loadTable(): Promise<HiScoreRow[]>` (`sanitiseTable(await kv.get(HISCORES_KEY))`), `saveTable(rows)`; the kv is opened once at boot (`main.ts`), failures fall back to memory silently.
- [ ] **Step 2:** `HiScoreTable`: `display16` title `HI-SCORES`, 10 `hud8` rows `RANK  INITIALS  SCORE  1CC` with `1CC` in `gold` where `rowIs1CC`; the just-inserted row (index from `insertScore`) tinted `gold`.
- [ ] **Step 3:** `HiScoreEntry`: `ENTER YOUR INITIALS`, three `display16` letters, the active letter blinks (`blinkOn`); input edges: `up`/`down` cycle, `attack` confirms (`reduceEntry`); on `done` → `insertScore` → `saveTable` → dispatch `entryDone`. If `!qualifies(table, finalScore)` the scene skips entry (dispatches `entryDone` at once) but still shows the table for `ATTRACT.tableFrames`.
- [ ] **Step 4:** `Attract`: owns a **demo world** (`createWorld(seed, undefined, STAGE1)` from the JSON's seed) and ticks it with `decodeInput(inputs[frameInSegment])` while the segment is `demo` (the world is re-created at each demo start so the loop is identical every cycle); `EntityViews`/`Parallax`/HUD render whichever world is "current" (`attract demo` or `play`) — pass the world into the views instead of a scene field. Crossfade: a full-screen `plate` rect whose alpha steps `0 → 1 → 0` across `crossfadeFrames` at each segment boundary (≈500 ms, the one soft transition allowed by Design §4). Any `coin` at any point interrupts immediately (the machine goes to `COIN` and the attract keeps showing behind `PRESS START`).
- [ ] **Step 5: Browser check** — idle at the title 5 s → dip to black → the recorded demo plays exactly the same each cycle → dip → hi-score table (seeded rows; top three carry `1CC` in gold) → dip → title. `5` at any moment: `PRESS START` immediately. Play, die, let it time out: `GAME OVER` → entry with a blinking `A`; up/down cycle, J confirms ×3 → table with the new row in gold → reload the page → the row persists (IndexedDB, check DevTools → Application → IndexedDB → `slagcity/kv/hiscores`). In a private window with IndexedDB disabled it still works for the session.
- [ ] **Step 6: Commit** `feat: persisted hi-scores with AAA entry and a replay-driven attract loop`.

**Ticket 19 verification gate:** six acceptance boxes; Vitest covers ordering, top-10 cut, 1CC, store fallback, and the replay golden.

---

# Ticket 22 — Audio: SFX manifest, music, voice barks, unlock

**Delivers:** consistent retro SFX for every checklist beat, a chiptune/FM track each for stage, boss and title, voice barks (or a documented cut), volume persisted, unlock on first keypress, hidden-tab mute. ⛔ **Human gate: licence checks on the chosen packs.**

### Task 22.1: ⛔ Choose and licence the packs

**Files:**
- Create: `docs/audio/sources.md`, `public/assets/audio/*.ogg`, `assets/sources/audio/<pack>/LICENSE.txt`
- Modify: `assets/LICENSES.md`

- [ ] **Step 1:** Candidates (commercial use allowed, verify the licence text at the source on the day): SFX — Kenney *Impact Sounds* / *Sci-Fi Sounds* / *Interface Sounds* (CC0); music — a chiptune/FM pack on itch.io with an explicit commercial licence, or OpenGameArt CC-BY 3.0/4.0 tracks (attribution in `LICENSES.md` **and** the itch page). ⛔ Owner picks; the licence file is copied into `assets/sources/audio/<pack>/` and every shipped file gets a `LICENSES.md` row (source, licence, AI = no).
- [ ] **Step 2:** Convert to OGG Vorbis mono 44.1 kHz for SFX, stereo for music (`ffmpeg -i in.wav -c:a libvorbis -q:a 4 out.ogg`; install ffmpeg via Homebrew into `/Volumes/E Drive` if missing — `brew` default prefix is on the internal disk, so prefer a static `ffmpeg` binary downloaded to `/Volumes/E Drive/Dev/.tools/`). Loudness-normalise SFX with `-af loudnorm=I=-16` so hits sit at one level.
- [ ] **Step 3:** Commit `art: licensed SFX and music sources with provenance`.

### Task 22.2: Manifest + completeness test

**Files:**
- Create: `assets/audio/manifest.json` → copied to `public/assets/audio/manifest.json` by the build (put the file in `public/` directly; keep one copy), `test/audio/manifest.test.ts`, `src/core/arcade/audio-ids.ts`

**Interfaces:**
- Produces: `SFX_IDS` (the full list the core emits — `coin, start, hit_light, hit_heavy, hit_launch, knockdown, pickup, weapon_pickup, weapon_drop, weapon_break, namecard, continue_tick, game_over, hiscore_confirm, crate, grab, throw, special, cannon, glob, sizzle, lock, lock_release, feral_emerge, boss_tear, boss_phase2, boss_death, ladle`) and `MUSIC_IDS = ['title', 'stage', 'boss']`; manifest shape `{ "sfx": { "<id>": "sfx/<file>.ogg" }, "music": { "<id>": "music/<file>.ogg" } }`.

- [ ] **Step 1: Test**
```ts
// test/audio/manifest.test.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { SFX_IDS, MUSIC_IDS } from '@core/arcade/audio-ids';
describe('audio manifest', () => {
  const m = JSON.parse(readFileSync('public/assets/audio/manifest.json', 'utf8')) as { sfx: Record<string, string>; music: Record<string, string> };
  it('maps every sfx and music id the game emits to a file that exists', () => {
    for (const id of SFX_IDS) { expect(m.sfx[id], id).toBeDefined(); expect(existsSync(`public/assets/audio/${m.sfx[id]}`), m.sfx[id]).toBe(true); }
    for (const id of MUSIC_IDS) { expect(m.music[id], id).toBeDefined(); expect(existsSync(`public/assets/audio/${m.music[id]}`)).toBe(true); }
  });
  it('the core never emits an sfx id outside SFX_IDS', () => {
    const src = ['hero', 'gang', 'feral', 'boss', 'items'].map((f) => readFileSync(`src/core/entities/${f}.ts`, 'utf8')).join('\n')
      + readFileSync('src/core/combat/resolve.ts', 'utf8') + readFileSync('src/core/stage/hazards.ts', 'utf8') + readFileSync('src/core/stage/locks.ts', 'utf8')
      + readFileSync('src/core/weapons/heat.ts', 'utf8') + readFileSync('src/core/arcade/namecards.ts', 'utf8') + readFileSync('src/core/combat/stun.ts', 'utf8');
    for (const m2 of src.matchAll(/type: 'sfx', id: '([a-z_]+)'/g)) expect(SFX_IDS as readonly string[]).toContain(m2[1]);
  });
});
```
(`hit_${move.level}` in `resolve.ts` is a template — the three concrete ids are in `SFX_IDS`; the regex only checks literal ids.)
- [ ] **Step 2:** Write `audio-ids.ts` and the manifest; name files by id. **Commit** `feat(core): audio id contract and manifest with a completeness test`.

### Task 22.3: AudioAdapter — events → sounds, music per screen/section, volume, unlock, hidden mute

**Files:**
- Create: `src/adapters/phaser/audio/AudioAdapter.ts`
- Modify: `src/adapters/phaser/scenes/BootScene.ts` (audio entries from the manifest: fetch the JSON in `preload` via `this.load.json('audio-manifest', …)` then a second `preload` pass — or list them statically in `MANIFEST` generated by a tiny script `tools/audio/manifest-to-boot.ts` that writes `src/adapters/phaser/audio/boot-list.ts`; choose the static list — deterministic and typed), `src/adapters/phaser/scenes/GameScene.ts`, `src/shell/settings.ts` (volume already), `src/adapters/phaser/audio/unlock.ts`

**Interfaces:**
- Produces: `AudioAdapter(scene)` with `sfx(id)`, `music(id | null)` (crossfade-free hard switch; loops), `setVolume(v)`, `mute(on)`; volume keys `-` / `=` step 0.1 and persist via `setSetting('volume')`; `game.events` `HIDDEN` → `mute(true)`, `VISIBLE` → `mute(false)`.

- [ ] **Step 1: Implement** — `sfx(id)`: `this.scene.sound.play(id, { volume })` if the key exists, else a one-time `console.warn`. Music mapping in `GameScene.renderScreens`: `ATTRACT/COIN → 'title'`, `PLAY → stage.bossDoorReached ? 'boss' : 'stage'`, `CONTINUE → keep`, `GAME_OVER/HISCORE_ENTRY → null` then `game_over` sfx once. Continue ticks: `continue_tick` on each second boundary of `continueFrames`. `hiscore_confirm` on each entry confirm. Route every `sfx` sim event to `sfx(ev.id)`; `coin`/`start` are adapter-side (the machine, not the sim).
- [ ] **Step 2: Unlock** — `installAudioUnlock` (ticket 20) already resumes the context on first keypress; `AudioAdapter` checks `scene.sound.locked` before playing and drops the sound silently if still locked.
- [ ] **Step 3: Browser check** — every checklist beat audible: coin, start, light/heavy/launch hits (three distinct), knockdown, pickup, weapon break, name-card, continue tick ×10, game over, hi-score confirm; title/stage/boss music switch at the right moments; `-`/`=` adjust and persist across reload; switching tabs silences, returning restores.
- [ ] **Step 4: Commit** `feat(adapter): audio adapter mapping sim events and screens to licensed sounds`.

### Task 22.4: ⛔ Voice barks trial on Higgsfield audio

- [ ] **Step 1:** `mcp__higgsfield__generate_audio` (or `list_voices` + a gravel announcer voice): `"ROUND ONE — FIGHT"`, three hero grunts, boss taunt `"BACK TO THE FURNACE"`. Check the backing provider (reject Kling); check the tool's licence terms for shipped audio. If quality or licence fails, **cut** — record the decision in `docs/audio/sources.md` and `LICENSES.md`, and keep the `announcer_*`/`boss_taunt` ids out of `SFX_IDS`.
- [ ] **Step 2:** If kept: convert, add ids (`announcer_fight`, `hero_grunt_1..3`, `boss_taunt`) to `SFX_IDS`, emit `announcer_fight` on Start and `boss_taunt` on the boss name-card, grunts on hero `attack3`/`special` (core `sfx` events), rows + ledger. Commit `art: voice barks trialled on Higgsfield audio` (or `docs: voice barks cut — reason`).

**Ticket 22 verification gate:** five acceptance boxes; manifest test green; every audio file has a licence row.

---

# Ticket 23 — Playwright smoke + full CI

**Delivers:** an automated browser test proving the built game loads, scales to an integer, accepts coin + start, shows the hero, and logs zero console errors — in CI on every push against `vite preview`, parameterised by base URL.

### Task 23.1: Playwright on the E Drive

**Files:**
- Create: `playwright.config.ts`, `test/e2e/smoke.spec.ts`
- Modify: `package.json`, `.gitignore`, `src/main.ts` (test hook)

**Interfaces:**
- Produces: `window.__slag = { screen(): Screen; heroVisible(): boolean; scale(): number }` (read-only getters, always present — harmless, no data leaves the page); scripts `e2e` and `e2e:prod`; env `BASE_URL` (default `http://localhost:4173`).

- [ ] **Step 1: Install with browsers on the E Drive**
```bash
npm i -D @playwright/test
PLAYWRIGHT_BROWSERS_PATH="/Volumes/E Drive/Dev/.caches/ms-playwright" npx playwright install chromium
```
`package.json` scripts (local runs pin the browser path and temp dir; CI uses its defaults):
```json
"e2e": "PLAYWRIGHT_BROWSERS_PATH='/Volumes/E Drive/Dev/.caches/ms-playwright' TMPDIR='/Volumes/E Drive/Dev/.scratch/tmp' playwright test",
"e2e:prod": "BASE_URL=$PROD_URL npm run e2e -- --project=chromium"
```
`.gitignore` already ignores `test-results/` and `playwright-report/`.

- [ ] **Step 2: Config**
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test';
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';
const local = !process.env.BASE_URL;
export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  outputDir: '/Volumes/E Drive/Dev/.scratch/slag-city-e2e/test-results',
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, viewport: { width: 1600, height: 900 }, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: local ? { command: 'npm run preview', url: baseURL, reuseExistingServer: true, timeout: 60_000 } : undefined,
});
```
(On CI `outputDir` must not be the E-Drive path: guard with `process.env.CI ? 'test-results' : '/Volumes/…'`.)

- [ ] **Step 3: Test hook in `main.ts`** (after the game exists):
```ts
Object.defineProperty(window, '__slag', { value: {
  screen: () => (game?.scene.getScene('game') as GameScene | undefined)?.arcade.screen ?? 'BOOT',
  heroVisible: () => { const s = game?.scene.getScene('game') as GameScene | undefined; return !!s && s.arcade.screen === 'PLAY' && s.views.has(s.world.heroId); },
  scale: () => lastK,
}, writable: false });
```
(`EntityViews.has(id)` returns whether a view exists and is visible.)

- [ ] **Step 4: Smoke**
```ts
// test/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('boots, integer-scales, takes a coin and start, shows the hero, no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const canvas = page.locator('#screen canvas');
  await expect(canvas).toBeVisible();
  const dims = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height, cw: c.getBoundingClientRect().width, ch: c.getBoundingClientRect().height }));
  expect(dims.w % 384).toBe(0); expect(dims.h % 224).toBe(0);
  expect(dims.cw / 384).toBe(dims.ch / 224);
  expect(Number.isInteger(Math.round(dims.cw) / 384)).toBe(true);
  await page.waitForFunction(() => (window as unknown as { __slag: { screen(): string } }).__slag.screen() === 'ATTRACT', null, { timeout: 15_000 });
  await page.keyboard.press('5');
  await page.waitForFunction(() => (window as unknown as { __slag: { screen(): string } }).__slag.screen() === 'COIN');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as unknown as { __slag: { heroVisible(): boolean } }).__slag.heroVisible(), null, { timeout: 5_000 });
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});
```
Run: `npm run build && npm run e2e` — Expected: 1 passed.

- [ ] **Step 5: Commit** `test: Playwright smoke against vite preview with browsers on the E Drive`.

### Task 23.2: CI — typecheck, lint, Vitest (incl. goldens), build, smoke

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1:** Add a job after `check`:
```yaml
  e2e:
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
        env: { CI: '1' }
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }
```
The `check` job already runs `npm test`, which includes `test/replays/*.json` goldens.
- [ ] **Step 2:** Push (with the user's go-ahead) and confirm both jobs green. Commit `chore(ci): run the Playwright smoke after the unit gate`.

**Ticket 23 verification gate:** four acceptance boxes; CI green with both jobs.

---

# Ticket 24 — Deploy: Vercel + itch.io + OG tags + LICENSES audit + post-deploy smoke

**Delivers:** publicly playable at a Vercel URL and an itch.io page; link previews show the marquee; every shipped asset accounted for; a smoke test against production after each deploy. ⛔ **Human gates: deploy scope confirmed before anything goes public; itch first upload is manual; secrets are the owner's.**

### Task 24.1: LICENSES audit tool (CI gate)

**Files:**
- Create: `tools/licenses-audit.ts`, `test/tools/licenses-audit.test.ts`
- Modify: `package.json` (`audit:licenses`), `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `auditLicenses(manifestPath, publicDir): { missing: string[]; kling: string[]; incomplete: string[] }`; exit 1 if any array is non-empty. Row columns: Asset | Source | Model | Provider (backing) | Date | Prompt | Licence | AI — all eight non-empty (`—` allowed for non-AI assets' Model/Provider/Prompt).

- [ ] **Step 1: Test** with a fixture manifest + fixture public dir under the E-Drive scratch: one missing file → `missing`, one `Provider` containing `Kling` → `kling`, one blank `Licence` → `incomplete`.
- [ ] **Step 2: Implement** — parse the first Markdown table in `LICENSES.md`; list every file under `public/assets/{atlases,backgrounds,ui,fonts,audio,replays}` and `public/og.png`; an asset row "covers" a file when the row's Asset cell names the file's path (or a glob like `atlases/brawler*.png`); `kling` = rows whose Provider matches `/kling/i`. Script `"audit:licenses": "tsx tools/licenses-audit.ts assets/LICENSES.md public"`; add `- run: npm run audit:licenses` to the `check` job.
- [ ] **Step 3:** Run it; fix every gap in `LICENSES.md` (this is the S5 IP audit). Commit `chore: LICENSES audit gate — every shipped asset has provenance, no Kling provider`.

### Task 24.2: OG/Twitter tags, cache headers, Vercel project

**Files:**
- Create: `vercel.json`, `.env.example`
- Modify: `index.html`, `vite.config.ts`

- [ ] **Step 1: Tags** in `index.html` `<head>` (Vite substitutes `%VITE_SITE_URL%` at build; `.env.example` documents `VITE_SITE_URL=https://<project>.vercel.app`; Vercel env sets the real value):
```html
  <meta name="description" content="SLAG CITY — an original 90s-style arcade beat-'em-up. Free browser demo, keyboard or gamepad." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="SLAG CITY" />
  <meta property="og:description" content="Occult-industrial arcade beat-'em-up. One stage. Free in your browser." />
  <meta property="og:url" content="%VITE_SITE_URL%/" />
  <meta property="og:image" content="%VITE_SITE_URL%/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SLAG CITY" />
  <meta name="twitter:description" content="Occult-industrial arcade beat-'em-up. One stage. Free in your browser." />
  <meta name="twitter:image" content="%VITE_SITE_URL%/og.png" />
```
(Replace `SLAG CITY` with the final title from ticket 21.) Build fails loudly if `VITE_SITE_URL` is unset: add to `vite.config.ts` `if (mode === 'production' && !process.env.VITE_SITE_URL) throw new Error('VITE_SITE_URL is required for production builds (OG tags need absolute HTTPS URLs)');` using the `({ mode }) =>` config form.
- [ ] **Step 2: `vercel.json`**
```json
{
  "headers": [
    { "source": "/assets/(.*)-[A-Za-z0-9_-]{8}\\.(js|css)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/assets/(atlases|backgrounds|ui|fonts|audio|replays)/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }] },
    { "source": "/og.png", "headers": [{ "key": "Cache-Control", "value": "public, max-age=86400" }] }
  ]
}
```
- [ ] **Step 3: ⛔ Confirm scope with the owner, then link the project** — `vercel link` (or `mcp__plugin_vercel_vercel__create_git_project` once the repo has a GitHub remote), production branch `main`, previews per PR (git integration default), env `VITE_SITE_URL` set for Production and Preview (`https://<project>.vercel.app`). No Vercel Analytics, no Speed Insights.
- [ ] **Step 4:** Deploy a preview (`vercel` / `mcp__plugin_vercel_vercel__deploy_to_vercel`), open it, play coin → start. Commit `chore: OG/Twitter tags with absolute URLs, cache headers and Vercel config`.

### Task 24.3: itch.io page + butler release workflow

**Files:**
- Create: `.github/workflows/release.yml`, `docs/deploy/itch.md`

- [ ] **Step 1: ⛔ Manual first release** — `npm run build && (cd dist && zip -r ../slag-city-html5.zip .)`; on itch.io: new project, Kind = HTML, upload the zip, **"This file will be played in the browser"**, viewport **1152×672**, fullscreen button on, **AI-generated content disclosure** set (itch's "AI disclosure" field: yes, with a short note listing Higgsfield models); Classification: Game; pricing: free; add the OG image as the cover. Record the page URL and settings in `docs/deploy/itch.md`.
- [ ] **Step 2: Butler from CI on a tag** (the owner adds `BUTLER_API_KEY` as a GitHub secret; never in the repo):
```yaml
name: release
on:
  push:
    tags: ['v*']
jobs:
  itch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run check && npm run audit:licenses
        env: { VITE_SITE_URL: ${{ vars.VITE_SITE_URL }} }
      - run: npm run build
        env: { VITE_SITE_URL: ${{ vars.VITE_SITE_URL }} }
      - run: |
          curl -L -o butler.zip https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default
          unzip butler.zip && chmod +x butler && ./butler -V
      - run: ./butler push dist ${{ vars.ITCH_USER }}/${{ vars.ITCH_GAME }}:html5 --userversion ${{ github.ref_name }}
        env: { BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }} }
```
- [ ] **Step 3:** Commit `chore(release): butler push to itch.io on version tags`.

### Task 24.4: Post-deploy smoke on production + link-preview verification + stranger test

**Files:**
- Create: `.github/workflows/post-deploy.yml`, `docs/verification/24-launch.md`

- [ ] **Step 1: Workflow** (fires on Vercel's GitHub deployment status):
```yaml
name: post-deploy-smoke
on:
  deployment_status:
jobs:
  smoke:
    if: github.event.deployment_status.state == 'success' && github.event.deployment.environment == 'Production'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        env: { CI: '1', BASE_URL: ${{ github.event.deployment_status.target_url }} }
```
- [ ] **Step 2: ⛔ Production deploy** — merge/push `main` with the owner's go-ahead; wait for the smoke to go green on the production URL (this is "how we know at 3 AM": a red `post-deploy-smoke` run on `main`).
- [ ] **Step 3: Link previews** — paste the production URL into LinkedIn Post Inspector and opengraph.xyz; both must show the marquee image and title; screenshots into `docs/verification/24-launch.md`.
- [ ] **Step 4: Stranger test** — someone who has not seen the game opens both URLs cold, inserts a coin and starts, on keyboard; note anything they got stuck on. Record in `docs/verification/24-launch.md`. **Telemetry check:** `grep -ri "analytics\|gtag\|plausible\|posthog\|sentry" dist/` returns nothing; DevTools Network on the production page shows requests only to the site's own origin.
- [ ] **Step 5:** Commit `docs: launch verification — production smoke, link previews, stranger test`.

**Ticket 24 verification gate:** six acceptance boxes; S5 (audit) and S6 (live at both URLs) satisfied; post-deploy smoke green.

---

# Self-review notes (Stage 5)

- **Spec coverage:** every `tickets.md` acceptance box maps to a task above; the Discovery §7 ten-item checklist is covered by 20/21 (1), 19 (2), 18 (3, 4), 19 (5), 22 (6), 06 (7), 09/15 (8), 09 (9), 01/02/05 (10). Success criteria S1 (24 stranger + owner runs), S2 (walk-through at the QA gate), S3 (06/12 sign-offs), S4 (14 timed runs; the 1CC run is recorded during 24's launch verification with the `R` recorder), S5 (24.1), S6 (24.4).
- **Type consistency:** `Entity` fields are declared once in ticket 05 (including `cooldown`, `lockIndex`, `weaponUsePending`); `WorldState.stage` gains `stageData`, `lockFrame`, `bossDoorReached` in ticket 14 and `seed` in 19 — implementers of 14/19 add those fields in the same commit that uses them. `spawnGang(state, kind, x, y, variant = 0)` from ticket 08 onward. `POST_UPDATE_SYSTEMS` final order: `[lockSystem, hazardSystem, assignAttackTickets, resolveHits, nameCardSystem]`.
- **Known deliberate deviations from the specs:** single OFL font (decision 1); phase-2 boss recolor covers `idle/walk` via swap only (16.1); `COIN` is a machine state that overlays ATTRACT rather than a separate screen (Design §3.3 agrees).


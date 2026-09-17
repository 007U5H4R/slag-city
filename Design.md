# Design Specification (`Design.md`)

Stage 3 of the build chain · 2026-09-06 · Status: awaiting sign-off
Input: `Discovery-PRD.md` + `Solution-PRD.md` (approved), `../DESIGN.md` (cabinet/bezel/CRT/start-gate/
control spec from the prior emulator project — reused as reference, not rebuilt). This document does not
re-decide mechanics or stack: Phaser 3 + Vite + TypeScript, 384×224 internal resolution, integer scaling,
CRT post-pass are locked by `Solution-PRD.md` §2/§5.

Note on scope: this is a game cabinet UI, not a marketing funnel — sections below are adapted from the
`t-design` template accordingly (no conversion funnel, no scroll-storytelling landing page; the "conversion
goal" is the coin-op loop: attract → insert coin → play → high score → attract).

---

## 1. Executive Visual Strategy & Discovery

**Reference patterns (arcade cabinet conventions, not Mobbin app patterns):** this is a physical-cabinet
simulation, not a web app — the UI benchmark is real 90s beat-'em-up cabinets (Final Fight, Cadillacs &
Dinosaurs, Streets of Rage), not mobile/PWA onboarding flows. Carried forward verbatim from `../DESIGN.md`:
dark room → cabinet bezel → marquee art → 4:3 CRT screen → vignette; the coin-op state machine (BOOT →
ATTRACT → COIN → PLAY → CONTINUE → GAME OVER → HI-SCORE → ATTRACT); Attack/Jump/Special + Coin/Start button
semantics. New for Slag City: occult-industrial visual language replacing the dinosaur/Cadillac theme.

**Generative media (Higgsfield):** used for in-game character/background art per `Solution-PRD.md` §6
(Nano Banana Pro references → AutoSprite sheets), not for UI chrome. UI chrome (bezel, marquee frame, HUD
icons) is hand-built CSS/SVG + one marquee illustration — see §3.

**Core aesthetic:** occult-industrial CRT arcade. A foundry city where furnaces forge things that
shouldn't move; hell leaks up through the factory floor. Palette-first, low-frame-count pixel art (64
colours), scanlined and softened, cartoon-violent (sparks/oil, no blood). Every screen reads as something
a coin-op cabinet in a 1993 arcade could plausibly have rendered — no modern UI conventions (no drop
shadows beyond retro bevels, no anti-aliased vector icons, no smooth gradients wider than a dithered ramp).

**"Conversion" goal (coin-op loop, not a funnel):** ATTRACT must sell the game in under 15 seconds
(demo loop + hi-score table cycling) so a stranger inserts a coin. Every screen transition uses the same
few beats (coin chunk, "PRESS START" flash, name-card slam) so the loop feels like one coherent machine,
not a series of disconnected screens.

**Platform considerations:** desktop browser only, keyboard + gamepad — no touch targets, no safe-area
insets, no install prompts, no offline UI. The one responsive requirement is negative: **below 768px
width, show a "Desktop + keyboard/gamepad required" card and stop** — see §3.4. Above that, the canvas is
fixed-aspect (4:3) and integer-scaled; the cabinet frame around it is the only truly responsive layout
surface (it fills the browser window edge-to-edge).

---

## 2. Design Tokens & Brand System

### 2.1 The 64-colour master palette

Palette-first per `Solution-PRD.md` §6.1: generate the hero sprite + one background first, reduce jointly
to a shared 64-colour palette, hand-adjust once, freeze it in `assets/palette.json`, and quantise every
subsequent asset to it (nearest-colour, no dither, so edges stay crisp under integer scaling).

Palette *structure* (not exact hex — those are chosen during the M0 art tracer against real generated art,
per `Solution-PRD.md` milestone M0):

| Group | Slots | Role | Direction |
|---|---|---|---|
| Neutrals/grays | 8 | linework, smoke, steel | cool grays, slight blue bias (foundry steel, not paper white) |
| Skin tones | 6 | hero + gang humans | desaturated, soot-dirtied — no clean skin tones |
| Molten/fire | 8 | furnace glow, blood-substitute sparks, emissive tint | orange→yellow ramp, one hot-white highlight |
| Infernal accent | 6 | boss "tear-open" emissive, hazard glow, devil-machine eyes | magenta-red, reserved — never used for anything but danger/boss telegraph |
| Industrial base | 10 | conveyor steel, chains, catwalks, gates | desaturated blue-gray + rust-brown ramp |
| Foliage/organic | 0 | — | none — this world has no plants; if a background needs green, it's oxidised copper, not foliage |
| UI chrome | 10 | bezel, HUD frame, text plate | near-black + brass/gold trim (arcade cabinet metal, not a modern UI color) |
| HUD state | 8 | health bar (green→amber→red), weapon-heat bar (cyan→white "overheat") | reserved, never reused elsewhere so HUD state reads instantly |
| Score/pickup | 4 | scrap-gear points, lunch-pail health item | warm gold, distinct from molten-orange so pickups don't camouflage against furnace bg |
| Reserve | 4 | boss-only phase-2 recolor swap | held back until M4 |

Rule: **UI chrome and HUD-state colours are reserved slots, never reused in character/background art**, so
the eye reads "HUD" vs. "world" instantly at a glance — this is the game's one Gestalt figure-ground
anchor (`law-of-figure-ground`): the HUD is always the unambiguous foreground layer.

### 2.2 Typography

**REVISED 2026-09-17 (supersedes the bitmap-only intent below) — owner decision after the Stage-8 design
critique.** As shipped, SLAG CITY pairs a bespoke bitmap **marquee** with a **modern monospace UI face**
housed in the cyan `ScifiFrame` system, a deliberate "neo-retro" register (a modern sci-fi HUD over a
foundry world) rather than a strict 1993-cabinet reproduction. The critique flagged this as a spec↔build
gap; the owner chose to keep the shipped look and update this spec to match. The two faces are now:

- **Display/marquee face** — the hand-made molten "SLAG CITY" **logo art** (`assets/ui/marquee*.png`), plus
  the retro bitmap face (`display16`) still used for a few hard-arcade tokens (e.g. the PAUSED overlay).
- **UI/body face — `Roboto Mono` (500/700), loaded via Google Fonts** and used for the HUD (SCORE/CREDIT),
  boss HP plate, story intro, boss dialogue, chapter outro, GAME OVER / STAGE CLEAR, hi-score table + name
  entry, and menus. Monospaced so numeric columns align; rendered at `setResolution(4)` for crisp glyphs,
  legibility-weighted with a heavy stroke/shadow where it sits over busy world art. Fallback stack:
  `ui-monospace, Menlo, Consolas, monospace`.

Rationale: a true 8×8/8×16 bitmap HUD face was legibility-fragile at the 16-px HUD band and pushed the
readout toward mush (the owner's original legibility complaint in Round 4); the monospace face + cyan
frame solved legibility and gave the chrome a coherent identity. Trade-off accepted: the UI reads a touch
more "modern indie" than "arcade cabinet." *(If a future pass wants the strict-1993 look back, that is a
redesign of the chrome — treat this section as the current source of truth, not the paragraph below.)*

~~No modern web fonts. Two bitmap/pixel fonts~~ *(original intent, retained for history):* a blocky arcade
marquee font + a fixed-width pixel HUD font at an 8×8/8×16 cell. Superseded by the revision above.

No `clamp()`/fluid type scale — this isn't responsive typography, it's fixed-resolution UI type that only
ever renders at the internal resolution and scales with the canvas. Sizes are fixed in code (rem: N/A).

### 2.3 Spacing & grid

The internal canvas is a fixed 384×224 pixel grid — there is no fluid spacing token system inside it;
every HUD element is placed on whole-pixel coordinates, snapped to an 8px grid (matches the tile/sprite
grid used by `build-atlas.ts`) so nothing subpixel-jitters when integer-scaled. Outside the canvas (the
cabinet DOM shell in `src/shell/`), the bezel/marquee frame uses ordinary CSS flex/grid to center and
scale the canvas responsively — that layer *can* use relative units, since it's the only part of the UI
that isn't pixel-locked. Corner radius: **zero**, everywhere inside the canvas (this is a CRT/arcade
aesthetic, not a rounded modern UI); the cabinet bezel photo/illustration may have its own physical
rounded-corner look, but that's baked into the bezel art asset, not a CSS token.

---

## 3. Component Architecture & Spatial Layout

### 3.1 Cabinet shell (outside the canvas)

Layered, back to front, per `../DESIGN.md`'s reused structure:

1. **Dark room** — full-viewport near-black background (very slight vignette-adjacent color, not pure
   `#000`) so the cabinet doesn't look like a floating rectangle on white.
2. **Cabinet bezel** — a single illustrated frame asset (art-directed, see §3.5) surrounding the 4:3
   canvas: side art panels (occult-industrial motif — rivets, chains, furnace glow bleeding from the
   edges), control-panel suggestion at the bottom (not interactive — just sets the scene).
3. **Marquee** — the game logo art (also doubles as the 1200×630 OG image, see §3.6) sits above the
   bezel, lit as if by a marquee lamp (a soft warm glow gradient behind it, CSS only, cheap).
4. **4:3 canvas** — the Phaser render target, 384×224 internal, integer-scaled (×3 at 1080p, ×4 above,
   per `Solution-PRD.md` §5).
5. **Vignette** — a radial darkening overlay at the canvas edges (CSS or a Phaser post-pass, whichever is
   cheaper — recommend CSS since it doesn't need to survive screenshot/replay determinism).

Centering/scaling math (`/better-layout`): the shell computes the largest integer scale factor `k` such
that `384k ≤ viewportWidth` and `224k ≤ viewportHeight` (minus fixed bezel chrome height), floors it,
never scales non-integer, and centers the result. Recompute on resize (per `Solution-PRD.md` §8 failure
handling: "Resize → recompute integer scale").

**Fitts's-law note:** there are no clickable UI targets inside the canvas (this is a keyboard/gamepad
game — no mouse target sizing applies to gameplay). The only clickable surface in the entire shell is the
CRT on/off toggle key binding (not a mouse target) and, on the ≤768px card (§3.4), zero interactive
elements — it's a static message, deliberately not a UI to optimize.

### 3.2 HUD (in-canvas, always foreground layer)

Fixed positions, top strip of the 384×224 frame (reserve ~16px of vertical height at the top so it never
overlaps the walkable band):

| Element | Position | Detail |
|---|---|---|
| Health bar | top-left | segmented bar, green→amber→red as it depletes (reserved HUD-state colours, §2.1); no numeric HP shown — arcade convention is a bar, not a number |
| Score | top-center-left | 6-digit, zero-padded, HUD/body pixel font, increments with a brief digit-roll on pickup |
| Credits | top-right | "CREDITS 0" through the coin-insert flow; flashes once on each coin accepted |
| Weapon-heat | bottom-left, only visible while holding a salvage weapon | cyan→white bar counting down remaining hits (6 for arm-cannon, 8 for blade-limb per `Solution-PRD.md` §3); flashes red + a one-frame shake on the final hit before it breaks |
| Name-cards | center screen, transient overlay | full-width banner (foreground of the foreground) on first enemy-type appearance and boss entrance; uses the display/marquee font; slams in from the side with a hitstop-style pause, per `../DESIGN.md`'s "name-card flash" convention and `Solution-PRD.md` §4 |

Perceptual weighting (`/visual-hierarchy`, `law-of-similarity`): health/score/credits share one visual
"HUD plate" style (dark plate + brass border) so they read as one group even though they're spatially
separated across the top strip — proximity alone won't group them (they're far apart), so **shared
appearance carries the grouping** instead.

### 3.3 Screens

All screens render inside the same 384×224 canvas (no separate DOM screens except the ≤768px card, which
is pre-canvas). State machine per `Solution-PRD.md` §5: `BOOT → ATTRACT → COIN → PLAY → CONTINUE → PLAY |
GAME OVER → HI-SCORE ENTRY → ATTRACT`.

- **Title/Attract** — logo art (shared with marquee) fades in over a foundry-district background loop;
  after ~5s, cross-fades into a recorded input-log demo replay (per `Solution-PRD.md` §5 determinism —
  the attract demo *is* gameplay, not a separate cutscene); cycles demo → hi-score table → title on a
  loop until a coin is inserted. "INSERT COIN" flashes at ~1.5Hz over all of it, MAME-convention.
- **Insert-Coin / Coin-accepted** — no separate screen; a coin chunk SFX + credits-counter flash +
  "PRESS START" flash overlaid on whatever ATTRACT frame is showing (real cabinets don't interrupt the
  attract loop for this).
- **Continue** — full-screen dim overlay, hero's knockdown frame frozen center-screen, giant countdown
  digit 10→0 (display font), "INSERT COIN TO CONTINUE" beneath; on 0 with no coin, cuts straight to Game
  Over (no separate transition screen).
- **Hi-score entry (AAA)** — three-letter cycling entry (up/down per letter, Attack = confirm-and-advance,
  per the existing Attack/Jump/Special mapping — no new control scheme), the just-earned score highlighted
  in the reserved score/pickup gold, credits-used shown alongside (feeds the 1CC flag per `Solution-PRD.md`
  §3).
- **SERVICE** — arcade-diagnostic-style plain text screen (per `Solution-PRD.md` §8 failure handling):
  monospace HUD font on black, states the failed asset id, a retry key, and (dev-only, stripped in prod
  build) a console-error pointer. Deliberately ugly/technical — this screen should look like something
  went wrong, not like a designed empty state.

### 3.4 The ≤768px "desktop required" card

Pre-canvas DOM, shown instead of the cabinet shell when `viewportWidth ≤ 768px` (checked on load and on
resize/orientation-change — a phone rotated to landscape at typical widths is still ≤768px logical width,
so it correctly still gates). Static, single-purpose, no interactivity:

```
┌───────────────────────────────┐
│         [marquee logo,        │
│          small]               │
│                                │
│   Desktop browser required    │
│   Keyboard or gamepad only —  │
│   this cabinet doesn't run    │
│   on phones.                  │
│                                │
│   Visit on a desktop browser  │
│   to play.                    │
└───────────────────────────────┘
```

Dark-room background continues (so it doesn't look broken, just gated), centered card in the HUD/body
pixel font at a readable non-scaled size (this text is regular DOM/CSS, not canvas-locked, so it can use
a normal readable rem size — do not force it onto the pixel grid). No horizontal scroll: card width
`min(90vw, 420px)`, no fixed pixel width larger than the smallest supported viewport.

### 3.5 Character & background art direction

**Hero — the industrial exorcist:** sledgehammer-wielder, soot-and-oxblood coat over practical
foundry-worker gear (aprons, wrapped forearms, a hand-forged ward/talisman visible at the collar — the
one clear tell that he *understands* what the machines are, per `Discovery-PRD.md` §4). Silhouette must
stay readable at 64px sprite height doing a sledgehammer swing — broad shoulders, a long weapon arc.

**Gang ×3 (palette swaps + silhouette variety, not just recolors):**
- *Brawler* — bulky, bare-knuckle stance, patched factory coveralls.
- *Knife* — lean, fast silhouette, one raised-knife read from any frame.
- *Heavy* — widest silhouette, visible wind-up tell (super-armour frames must be readable as "don't
  interrupt this" even before frame-data confirms it).

**Feral devil-machine:** non-humanoid silhouette (explicitly `is_humanoid: false` for AutoSprite), reads
as "wrong" next to the human-shaped roster — four-legged or insectoid foundry-scrap chassis with visible
molten-seam glow (reserved infernal-accent palette slots), no face the player can read as friendly.

**Boss — "the Foreman" (working name, per `Solution-PRD.md` §3):** devil-mech, between war-mech and
gargoyle, horns + furnace-glow chest + molten seams. Phase-1 silhouette must be readable as "big and slow"
at a glance (wide stance, heavy limbs); the phase-2 "tear-open" recolor (reserved palette slots, §2.1)
must be the *same* silhouette with only an emissive tint swap + a torn-off arm socket — no redesign, so
the transition itself communicates escalation rather than being an unrelated new sprite.

**Backgrounds — three stage sections, each with sky/far, mid, ground parallax layers per
`Solution-PRD.md` §6.5:**
1. *Foundry Gates* — night skyline, smokestacks silhouetted against a molten-orange horizon glow,
   chain-link fencing in the mid layer.
2. *Conveyor Floor* — interior, moving belts and molten channel as ground-layer hazards (art must clearly
   telegraph "touch = knockdown" — a visible orange glow strip, not a subtle texture change).
3. *Furnace Hall* — catwalks + telegraphed ladle-pour zones (ladle silhouette visible in the mid layer
   *before* it pours, giving the player a readable tell — this is a gameplay-critical readability
   requirement, not just art).

### 3.6 Nano Banana Pro / AutoSprite prompt templates

Per `Solution-PRD.md` §6.2–§6.3, palette-first, hero-reference-first pipeline.

**Character reference prompt template (Nano Banana Pro, 2 cr each, 2–4 candidates):**
```
[CHARACTER NAME], [role: hero/gang-brawler/gang-knife/gang-heavy/feral-machine/boss],
side three-quarter view, full body, neutral standing pose, flat neutral-gray background,
1993 side-scrolling arcade beat-'em-up character design, occult-industrial foundry setting,
[palette direction: soot-dirtied desaturated tones / molten-orange emissive accents /
reserved infernal-red for boss+hazards only], cartoon-arcade proportions, no blood,
no real-world brand or trademarked likeness, clean silhouette readable at small scale.
Reference: [hero reference image, passed as image_references, for every non-hero character
to lock a consistent art style].
```
For the feral machine, append: `non-humanoid, four-legged/insectoid scrap-metal chassis,
visible molten seams, no face, mechanical silhouette distinct from all humanoid characters`.

**AutoSprite per-action template:**
```
Preset: [idle | walk | attack | jump | custom]
Action (custom only): [combo2 | combo3 | grab | throw | hurt | knockdown | getup |
  weapon-swing | cannon-fire | special]
frame_count: 4–8 (match the low-frame-count 90s convention — 6-frame walk, 3-frame punch)
frame_size: 256
is_humanoid: true (false for feral machine)
Reference: [character reference sheet from the Nano Banana Pro step]
```
First AutoSprite run (part of milestone M0) records the real cost per run and identifies the
backing provider — **reject and re-run on a different preset/provider if it resolves to a
Kling-backed model** (legal rule, `Solution-PRD.md` §6.8 — no exceptions for shipped assets).

**Background prompt template (21:9, one gen per parallax layer):**
```
[Stage section name] — [sky/far | mid | ground] parallax layer, occult-industrial foundry,
1993 arcade beat-'em-up background art style, [section-specific detail from §3.5],
seamless horizontal tiling suitable for side-scroll looping, muted industrial palette with
molten-orange accent lighting, no real-world brand or trademarked structure.
```
Ground layers get a manual seam check after downscale/quantise (per `Solution-PRD.md` §6.5) — a
visible seam at the loop point fails review and gets regenerated, not patched.

### 3.7 CRT look

Phaser PostFX pipeline (per `Solution-PRD.md` §5), applied to the 384×224 render target before upscale:
scanlines (subtle — thin dark horizontal lines at the sub-pixel rate, not a heavy black-bar overlay that
would fight the integer scaling), a slight barrel/curvature distortion (cheap vertex-shader bulge, not a
literal lens-distortion filter that would blur HUD text), and a soft phosphor-bleed blend between adjacent
pixels (this **is** the "softening" requirement the owner carries from the old project's
`crt-mattias`-shader precedent in `../DESIGN.md` — same intent, reimplemented natively in Phaser rather
than reusing EmulatorJS's shader, since there's no emulator core here). Toggle key turns the whole pass
off instantly (falls back to crisp integer-scaled pixels, no smoothing) — this satisfies both the
"authentic 90s checklist" item #10 (no smoothing except the CRT pass) and gives a clean fallback if the
pass is expensive on a low-end GPU.

### 3.8 The 1200×630 OG image

Reuses the marquee logo art (§3.1) as its hero element — do not commission a separate asset. Composition:
marquee logo centered/left-weighted on a foundry-glow background (a crop of the Foundry Gates far-layer
background art works), enough negative space on the right for the logo's own lighting to read at
thumbnail size in a link preview. Export as a flat PNG (no CRT scanline pass baked in — link previews
render small; scanlines would just read as noise at that scale). Absolute HTTPS URL once deployed;
verified via LinkedIn Post Inspector + opengraph.xyz per the global Web & UI Deliverables gate.

---

## 4. Motion & Micro-Interactions Spec

Game-feel motion (hitstop, launch, screen shake) is **gameplay data, not UI motion** — it's fully
specified as frame-count numbers in `Solution-PRD.md` §3 ("Hit-feel numbers: hitstop 3/5/8 frames...")
and belongs in `core/combat/`, not this design doc; repeating it here would create a second source of
truth. This section covers only *UI-shell* motion — the parts outside the deterministic sim.

- **Coin-insert flash:** credits counter — scale pulse 1.0 → 115% → 1.0, 2 frames total (matches the
  light-hit hitstop feel so the whole cabinet feels like one motion language), no easing library needed
  (hand-stepped sprite-frame scale, consistent with everything else being frame-stepped, not tweened).
  Reason for zero easing curve: this is a pixel-art cabinet sim — a smooth cubic-bezier scale would look
  like a modern web transition dropped into a CRT screen, breaking the illusion.
- **Name-card slam-in:** slides in from off-screen at a constant high velocity over 6 frames, holds 24
  frames, slides out over 4 frames — deliberately linear/constant-velocity, not spring-eased (arcade
  name-cards snap, they don't bounce).
- **PRESS START flash:** hard on/off visibility toggle at 1.5Hz (no fade) — matches real cabinet
  convention; a fade would read as a modern UI affordance.
- **Attract → demo replay crossfade:** the one place a soft crossfade is appropriate (≈500ms opacity
  cross-dissolve), since real cabinets do dip-to-black between attract-mode segments and a hard cut here
  would feel like a bug, not a stylistic choice.
- **Reduced motion:** N/A in the accessibility sense (no `prefers-reduced-motion` media query applies
  inside a fixed-frame-rate game canvas), but the CRT-toggle key doubles as the game's own "reduce visual
  intensity" affordance — document it as such in the SERVICE/help text rather than adding a separate
  settings toggle (`Solution-PRD.md` explicitly limits persisted settings to CRT + volume).

---

## 5. Accessibility & QA Checklist

WCAG AAA framing doesn't map cleanly onto a fixed-palette pixel-art arcade cabinet (e.g., contrast-ratio
math against a hand-tuned 64-colour palette is a different exercise than against a CSS design-token
scale) — audit against what's actually controllable and actually matters for this game:

- [ ] **HUD contrast:** health/score/credit text plates hold a readable contrast ratio against every
      background the HUD can appear over (test against the darkest and brightest background frames in
      each of the 3 stage sections + the boss furnace pit) — HUD chrome uses reserved palette slots
      specifically so this doesn't drift per-background.
- [ ] **Colorblind-safe HUD state:** the health bar's green→amber→red and the weapon-heat bar's
      cyan→white ramps must remain distinguishable under a deuteranopia/protanopia simulation (test with
      a colorblindness simulator on the exported palette) — add a shape/fill-level cue (bar length) as
      the primary signal, colour as secondary, since bar length already does the job independent of hue.
- [ ] **Name-card and countdown legibility:** display-font text at in-canvas scale must be readable at
      the smallest supported integer scale factor (×3 at 1080p) — verify on an actual 1080p viewport, not
      just at higher scale factors.
- [ ] **No horizontal scroll** on the ≤768px card at any width down to 320px logical.
- [ ] **Keyboard-only and gamepad-only completeness:** every screen (including hi-score AAA entry and the
      SERVICE screen's retry action) must be operable from keyboard alone and from gamepad alone — no
      mouse-only affordance exists anywhere, so this is really "no screen silently requires a control
      scheme the player isn't using."
- [ ] **Focus/attention anchor per screen:** each screen has exactly one primary read-first element per
      the `/visual-hierarchy` pass (ATTRACT → logo; CONTINUE → countdown digit; HI-SCORE ENTRY → the
      cycling letter being edited) — verify nothing competes with it in size/contrast.
- [ ] **CRT-off fallback readability:** every screen must remain fully legible with the CRT pass toggled
      off (scanlines/phosphor-bleed must be pure enhancement, never load-bearing for readability).
- [ ] **Responsive integer-scale correctness:** resize the browser window continuously through several
      breakpoints and confirm the canvas only ever jumps between integer scale factors (never
      fractional/blurry) and re-centers correctly, per `Solution-PRD.md` §8.

This checklist is additive to — not a replacement for — the Discovery §7 "authentic-90s checklist" (10
items, already tracked as success criterion S2) and the QA-tester phase gates defined in the build
workflow's Execution stage.

---

## Open items carried to Stage 4 (Problem Breakdown)

- Exact palette hex values — deferred to milestone M0 (art tracer), per `Solution-PRD.md`; this doc fixes
  the palette's *structure* (10 groups, reserved HUD slots) but not final colours.
- Hero name, boss final name, final game title — still open per `HANDOFF.md`; this doc uses "the
  industrial exorcist" / "the Foreman (working name)" throughout, consistent with the PRDs.
- Licensed bitmap/pixel font selection (display + HUD faces) — pick and licence-check at ticket time.
- Marquee logo's final composition is described (§3.1, §3.8) but not produced — first real Higgsfield
  generation happens in Stage 6 (Execution, milestone M0), not this stage.

# Tickets — SLAG CITY (working title)

Stage 4 of the build chain · 2026-09-06 · Status: approved
Inputs: `Solution-PRD.md`, `Design.md`, `Discovery-PRD.md`. Consolidated planning artifact for Stage 5;
per-ticket tracker copies live at `.scratch/slag-city/issues/NN-*.md` (see `docs/agents/issue-tracker.md`).
Tickets are tracer-bullet vertical slices in dependency order — blockers first. Every ticket that spends
Higgsfield credits carries a **human gate**: the owner's credit ceiling must be set before it starts.

## 01 — Scaffold + core/adapter boundary + CI baseline

**What to build:** Running `npm run dev` opens a page showing a blank 384×224 canvas integer-scaled inside a dark room. Typecheck, lint, unit tests and build all pass locally and in CI on every push.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Phaser 3 + Vite + TypeScript project boots to a 384×224 canvas at the largest integer scale that fits the viewport, centred, re-computed on resize
- [ ] A lint rule forbids any Phaser import inside the pure-TS core; a deliberate violation fails lint
- [ ] Vitest runs a trivial core test in Node without Phaser
- [ ] CI workflow runs typecheck + lint + Vitest + build and is green
- [ ] Node/npm caches and any temp output are configured to live on the E Drive, not the internal disk

## 02 — CRT PostFX pipeline + toggle key

**What to build:** The canvas is rendered through a CRT pass — subtle scanlines, slight barrel curvature, soft phosphor bleed between neighbouring pixels — and a single key turns it off instantly, falling back to crisp integer-scaled pixels.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A test pattern (checkerboard + text) is visibly softened with the pass on and pixel-crisp with it off
- [ ] Toggle state persists in localStorage and is read defensively on boot
- [ ] Toggling does not change canvas size, scale or position
- [ ] When WebGL is unavailable the game falls back to the Canvas renderer with the pass off and a one-line notice

## 03 — Art tracer (M0): hero reference → AutoSprite walk + attack → atlas → in-engine

**What to build:** A generated hero walks and swings a sledgehammer on the 384×224 canvas under the CRT pass. This kills the riskiest assumption — AI frame-to-frame consistency — and measures AutoSprite's real cost and provider before any other art is commissioned. **Human gate:** owner's Higgsfield credit ceiling set; owner accepts the on-screen quality.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Hero reference generated with the `Design.md` character prompt template; chosen candidate and its prompt logged in `LICENSES.md`
- [ ] AutoSprite `walk` (6 frames) and `attack` (3–4 frames) sheets generated from that reference
- [ ] A build-atlas tool crops/trims, downscales the hero to ~64 px tall, quantises to a provisional palette with no dither, and emits a Phaser atlas
- [ ] The hero plays walk and attack loops in-engine; frames do not visibly "swim" at 384×224
- [ ] AutoSprite cost per run and the backing provider are recorded; the run is rejected if the provider is Kling-backed
- [ ] Sources and outputs are committed; `LICENSES.md` exists with the manifest columns from `Solution-PRD.md`

## 04 — Master palette lock: Foundry Gates backgrounds + palette.json; hero re-quantised

**What to build:** The first stage section has real sky / mid / ground parallax layers, the 64-colour master palette is frozen from hero + background together, and the hero is re-quantised to it. Every later asset quantises to this palette. **Human gate:** spends credits.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Three 21:9 layers generated with the `Design.md` background template for section 1 (night skyline, smokestacks, chain-link, the gate)
- [ ] `palette.json` holds exactly 64 colours, structured into the `Design.md` §2.1 groups with the UI-chrome and HUD-state slots reserved and documented
- [ ] Hero and background both quantise to the palette with no visible banding or colour drift; owner signs off the look
- [ ] Ground layer loops horizontally with no visible seam
- [ ] All generations logged in `LICENSES.md`

## 05 — Deterministic sim + hero locomotion + keyboard & gamepad

**What to build:** A placeholder-box hero walks, changes depth and jumps on the belt plane at a fixed 60 Hz, driven by keyboard or gamepad, and the same input log always produces the same world state.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Fixed-step loop with a capped accumulator; sim pauses while the tab is hidden
- [ ] Hero idle / walk / jump driven by an `InputFrame` from a frame-data table, with `y` clamped to the walkable band and draw order by `y`
- [ ] Keyboard: arrows/WASD move, J/K/L = Attack/Jump/Special, Enter = Start, 5 = Coin
- [ ] Gamepad: d-pad/stick, West/South/East = Attack/Jump/Special, Start, Select = Coin; disconnect pauses with "CONTROLLER DISCONNECTED", reconnect or keypress resumes
- [ ] Vitest determinism test: replaying a recorded input log yields an identical state hash
- [ ] Seeded RNG is the only randomness source in core

## 06 — Combat tracer: 3-hit combo vs one brawler, with hit-feel

**What to build:** The hero fights one brawler with a three-hit combo; hits land with hitstop, screen shake, a white flash and a launch on the third hit; the brawler is hurt, knocked down and gets up invulnerable. This is the first "does it feel like 1993?" read, on boxes.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Attack1→2→3 chain with an input buffer; timings and hitbox rects come from the frame-data table, not code
- [ ] Hit rule: hitbox/hurtbox overlap in x/z **and** |Δy| ≤ 8 px — unit-tested at the boundary
- [ ] Hitstop 3 / 5 / 8 frames (light / heavy / launch), 2-px shake on heavy, 2-frame white flash on the victim, pushback — all from one hit-feel config
- [ ] Brawler FSM: idle / approach / attack / hurt / knockdown / getup (invulnerable); it can hit the hero back
- [ ] Vitest: hit 3 launches; hitstop durations; getup invulnerability
- [ ] Debug overlay toggles hitbox / hurtbox rendering

## 07 — Full hero FSM: grab→throw, jump attack, special, hurt / knockdown / getup

**What to build:** The hero has the complete 90s move-set: walking into a stunned enemy grabs, then throws; a jump attack; a health-cost crowd-clearing special; and the hero's own hurt → knockdown → invulnerable getup → dead path.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Grab triggers automatically on walking into a stunned enemy; Attack throws, the thrown enemy knocks down others it hits
- [ ] Jump attack has its own frame data and hitbox
- [ ] Special costs health, hits all enemies in range, cannot be used at ≤ its cost
- [ ] Hero hurt / knockdown / getup mirror the enemy path; health 0 → dead state, which the shell can observe
- [ ] Vitest covers grab conditions, special health cost and the dead transition
- [ ] All states remain data-driven from the frame-data table

## 08 — Gang trio + attacker-ticket AI

**What to build:** Three gang types fight the hero as a group — brawler, fast low-HP knife, and a heavy with super-armour on wind-up — and at most two ever attack at once while the rest circle at distance.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Knife and heavy FSMs added beside the brawler with distinct speed / HP / damage from data
- [ ] Heavy ignores hitstun during its wind-up frames but still takes damage
- [ ] Group AI hands out at most two attacker tickets; others hold a ring position and rotate in when a ticket frees
- [ ] Vitest: ≤2 attackers at any tick across a 5-enemy fight; ticket released on knockdown / death
- [ ] Palette-swap hook per gang instance is in place (used by 13)

## 09 — HUD, score pop-ups, pickups + breakable crates, name-cards

**What to build:** The top strip shows health, a six-digit score and the credits counter on reserved-palette plates; hitting things pops score numbers; crates break open to drop a lunch pail (health) or scrap gears (points); the first appearance of each enemy type slams a name-card across the screen.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] HUD elements sit on whole-pixel, 8-px-grid positions in a 16-px top band and use only the reserved UI-chrome / HUD-state palette slots
- [ ] Health bar shifts green → amber → red by fill level; bar length is the primary cue
- [ ] Score pop-ups spawn at the hit point and rise for a fixed frame count
- [ ] Breakable crate entity; lunch pail restores health, scrap gear adds points; both are walk-over pickups
- [ ] Name-card: slides in at constant velocity over 6 frames, holds 24, exits over 4; fires once per enemy type per game
- [ ] Vitest: score arithmetic, health clamp, name-card once-per-type rule

## 10 — Feral machine (neutral hazard) + arm-cannon drop

**What to build:** A feral devil-machine bursts from a wall vent and pounces on the nearest body — hero or gang — damaging whoever it lands on; both sides can kill it, and it drops an arm-cannon when it dies.

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] Targets the nearest body by distance with no faction preference; retargets when its target dies
- [ ] Pounce has telegraph frames and a hitbox that damages gang and hero alike
- [ ] Gang AI treats the feral as a threat (it can be knocked back / killed by gang attacks)
- [ ] On death spawns an arm-cannon pickup entity (consumed by 11)
- [ ] Vitest: nearest-body targeting is side-agnostic; gang damage kills it; drop spawns exactly once

## 11 — Salvage weapons + weapon-heat HUD

**What to build:** Standing over a dropped weapon and pressing Attack picks it up; the arm-cannon fires six shots then overheats and breaks in sparks, the blade-limb swings eight times then breaks; a knockdown drops whatever the hero holds; a bottom-left heat bar counts remaining uses and flashes on the last one.

**Blocked by:** 07, 09, 10

**Status:** ready-for-agent

- [ ] Hero weaponAttack state with distinct frame data for cannon (ranged projectile) and blade (melee)
- [ ] Heat counters: cannon breaks after shot 6, blade after hit 8; break spawns a spark effect and removes the weapon
- [ ] Knockdown drops the held weapon as a pickup; it can be re-picked with its remaining heat
- [ ] Weapon-heat bar appears only while holding a weapon, uses the reserved cyan→white slots, flashes red + 1-frame shake on the final use
- [ ] Vitest: breaks at exactly 6 / 8; drop-on-knockdown preserves remaining heat

## 12 — Hero sprites wired to the full FSM

**What to build:** Every hero action from tickets 05, 07 and 11 plays on real generated frames instead of boxes, quantised to the master palette. **Human gate:** spends credits.

**Blocked by:** 04, 07

**Status:** ready-for-agent

- [ ] AutoSprite sheets for idle, jump, combo2, combo3, grab, throw, hurt, knockdown, getup, jump-attack, weapon-swing, cannon-fire, special (walk and attack1 reuse 03)
- [ ] All sheets through build-atlas against `palette.json`; frame origins aligned so the hero's feet do not slide between states
- [ ] Hitbox / hurtbox rects in the frame-data table re-checked against the real frames
- [ ] Every generation logged in `LICENSES.md`
- [ ] Owner play-tests and signs off the hero's look in motion

## 13 — Gang + feral sprites wired

**What to build:** The three gang types and the feral machine appear on real frames — gangs sharing one base sheet with palette-swap variants, the feral on its own non-humanoid sheet. **Human gate:** spends credits.

**Blocked by:** 04, 08, 10

**Status:** ready-for-agent

- [ ] Gang references generated with the hero reference as the style anchor; three silhouettes readable at a glance (bulky / lean-with-knife / widest)
- [ ] Feral reference generated with `is_humanoid: false`; sheets for idle, move, pounce, hurt, death
- [ ] Gang sheets for idle, walk, attack, hurt, knockdown, getup (heavy adds wind-up)
- [ ] Palette-swap variants applied via the hook from 08 without extra generations
- [ ] Everything through build-atlas; hitboxes re-checked; `LICENSES.md` updated

## 14 — Stage 1 layout: three sections, scroll-locks, spawn tables, hazards, camera

**What to build:** The hero walks the full Foundry District: Foundry Gates → Conveyor Floor (belts push, molten channel knocks down, chain hoists) → Furnace Hall (telegraphed ladle pours, catwalks) → the boss door, with scroll-locked fights from data tables, and a competent run takes 6–8 minutes. Backgrounds beyond section 1 may be flat placeholders.

**Blocked by:** 08, 10, 11

**Status:** ready-for-agent

- [ ] Camera scrolls on x, locks at fight points, releases when the spawn table for that lock is cleared
- [ ] Spawn tables for all three sections match `Solution-PRD.md` §4 (counts / types per fight; first feral from a wall vent in section 2; two ferals at once in section 3)
- [ ] Conveyor belts push entities along x while inside their y-band; the molten channel knocks down anything touching it from any side
- [ ] Ladle pours show a visible tell for a fixed frame count before the damage frames
- [ ] Two timed runs by the owner land between 6 and 8 minutes to the boss door
- [ ] Vitest: scroll-lock release condition; belt push; channel knockdown

## 15 — Boss "the Foreman": both phases, tear-open, blade-limb drop

**What to build:** In the furnace pit the devil-mech fights as a slow heavy brawler; at 50 % HP it tears itself open, becomes 1.3× faster with an emissive tint, throws molten globs, and rips off its own blade arm — which lands as a pickup the hero can use against it.

**Blocked by:** 08, 11

**Status:** ready-for-agent

- [ ] Phase 1: swing and ground-pound with telegraphs; super-armour on wind-up
- [ ] Transition at 50 %: invulnerable tear-open animation, then phase 2 speed multiplier, tint flag and projectile attack
- [ ] Blade-limb pickup spawns at the transition and behaves per ticket 11 (8 hits)
- [ ] Boss name-card flashes on entry; defeat ends the stage and signals the shell
- [ ] Vitest: phase transition at exactly 50 %; blade spawns once; projectile respects the depth rule

## 16 — Boss sprites wired (incl. phase-2 emissive recolor)

**What to build:** The Foreman appears on real ~120-px frames; phase 2 is the same silhouette with the reserved emissive slots swapped in and a torn arm socket. **Human gate:** spends credits.

**Blocked by:** 04, 15

**Status:** ready-for-agent

- [ ] Boss reference generated (horns, furnace-glow chest, molten seams; nothing recognisably Transformers); sheets for idle, walk, swing, ground-pound, hurt, tear-open, phase-2 idle/walk/throw, death
- [ ] Phase-2 recolor uses the four reserve palette slots via tint, not a second sheet
- [ ] Through build-atlas at ~120 px; hitboxes re-checked; `LICENSES.md` updated
- [ ] Owner signs off the boss in motion

## 17 — Remaining backgrounds: Conveyor Floor, Furnace Hall, boss pit

**What to build:** Sections 2 and 3 and the boss pit get their real parallax layers, with hazards drawn so they read as hazards. **Human gate:** spends credits.

**Blocked by:** 04, 14

**Status:** ready-for-agent

- [ ] Sky/mid/ground layers per section via the background template, quantised to `palette.json`
- [ ] Molten channel is an unmistakable orange glow strip; ladle silhouettes are visible in the mid layer before pours
- [ ] Ground layers loop without seams; layer scroll ratios set per section
- [ ] `LICENSES.md` updated

## 18 — Coin-op state machine + credits economy

**What to build:** The game behaves like a cabinet: it boots to an attract title, coin (5 / Select) adds a credit with a counter flash, Start consumes one and begins play, death shows a 10-second continue countdown that resumes in place on a coin, and running out goes to Game Over.

**Blocked by:** 09, 14

**Status:** ready-for-agent

- [ ] Screen states BOOT → ATTRACT → COIN → PLAY → CONTINUE → PLAY | GAME OVER implemented as an explicit machine outside the sim
- [ ] Unlimited coin inserts; Start requires ≥1 credit; one life per credit
- [ ] Continue overlay: dimmed frame, hero's knockdown pose, countdown digit, "INSERT COIN TO CONTINUE"; coin resumes at the current scroll-lock; 0 → Game Over
- [ ] "INSERT COIN" / "PRESS START" hard-blink at ~1.5 Hz with no fade
- [ ] Credits used this game are tracked for the 1CC flag
- [ ] Vitest: credit arithmetic, continue resume, game-over path

## 19 — Hi-scores (IndexedDB) + AAA entry + attract loop with replay

**What to build:** Game Over on a top-10 score opens a three-letter initials entry; the table persists in IndexedDB across reloads with a 1CC marker; the attract mode cycles title → a recorded gameplay replay → the hi-score table until a coin drops.

**Blocked by:** 18

**Status:** ready-for-agent

- [ ] Generic key-value store over IndexedDB (ported from the old project's `openDB` pattern) with an in-memory fallback when unavailable
- [ ] Row shape `{ initials, score, credits, stage, date: ISO-8601 }`; seeded default table; sorted top-10; credits = 1 shows the 1CC flag
- [ ] AAA entry: up/down cycles letters, Attack confirms and advances; the new row is highlighted in the score/pickup gold
- [ ] Attract replay is a committed input log played through the sim; it is also a replay-golden regression test
- [ ] ≈500 ms crossfade between attract segments; any coin interrupts immediately
- [ ] Vitest: ordering, top-10 cut, 1CC flag, store fallback

## 20 — Cabinet shell DOM: bezel, marquee, vignette, rescale, ≤768 card, SERVICE, failure handling

**What to build:** The canvas sits inside an illustrated cabinet in a dark room with a lit marquee and vignette; the window can be resized and the game always stays integer-scaled and centred; a phone-width viewport gets a static "desktop required" card; asset failures land on an arcade SERVICE screen with a retry key. A placeholder marquee is fine until 21.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Layer order: dark room → bezel → marquee (warm CSS glow) → canvas → vignette
- [ ] Integer scale recomputed on resize; never fractional; canvas stays centred
- [ ] ≤768 px: cabinet hidden, card shown (`min(90vw, 420px)` wide), no horizontal scroll down to 320 px; re-evaluated on resize / orientation change
- [ ] SERVICE screen names the failed asset id, offers a retry key, logs the id to console
- [ ] Audio-unlock failure stays silent and retries on the next gesture; first keypress unlocks audio
- [ ] Verified at ~375 px, ~768 px and desktop widths in a real browser

## 21 — Marquee / logo + bezel art + 1200×630 OG image

**What to build:** The cabinet gets its real marquee logo and side-art bezel, and the same marquee art is exported as the 1200×630 Open Graph image. **Human gate:** spends credits; final title must be chosen (trademark lookup before any store page).

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Logo via Nano Banana Pro + a vector clean-up pass; bezel side panels in the occult-industrial motif
- [ ] OG image: logo left-weighted over a Foundry Gates far-layer crop, flat PNG, no scanlines, legible at thumbnail size
- [ ] Marquee wired into the shell from 20; card in 20 shows the small logo
- [ ] `LICENSES.md` updated; no third-party IP in prompts

## 22 — Audio: SFX manifest, music, voice barks, unlock

**What to build:** Hits, coins, pickups, weapon breaks and UI beats have consistent retro SFX; the stage, boss and title each have a chiptune/FM track; announcer, hero grunts and a boss taunt play at their moments — all licensed and logged.

**Blocked by:** 18

**Status:** ready-for-agent

- [ ] SFX pack and music tracks chosen with their commercial licences verified and recorded in `LICENSES.md`
- [ ] Audio manifest maps event ids → files; core emits events, the adapter plays them
- [ ] Voice barks trialled on Higgsfield audio (same provider rule) or cut if quality/licence fails
- [ ] Volume persists in localStorage; audio unlocks on first keypress; hidden tab mutes
- [ ] Every checklist beat has a sound: coin, start, hit light/heavy/launch, knockdown, pickup, weapon break, name-card, continue tick, game over, hi-score confirm

## 23 — Playwright smoke + full CI

**What to build:** An automated browser test proves the built game loads, scales to an integer, accepts a coin and start, shows the hero, and logs zero console errors — run in CI on every push against `vite preview`.

**Blocked by:** 19, 20

**Status:** ready-for-agent

- [ ] Playwright installed with browsers and temp on the E Drive
- [ ] Smoke: page loads → canvas dimensions are an integer multiple of 384×224 → press 5, Enter → hero sprite visible → no console errors
- [ ] CI job runs typecheck, lint, Vitest (incl. replay goldens), build, then the smoke
- [ ] Smoke is parameterised by base URL so 24 can reuse it against production

## 24 — Deploy: Vercel + itch.io + OG tags + LICENSES audit + post-deploy smoke

**What to build:** The demo is publicly playable at a Vercel URL and an itch.io page, link previews show the marquee, every shipped asset is accounted for, and a smoke test runs against production after each deploy.

**Blocked by:** 21, 22, 23

**Status:** ready-for-agent

- [ ] Vercel: production from `main`, previews per PR, long-cache headers on hashed assets
- [ ] itch.io HTML5 upload at 1152×672 with fullscreen, AI-content disclosure set; first release manual, `butler` from CI on a tag thereafter with the key as a CI secret
- [ ] Open Graph + Twitter Card tags with absolute HTTPS URLs to the OG image; verified with LinkedIn Post Inspector and opengraph.xyz
- [ ] `LICENSES.md` audit: every asset has source, model, provider, date, prompt, licence and AI flag; no Kling-backed provider
- [ ] Post-deploy Playwright smoke green on the production URL; a stranger completes coin → start on both URLs
- [ ] No telemetry, analytics or accounts shipped

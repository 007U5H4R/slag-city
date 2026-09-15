# HANDOFF — SLAG CITY

**Stage 6 (Execution) — ✅ PHASE A COMPLETE + SIGNED OFF; ▶ NOW IN PHASE B / Ticket 03 (art tracer). Model: Opus 4.8 (`claude-opus-4-8`), standard effort.**
Original arcade beat-'em-up (Phaser 3 + Vite + TypeScript). Stages 1–5 approved; executing the
per-ticket plans via subagent-driven development (one fresh implementer per task, brief/report as
files, orchestrator review, ledger updates, phase QA gate).
**▶ Phase A signed off (`9ce70a3`); Phase B — ticket 03 art tracer ✅ COMPLETE + owner-accepted (`ced1d6b`, 2026-09-07).
▶ SCALING PASS (hero move-set): ATTACK (`2ee4a9d`) + IDLE + HURT (`2fa9411`, 2026-09-14) all generated, wired in-engine, and CDP-verified.
✅ BUDGET UNBLOCKED — owner topped up +500 cr (2026-09-14) and said "go ahead with the remaining implementation". Standing cap: seedream_v4_5
only (~1 cr/frame), reconcile `transactions` after every batch, no nano_banana_pro for frames.**
**▶ 2026-09-15: TICKET 18 (coin-op machine) COMPLETE + gated — the game now boots to ATTRACT and runs the full arcade cycle: coin → PLAY → death → CONTINUE → coin-continue/revive → GAME_OVER → ATTRACT, and boss defeat → STAGE CLEAR (1CC tracked). Zero credit (pure code). See "TICKET 18" in LEDGER + `docs/verification/18-coinop.md`.**
HEAD = `18dca12` (ticket 18: 18.1 `bd7a6f2` + 18.2 `0b58374` + 18.3 adapter `cb8af28` + evidence `18dca12`; ticket 15 boss `c7a8a5f`/`17cd511`/`0ea9b3c`; ticket 11 weapons `d9e68b3`/`2ef39ad`/`24c527b`; ticket 10 feral `535fc13`/`0a87432`/`d757465`; 14.3 hazards `926f6f7`; 14.4 Steps 1-2 `443ebb7`). Higgsfield balance = **427.9 cr** (tickets 10+11+15+18 spent ZERO — pure code).
**▶ TICKET 18 recap:** coin-op FSM (`src/core/arcade/{credits,screen-machine,session}.ts`, both core tasks VERBATIM from plan — zero contradictions to ratify, first time since ticket 05) + adapter screens (`src/adapters/phaser/screens/{Attract,Continue,GameOver}.ts` + GameScene routing + `Hud.setVisible`). `npm run check` GREEN (**38 files / 116 tests**), golden UNCHANGED. **`HISCORE_ENTRY` is a pass-through until ticket 19 registers an entry component — that seam is the direct handoff to ticket 19.**
**▶ 2026-09-15 (same session, owner AFK-delegated "complete all the stages"): TICKET 19 (hi-scores) STARTED — 19.1 kv-store (`3eb940b`) + 19.2 hi-score rules + AAA entry reducer (`eadc6a9`) DONE + gated, both VERBATIM from plan (zero contradictions). `npm run check` GREEN (40 files / 123 tests), golden unchanged, zero credit. HEAD now `eadc6a9` (+ baton/ledger commit after this).**
**▶ NEXT — TICKET 19 REMAINDER (19.3 + 19.4), then the owner-gated work:**
  • **19.3 (attract demo replay)** — ⚠ needs a recorded ~25 s attract DEMO: play a fresh game with the DEV `R` recorder (start with `R` held so seed is captured from frame 0) → save `attract-demo.json` to BOTH `public/assets/replays/` (shipped) and `test/replays/` (golden). An owner playthrough is ideal; a scripted deterministic auto-player (like ticket-14's `c1b20b6` god-mode CDP player) is the AFK fallback. Also adds `seed` to `WorldState` + `src/core/arcade/attract.ts` + a golden test. Plan §19.3 ~L6911.
  • **19.4 (adapter)** — HiScoreTable/HiScoreEntry screens + `hiscore-store.ts` + Attract refactor (own a demo world, pass world into views) + crossfades + BootScene JSON load; replaces the `HISCORE_ENTRY` pass-through 18.3 stubbed. Browser gate includes **reload-persistence** (IndexedDB) + private-window fallback. Plan §19.4 ~L6952.
  • **Then (all need the OWNER):** the manual **14.4 Step-3 timed-run playtest** (owner + stopwatch), and the credit-gated art — **ticket 16 boss sprites / 12 action sheets / 17 backgrounds** (seedream spend within the +500 cap, subjective reference picks + a visual-accept gate). **I did NOT spend credits or make aesthetic calls while AFK** — those wait for the owner.
**✅ TICKET 11 (salvage weapons) COMPLETE** — weapon pickup, cannon projectiles (`spawnProjectile` now exists — unblocks the boss), blade swings, drop-on-knockdown, heat bar + break sparks. `npm run check` GREEN (**35 files / 105 tests**). 2 owner-ratified plan-test cadence fixes (see LEDGER "Ticket 11").
**✅ TICKET 15 (Boss "the Foreman") COMPLETE** — 15.1 `c7a8a5f` (core FSM: phase-1 brawler w/ super-armour + no-launch, 50% tear-open→phase-2 1.3×/tint/blade-drop/molten-globs, defeat→STAGE CLEAR+5000) + 15.2 `17cd511` (adapter: box render, phase-2 magenta stroke, STAGE CLEAR banner) + DEV `B` spawn key `0ea9b3c`. 2 owner-ratified plan-TEST cadence fixes (hitstop-eats-the-tick + glob melee-lock; see LEDGER "Ticket 15"). `npm run check` GREEN (**36 files / 109 tests**). CDP-verified full encounter, zero console errors (`docs/verification/15-boss.md` + `15-boss-stageclear.png`). **The stage is now beatable start → boss → STAGE CLEAR.**
**▶ NEXT (two independent threads, owner picks):**
  • **14.4 Step-3 OWNER timed-run playtest** (the one remaining ticket-14 gate — see below) — now measures the COMPLETE stage incl. the boss ending. Inherently manual (owner + stopwatch).
  • **TICKET 16 — Boss sprites** (~120px, phase-2 reserve-slot recolor) — ⛔ credit + owner sign-off gated (art pass; boss renders as the magenta box until then). OR ticket 12 (dedicated enemy/hero action sheets) / ticket 17 (bgs) / ticket 18 (coin-op machine) — all remaining Phase C+ work.
**▶ TICKET 14 (Stage 1 layout) — engine COMPLETE + stage PLAYABLE + fully populated; ⏸ ONE owner gate left. TICKET 10 (feral) COMPLETE.** 14.1 `f7afdc6` + 14.2 `d75e3ef` + 14.3 `926f6f7` + 14.4 Steps 1-2 `443ebb7`; ticket 10 `535fc13`/`0a87432`/`d757465`. `npm run check` GREEN (**33 files / 100 tests**).
**CDP-verified @1024px** (`docs/verification/14-stage.md` + `14-feral-spawn.png` + 6 shots): STAGE1 boots (no debug block), scroll-locks engage live + spawn waves incl. **ferals** (sections 2-3 populate via the un-deferred `spawn.ts`), 3 sections render distinct (slate/blue-grey/molten-red), belt/channel/ladle draw, boss door holds camera at 3616, **zero console errors**.
**⛔ ONLY GATE LEFT to close ticket 14 — needs the OWNER (inherently manual):**
  **14.4 Step-3 timed-run playtest** — `npm run dev`, play start→boss door ×2 with a stopwatch, target **6-8 min**; record both times/deaths/pacing sags in `docs/verification/14-timed-runs.md`. Then the orchestrator tunes ONLY STAGE1 (counts/delays/lock positions — never enemy stats; each change re-runs `npm test`) until two runs land in range. Ferals now populate, so this tunes against the full roster.
**Deferred (non-blocking):** feral SPRITE art (renders as green box now, like the gang pre-sprites) — a later dedicated art pass; hero jump/grab/throw/special still fall back to walk/attack (fine for M0).
See LEDGER "Ticket 14" + "Ticket 10" tables for all deviations + the ratified 10.2 tuning fixes.
Hero atlas ships **10 frames** (walk×4, attack×4, idle×1, hurt×1), cell 52×66.
**✅ ENEMY ROSTER ART COMPLETE (2026-09-14):** owner picked references **brawler-1 / knife-1 / heavy-2** (`assets/sources/enemies/<kind>/reference.png`);
**walk×4 + attack×4 per kind = 24 frames** generated on `seedream_v4_5` (proven hero recipe, weapon gripped, zero detachment) → probes in
`docs/art/probes/{brawler,knife,heavy}-{walk,attack}-seedream/`. Refs 18 cr + frames 24 cr = **42 cr this session; reconciled every batch, no overrun.**
Full job IDs + recipe in `docs/build/LEDGER.md` enemy-roster entry.
**✅ ENEMY ROSTER WIRED IN-ENGINE + CDP-VERIFIED (2026-09-14, committed this session):** 3 per-kind atlases (`public/assets/atlases/{brawler,knife,heavy}.{png,json}`,
8 frames ea = walk×4+attack×4) + palettes + manifests; `BootScene.MANIFEST` + `ANIM_TABLE` (gangAnims) + `EntityView.ts` sprite-path variant tint. CDP probe:
all 5 gang + hero render as SPRITES, frames cycling, zero console errors; name-cards + crates intact. `npm run check` GREEN (28 files/85 tests).
**⛔ NEXT (optional polish, non-blocking):** dedicated enemy hurt/KO/down/dead sheets (now walk-0 fallback), real recolored variant atlases (now a tint), feral + boss art.
Hero jump/grab/throw/special still fall back to walk/attack (fine for M0).

## The resume anchor
**Read `docs/build/LEDGER.md` first.** It is the source of truth for task status, SHAs, deviations,
and open threads. This HANDOFF orients you; the LEDGER has the live detail.

## Where we are (as of 2026-09-07)
- **Branch:** `build/stage-1` (created in place off unborn `main`; `main` is never committed to — see
  ledger "Worktree deviation"). **HEAD = `683e8f2`** (Phase A `a41d1c8` + baton `9ce70a3` + ticket-03 task 3.1 `683e8f2`). Nothing has ever been pushed (no git remote).
- **✅ PHASE A (M1 combat core) COMPLETE, ALL TICKETS GATED, QA-PASSED.** `npm run check` GREEN — **79 tests /
  25 files**, typecheck + lint + build clean. Order as executed: **01 ✓ → 05 ✓ → 02 ✓ → 20 ✓ → 06 ✓ → 07 ✓ →
  08 ✓ → 09 ✓**, then the **Phase A QA-tester gate ✅ PASS** (`6004bb4`). Every per-ticket gate row, SHA, and
  owner-ratified deviation is in `docs/build/LEDGER.md` (the source of truth) — read it, not this summary,
  for detail.
- **Tickets 08 + 09 (this run):** 08 = gang trio (fast/frail knife + super-armoured heavy) + attacker-ticket
  group AI (≤2 attackers, ring rotation) + variant hook + 5-enemy scene (8.1 `47f679c`, 8.2 `f55c484`,
  8.3 `099045c`). 09 = HUD strip + rising score pops + breakable crates/walk-over pickups + once-per-type
  name-cards, on Press Start 2P bitmap fonts (9.1 `2b76a79`, 9.2 `774600a`, 9.3 `8106564`, 9.4 `a2fc2cc`).
  All browser gates self-certified via headless Chrome + CDP @1024px (owner-AFK-delegated); evidence in
  `docs/verification/08-gang-trio.png`, `09-hud.png`, `qa-phase-a-*.png`.
- **Owner-ratified deviations this run (in LEDGER):** 8.1 registered knife/heavy in `ENTITY_UPDATERS` (plan
  omitted `tick.ts`); 9.1 fonts built **NO-sharp** via `@napi-rs/canvas` (matches the ticket-20 precedent);
  9.2 name-card float-equality `toBe`→`toBeCloseTo` (1-ULP); 9.3 `CRATE_HURTBOX` z-height 24→40 (hero attacks
  sit at z 24–44 so punches whiffed over the short crate). `ImplementationPlan.md` patched to match all of the
  above **and** the two long-deferred §6.2 contradictions.
- **QA added 3 regression tests** (`test/core/qa-phase-a.test.ts`): KO score award + full-entity-world
  determinism + input-sensitivity guard. Deliverable: `docs/qa/phase-a-cases.md`.

## ⛔ CREDIT ALERT — read first. All art generation paused pending owner decision

**Balance = 22.9 cr (live), not the 60.9 my running log claimed.** Reconciliation vs the Higgsfield `transactions` log (2026-09-07):
Phase B started at 88.9; total spend = **66 cr**; I had logged only 28. The gap is the **hero attack: it actually cost 38 cr (19×
nano_banana_pro generations, 12:02 UTC), which I mis-recorded as "6 cr seedream"** — nano's image-ref pose-lock forced ~15 wasted
retries — plus two small unlogged probe batches (11:30, 11:46 = 6 cr). Full breakdown + scar in `assets/LICENSES.md`.
**Before ANY further generation the owner must decide: (a) top-up amount, (b) a per-action model + cost cap.** Recommendation:
**use `seedream_v4_5` only for frames (~1 cr/frame, honours pose text, no retry spiral); do NOT use `nano_banana_pro` for animation
frames.** New standing habit: call `balance`/`transactions` right after each batch and log the real figure, never the expected cost.

## Your next action — Scaling pass PAUSED: hero idle + hit ready to go once budget is set (then ⛔ enemies)

**Ticket 03 (art tracer) is ✅ COMPLETE + owner-accepted (`ced1d6b`). Hero ATTACK now also wired in-engine + verified (`2ee4a9d`).**
The hero WALK + ATTACK both play in-engine (`docs/verification/03-art-tracer.md`; attack detail in the LEDGER "Scaling pass" section).
The tracer + attack proved the pipeline end-to-end and the cost model both ways (lock upper body → vary legs = walk; lock legs → vary
arms+grip = attack). **Read `docs/build/LEDGER.md` "Scaling pass" + Task 3.4/3.5 entries for the full detail before continuing.**

**Attack wiring recap (proven, zero-credit, resumable pattern for idle/hit):** frames `docs/art/probes/<action>/*.png` → assemble a
horizontal strip via sharp (see `/Volumes/E Drive/Dev/.scratch/assemble-attack.mjs` — import sharp from the project `node_modules`) →
`assets/sources/hero/<action>.png` (source stays OUT of git) → add `{name:'<action>',sheet:…,frames:N}` to `tools/art/manifests/hero.json`
→ `npm run art:atlas tools/art/manifests/hero.json` → CDP gate with `LATEHOLD=<key>` to catch edge-triggered moves on-screen. Attack cell
grew the atlas union to 52×66 (scale/origin unchanged); idle/hit will likely fit inside that box.

**Working art method (proven, use it to scale):** Higgsfield **Seedream 4.5** (`seedream_v4_5`, **1 cr/frame**, image ref =
the hero reference job `36273de6-a4b5-483b-9922-9bd42ec4f3e5` = `assets/sources/hero/reference.png`), **upper-body + weapon
LOCKED to the reference, vary ONLY the legs/action** (this fixed the detached-hammer defect), hard framing locks (fixed camera
distance, same character height, feet on one ground line), flat `#808080` bg, "no pole/line/objects". ~4 frames/action ≈ **4 cr/action**.
Then: assemble a horizontal strip → `assets/sources/hero/<action>.png` (compositing was ad-hoc via sharp — script it if scaling) →
`build-atlas` (`tools/art/manifests/hero.json`, add the action) → in-engine via the already-wired `EntityViews` sprite path.
**DEAD ENDS (do not retry):** nano_banana_pro image-ref stills POSE-LOCK (identity holds, pose won't change); the `autosprite`
model is catalog-listed but NON-INVOCABLE (circular error — filed as a bug). Seedance img2video works but is 26 cr/clip (heavy).

**⛔ Owner decision needed before resuming (see CREDIT ALERT above):** balance is **22.9 cr**. On the *proven-good* path (seedream ≈ 1
cr/frame) hero idle + hit ≈ ~8 cr and would fit; but the attack just showed a batch can over-run badly, so **do not resume on the current
budget without an owner top-up + a model/cost cap**. Enemy roster (knife, heavy, gang trio — each its own reference + actions) definitely
needs a top-up. Log every generation to `assets/LICENSES.md` + LEDGER **from the transaction-log figure**, immediately after each batch.

**Reproducibility note:** `assets/sources/hero/walk.png` + `attack.png` (11 MB strips) + the probe frames in `docs/art/probes/` are ON
DISK but NOT committed (per plan Step 6, source sheets stay outside git). The committed atlas `public/assets/atlases/hero.{png,json}`
(now 8 frames, walk + attack) is what ships.

---
### (superseded) prior next action — Task 3.4 sprite sheets
Phase A signed off (`9ce70a3`), O-1 fixed (`a41d1c8`). Phase B unblocked — owner: "do what is right with Higgsfield…
take reasonable decisions and keep moving; flag me before credit runs low." **Higgsfield balance = 82.9 cr.**

**⚠ 3.4 generation-path finding (this session, from actually reading the character-sheet workflow):** the character-sheet
workflow is a *reference-sheet* generator (split-screen / turnaround / expression sheets = discrete static views), **NOT an
animation-frame generator** — it does not natively emit an atlasable N-frame walk/attack strip with feet on a common floor
line. So for 3.4, test the **plan's own fallback (Solution-PRD §1): reference → per-pose stills** via `generate_image`
(nano_banana_pro, reference.png as an image ref), each frame prompted for one pose on a **hard flat #808080 bg** so
`build-atlas`'s bgKey knockout works, feet on a common floor line. Generate ONE action first (e.g. a short walk or the
attack), run it through `build-atlas` → in-engine, **measure real cost + frame consistency, and flag the owner with that
data before scaling** to the full move set. `get_cost` reports UNIT cost (=2 for nano_banana_pro); true batch = 2×count.

**Ticket 03 task state:**
- **3.1 palette tool — DONE** (`683e8f2`; `tools/art/palette.ts`; 84 tests).
- **3.2 build-atlas — DONE** (`27c2927`; `tools/art/build-atlas.ts` + `manifests/hero.json` + test; sharp devDep; 85 tests).
  Type-only deviation ratified (dropped redundant `data = knockout(...)` reassignment under @types/node v26 — see LEDGER).
- **3.3 hero reference — DONE** (`a003fa0`; owner picked candidate **#1 masked exorcist** → `assets/sources/hero/reference.png`;
  3 candidates in `docs/art/candidates/`; 6 cr; provenance in `assets/LICENSES.md`).
- **3.4 sprite sheets — TODO (⛔ spends credit, THE tracer risk):** per-pose-stills approach above; feed
  `tools/art/manifests/hero.json` (expects `assets/sources/hero/walk.png` + `attack.png` strips on #808080). Plan ~L3544.
- **3.5 palette + atlas + in-engine playback — TODO:** ⛔ owner visual-accept gate; Chrome via headless CDP @≥769px
  (`/Volumes/E Drive/Dev/.scratch/slag-cdp-gate.mjs`), screenshots → `docs/verification/03-art-tracer.md`.
  NB `anim-table.ts` already EXISTS (Phase A 7.4) — 3.5 MODIFIES it (wire EntityViews to sprites), does not create it.

**⚠ Plan-DAG note (7.4):** `anim-table.ts` already EXISTS — ticket 03 **MODIFIES** it (atlas art + wire `EntityViews`
to sprites + non-hero kinds), does not create it. `variantAtlasKey` (8.3) is already there, dormant until sprites land.

**QA obs O-1 — ✅ DONE** (`a41d1c8`). No open Phase A items.

## Standing gotchas (learned this session)
- **`eslint.config.js` is HOOK-PROTECTED** (`config-protection.js` blocks edits) AND bypassing hooks is
  forbidden. Any lint issue → fix in SOURCE, never the config. The `{x,...rest}` omit-idiom trips
  no-unused-vars — use a replacer or equivalent instead.
- **GateGuard fact-forces** on first-touch Edit/Write of non-`docs/build`/`docs/qa` files — answer the
  4 facts briefly and retry. `docs/build/**` + `docs/qa/**` are exempt (set in `.claude/settings.local.json`).
- **`src/core` is pure TS** — no Phaser/DOM/`window`/`performance`; eslint boundary rule enforces it.

## Per-task loop (unchanged)
Write brief → dispatch fresh implementer (name the model) → implementer does strict TDD
(red→green→commit, stage explicit paths, no push) → verify report against repo (`git log`, `npm run
check` green) → for design-judgment tasks run a fresh reviewer; trivial verbatim tasks get
orchestrator-level verification → update the ledger. Stop at each ticket's verification gate (acceptance
boxes ticked; `npm run check` green; any golden/screenshots committed) for the human-in-the-loop check.

## Standing rules (do not violate)
- **Everything on `/Volumes/E Drive`.** Never the internal disk. npm cache + Vite cacheDir already redirected.
- **Never push** — no remote; local-only until ticket 24. `npm run check` is the gate.
- **Never bypass safety hooks.** GateGuard fact-forces on new-file Writes/first-touch Edits — answer the
  4 facts briefly and retry.
- **Commit trailers, every commit:**
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01VXKE9Jw963GEYoCG1AAkNV
  ```
- **⛔ Higgsfield credit ceiling** must be provided by the owner **before ticket 03** (Phase B, art gen).
  Not blocking 02/20. No art generation until recorded in the ledger + `assets/LICENSES.md`.
- **Phase A order:** 01 ✓ → 05 ✓ → **02 ∥ 20 (current)** → 06 → 07 ∥ 08 ∥ 09. QA-tester gate at the
  Phase A boundary (after 09), not per ticket.

## Environment note (this machine, set 2026-09-06 via /doctor — non-project)
Reversible user-scope changes from a prior session: **auto permission mode is the default**
(`~/.claude/settings.json` → `permissions.defaultMode="auto"`), and the redundant **`mobbin` + `recraft`
MCP servers were disabled for this project** (`~/.claude.json` disabledMcpServers). Neither affects the
build. Auto mode falls back to prompting if the safety classifier is briefly unavailable.

## Key files
- `docs/build/LEDGER.md` — resume anchor (task table, SHAs, deviations, open threads).
- `ImplementationPlan.md` — the plan-of-record. Ticket 02 at ~line 791 (gate ~1093); ticket 20 at
  ~line 2136 (gate ~2466); shared core interfaces ~line 132. Read only the section you need.
- `docs/build/briefs/NN.M.md` — per-task briefs (write 02.1+ from the plan as you reach them).
- `docs/build/reports/NN.M.md` — implementer reports. `ExecutionPlaybook.md` — full session playbook.
- Uncommitted on disk (intentional): `docs/build/LEDGER.md` (live working doc) and the untracked
  briefs/reports/reviews (orchestration scaffolding — only `.gitkeep`s are tracked). These survive `/clear`.

## Deferred housekeeping (non-blocking)
- Add `.claude/settings.local.json` to `.gitignore` in a small later commit (stage explicit paths).
- `eslint-formatter-compact` devDep is owner-approved (commit-quality hook needs it under ESLint 9).

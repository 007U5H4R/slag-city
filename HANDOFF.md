# HANDOFF — SLAG CITY

**Stage 6 (Execution) — ✅ PHASE A COMPLETE + SIGNED OFF; ▶ NOW IN PHASE B / Ticket 03 (art tracer). Model: Opus 4.8 (`claude-opus-4-8`), standard effort.**
Original arcade beat-'em-up (Phaser 3 + Vite + TypeScript). Stages 1–5 approved; executing the
per-ticket plans via subagent-driven development (one fresh implementer per task, brief/report as
files, orchestrator review, ledger updates, phase QA gate).
**▶ Phase A signed off (`9ce70a3`); Phase B — ticket 03 art tracer ✅ COMPLETE + owner-accepted (`ced1d6b`, 2026-09-07).
Tasks 3.1 ✓ / 3.2 ✓ / 3.3 ✓ / 3.4 ✓ (Seedream legs-only walk) / 3.5 ✓ (in-engine, accepted). ▶ SCALING PASS started:
hero ATTACK generated + wired in-engine + verified (`2ee4a9d`). ⛔ ALL further art generation is now GATED on an owner
budget/top-up + model-cap decision (balance is low AND the attack over-ran to 38 cr — see the credit alert). See "Your next action".**
HEAD = `2ee4a9d`. Higgsfield balance = **22.9 cr** (66 spent across Phase B; the attack alone was 38 cr via nano retries — reconciled
against the transaction log, `assets/LICENSES.md`). Ticket-03 art (walk + attack) is committed and shipping regardless.

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

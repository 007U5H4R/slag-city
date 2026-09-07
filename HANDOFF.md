# HANDOFF — SLAG CITY

**Stage 6 (Execution) — ✅ PHASE A COMPLETE + SIGNED OFF; ▶ NOW IN PHASE B / Ticket 03 (art tracer). Model: Opus 4.8 (`claude-opus-4-8`), standard effort.**
Original arcade beat-'em-up (Phaser 3 + Vite + TypeScript). Stages 1–5 approved; executing the
per-ticket plans via subagent-driven development (one fresh implementer per task, brief/report as
files, orchestrator review, ledger updates, phase QA gate).
**▶ Phase A signed off by the owner (`9ce70a3`); Phase B under way — ticket 03 art tracer. Task 3.1 done; next is
the Higgsfield generation (owner-delegated, tracer-first). See "Your next action".** HEAD = `683e8f2`.

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

## Your next action — Phase B / Ticket 03 art tracer (resume in a FRESH session)
Phase A is signed off (`9ce70a3`) and O-1 is fixed (`a41d1c8`). Phase B is unblocked — owner: "do what is right with
Higgsfield, if you need extra credit let me know." **Resume ticket 03 in a fresh session** (image-generation +
visual-acceptance wants clean context, per the build-workflow's fresh-session-per-ticket rule).

**Generation-path decision (owner, 2026-09-07):** the plan's **AutoSprite app is NOT in this account's marketplace**
(`apps_search` → only "Match Cut + Tracelab"). Use the Higgsfield **character-sheet workflow** instead (confirmed:
`get_workflow_instructions { workflow: 'character-sheet' }`) as the sprite-frame generator. **Tracer-first:** generate
ONE hero (reference + one action), measure real cost + AI frame consistency, **flag the owner before credit runs low.**
Balance at start = **88.9 credits (Pro)**. No Kling-backed model. Record every generation
(prompt/seed/model/provider/licence/date + balance before/after) in `assets/LICENSES.md` + LEDGER.

**Ticket 03 task state:**
- **3.1 palette tool — DONE** (`683e8f2`; `tools/art/palette.ts`; 84 tests; no sharp).
- **3.2 build-atlas — TODO (zero-spend tooling):** plan ~L3308; uses sharp (SANCTIONED for art tools per Tech Stack;
  the ticket-20 no-sharp rule was only for trivial placeholder PNGs). Buildable before any generation.
- **3.3 hero reference — TODO (⛔ spends credit):** `generate_image` Nano Banana Pro, 2–4 candidates → `assets/sources/hero/reference.png` + provenance. Plan ~L3497.
- **3.4 sprite sheets — TODO (⛔ spends credit):** was "AutoSprite" → now the character-sheet workflow. Load it first;
  prompt "flat #808080 background, feet on a common floor line" so `build-atlas`'s bgKey knockout works. Plan ~L3544.
- **3.5 palette + atlas + in-engine playback — TODO:** ⛔ owner visual-accept gate; Chrome via headless CDP @≥769px
  (`/Volumes/E Drive/Dev/.scratch/slag-cdp-gate.mjs`), screenshots → `docs/verification/03-art-tracer.md`.

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

# HANDOFF — SLAG CITY

**Stage 6 (Execution) — ✅ PHASE A (M1 combat core) COMPLETE, ALL-GATED, QA-PASSED. Model: Opus 4.8 (`claude-opus-4-8`), standard effort.**
Original arcade beat-'em-up (Phaser 3 + Vite + TypeScript). Stages 1–5 approved; executing the
per-ticket plans via subagent-driven development (one fresh implementer per task, brief/report as
files, orchestrator review, ledger updates, phase QA gate).
**⛔ The build is now PAUSED at the Phase A→B boundary awaiting the owner** (Phase B = ticket 03 art, hard-blocked
on the Higgsfield credit ceiling). See "Your next action".

## The resume anchor
**Read `docs/build/LEDGER.md` first.** It is the source of truth for task status, SHAs, deviations,
and open threads. This HANDOFF orients you; the LEDGER has the live detail.

## Where we are (as of 2026-09-07)
- **Branch:** `build/stage-1` (created in place off unborn `main`; `main` is never committed to — see
  ledger "Worktree deviation"). **HEAD = `a41d1c8`.** Nothing has ever been pushed (no git remote).
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

## Your next action  ⛔ OWNER-GATED — the AFK run stopped here on purpose
Phase A is done and verified; the build-workflow's per-phase human-in-the-loop gate + the art blocker mean the
next move needs the owner. Two owner inputs unblock the next session:
1. **Sign off on Phase A** (the M1 combat core) — or raise changes, which feed a fresh fix loop.
2. **Provide the Higgsfield credit ceiling** so Phase B can start. **Phase B begins at ticket 03 (art)** and is
   HARD-BLOCKED: no art generation until the ceiling is recorded in `docs/build/LEDGER.md` + `assets/LICENSES.md`.
   ⚠ Ticket 03 now **MODIFIES** `src/adapters/phaser/views/anim-table.ts` (adds atlas art + wires `EntityViews`
   to sprites + non-hero kinds) — it was CREATED in Phase A (7.4), a ratified plan-DAG fix, so 03 does not create it.
   Ticket 03 also modifies `EntityView.ts` to add the sprite/atlas-key path (the variant-atlas hook `variantAtlasKey`
   already exists in `anim-table.ts` from 8.3, dormant until sprites land).

**QA observation O-1 — ✅ DONE (`a41d1c8`).** A dead body now stops taking damage (`canHit` rejects the `dead`
state) and floors at 0 HP; regression test `test/core/combat/hero-death.test.ts`. 80 tests green. No open
recommendations from Phase A QA remain.

**Once the owner provides the credit ceiling:** resume with ticket 03 per the per-task loop (lean brief → fresh
implementer → verify → ledger), running its art gates in Chrome via headless CDP @≥769px. The reusable gate
driver is `/Volumes/E Drive/Dev/.scratch/slag-cdp-gate.mjs` (env URL/WIDTH/HEIGHT/WAIT/KEYS/PROBE/OUT).

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

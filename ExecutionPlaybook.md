# Execution Playbook — SLAG CITY Stage 6 (build day)

Companion to `ImplementationPlan.md` (Stage 5). Read this first in the Stage 6 session, then `HANDOFF.md`, then the ticket you are executing in `ImplementationPlan.md`. Nothing here re-decides design; it says **how** the plan is run.

## 0. Session set-up (once per build session)

1. Start the session under the Execution defaults from `build-workflow.md`: **Opus 4.8 (`claude-opus-4-8`)** as primary, standard effort. If a whole session should run on a non-Claude model (e.g. GPT via `claudex`), start it that way — routing is per session, not per dispatch.
2. `superpowers:using-git-worktrees` → worktree at `/Volumes/E Drive/Dev/Code/Claude/Slag City.build` on branch **`build/stage-1`** off `main`. `main` is never committed to. The repo has no commits yet: the first commit on `build/stage-1` is `docs: stage 1–5 planning artifacts` (the untracked `*-PRD.md`, `Design.md`, `tickets.md`, `ImplementationPlan.md`, `ExecutionPlaybook.md`, `HANDOFF.md`, `AGENTS.md`, `docs/agents/`, `.scratch/`, `.gitignore`), then ticket 01's toolchain.
3. Create the ledger `docs/build/LEDGER.md` (committed) with one row per task: `ticket.task | status (todo/in-progress/review/fix-N/done/parked) | model | commit | notes`. Update it after **every** task; it is the resume point after a context reset or `/clear`.
4. Briefs and reports are files: `docs/build/briefs/<ticket>.<task>.md` (written by the orchestrator, ≤ 1 page: the task's plan section verbatim + the Global Constraints block + "report to `reports/<same>.md`") and `docs/build/reports/<ticket>.<task>.md` (written by the implementer: what changed, commands run with output summary, what is verified vs. assumed). Never paste history into a prompt.

## 1. Order and phases (QA gate at each phase boundary)

| Phase | Milestone | Tickets (in order) | QA-tester gate content |
|---|---|---|---|
| A | M1 combat core (boxes) | 01 → 05 → 02 ∥ 20 → 06 → 07 ∥ 08 ∥ 09 | Vitest + manual: locomotion, combo, hit-feel numbers, tickets ≤ 2, HUD grid |
| B | M0 art tracer | 03 → 04 | ⛔ owner quality + look sign-off; provider/cost recorded |
| C | M2 full cast | 10 → 11 → 12 ∥ 13 ∥ 21 | feral neutrality, weapons 6/8, sprites on every state |
| D | M3 stage | 14 → 17 | ⛔ two timed runs 6–8 min; hazards readable |
| E | M4 boss | 15 → 16 | 50 % transition, blade drop, ⛔ boss look |
| F | M5 cabinet | 18 → 19 → 22 | Discovery §7 items 1–10 walk-through |
| G | M6 ship | 23 → 24 | CI green, S5 audit, S6 live, post-deploy smoke |

Phase B is sequenced after A on purpose: the tracer needs only 01 and 02, but running it after the combat core lets the owner's feel read (06) and quality read (03) land in one sitting and keeps art spend behind the cheapest risk kill. If the credit ceiling is set early and the owner wants the art risk killed first, B may run right after 02 — both orders satisfy the ticket DAG.

Parallel-safe sets (disjoint files) may be dispatched as managed batches of one implementer each, **never two implementers on shared files**: `02 ∥ 05 ∥ 20`, `07 ∥ 08 ∥ 09`, `12 ∥ 13 ∥ 21`, `16 ∥ 17`, `22 ∥ 23`. Anything touching `tick.ts`, `entity.ts`, `resolve.ts`, `GameScene.ts`, `anim-table.ts` or `EntityView.ts` is serialised.

## 2. Per-task loop

1. Orchestrator writes the brief file; names the model; dispatches **one fresh implementer subagent** for the task (`Agent`, `subagent_type: general-purpose`, tier per §3).
2. Implementer follows the task's checkbox steps **exactly** (TDD: failing test → run → implement → run → commit), writes the report file, and ends.
3. Orchestrator runs the **two-stage task review** (fresh reviewer subagent, most-capable tier for combat/AI/state tasks, standard otherwise): (a) spec compliance against the task's steps + the ticket's acceptance boxes, (b) clean-code quality (no placeholders, no design re-decisions, matches the interfaces block). Findings go to `docs/build/reviews/<ticket>.<task>.md`.
4. **Fix loop, max 5 rounds:** rounds 1–3 resume the same implementer with the review file; rounds 4–5 escalate to the most-capable model; at 5, adjudicate (park with a written reason in the ledger, or escalate to the owner). Never loop past 5.
5. Ledger update; `npm run check` must be green before the next task starts.

## 3. Model assignment (name it on every dispatch)

| Tier | Use for |
|---|---|
| Cheap (`haiku`) | mechanical steps: manifest rows, `LICENSES.md` rows, moving files, running documented tool commands (tasks 3.5 steps 1–2, 4.3 step 3, 12.2 step 1, 13.3 step 3, 17.2 step 1, 22.1 step 2) |
| Standard (session default tier) | integration tasks: adapters, shell, views, screens, tools, CI/deploy config (tickets 01, 02, 09.4, 11.3, 18.3, 19.4, 20, 22.3, 23, 24) |
| Most-capable (`opus`; Fable when the session allows) | design-judgment / highest-risk: 05 (sim + hash), 06 (hit resolution), 07.2 (grab/throw), 08.2 (tickets), 10.2 (feral), 14.2–14.3 (locks/hazards), 15.1 (boss), 19.3 (replay golden), every task review of those, and the final whole-branch review |

Higgsfield / Recraft / Vercel MCP calls are made by the **orchestrator session itself** (subagents may not have the MCP tools); the implementer for an art task only runs the local pipeline steps once the sources are on disk.

## 4. Human-in-the-loop checkpoints (flag, never fake)

- ⛔ **Credit ceiling** (a number) before ticket 03 — no generation without it.
- ⛔ Owner reads: 06 (feel, boxes), 03 (art quality), 04 (palette look), 12 (hero in motion), 16 (boss), 14 (two timed runs), 22 (licence choices), 21 (final title + trademark lookup).
- ⛔ Anything outward-facing in 24: linking Vercel, first itch upload, pushing `main`, adding secrets. Confirm scope each time; approval in one step does not carry to the next.
- Plan conflicts found mid-build (a test that cannot pass as written, an MCP parameter that does not exist): stop the task, write the conflict in the ledger, ask. Do not silently redesign.
- Fix-loop breaker hit (round 5): owner decides park vs. escalate.

## 5. QA-tester gate (per phase)

Dispatch a fresh **QA-tester subagent** (standard or most-capable tier, never cheap) at each phase boundary. It writes `docs/qa/phase-<X>.md`: test cases derived from the phase's acceptance boxes + Discovery §6/§7, including regressions of earlier phases; then executes them (Vitest/Playwright where automated; documented browser steps otherwise) and records pass/fail per case. A phase is done only when every case passes or is parked with a written reason. Cases accumulate across phases into the regression suite.

## 6. Budget-aware phasing (Pro tier)

- One phase per session where possible; `/clear` between phases after rewriting `HANDOFF.md` (stage-in-progress form: phase, ledger pointer, next task, open threads). Compact at ~80 % context at a task boundary.
- Prefer `npm run check` + console output over screenshots; take screenshots only at the ⛔ look gates and for `docs/verification/`.
- Art tickets: run generations in one sitting per ticket against the monthly credit reset; record balance before/after in the `LICENSES.md` ledger.

## 7. Close-out (end of phase G)

1. Final **whole-branch review** on the most-capable model (`docs/build/reviews/final.md`) → one fix wave → `npm run check`, `npm run e2e`, `npm run audit:licenses` green.
2. Rewrite `HANDOFF.md` for Stage 7 (Design Critique, Sonnet 5, `impeccable`), then Stages 8–9 (Code Review / Security Review, Fable low effort), then Stage 10 (Deployment, `finishing-a-development-branch`: merge/PR/keep). Nothing merges to `main` before Stages 7–9 are approved.
3. Persist progress to the Obsidian vault (`Slag City/`) and auto-memory.

## 8. Commands cheat-sheet

```bash
npm run check                 # typecheck + lint + vitest + build (baseline gate, every task)
npm run dev                   # http://localhost:5173  (?pattern = CRT test card, ?failasset = SERVICE screen)
npm run art:atlas tools/art/manifests/<name>.json
npm run art:bg tools/art/manifests/bg-<section>.json
npm run fonts:build
UPDATE_GOLDENS=1 npm test     # only with an intended sim change; explain in the commit body
npm run build && npm run e2e  # Playwright smoke (browsers/temp on the E Drive)
npm run audit:licenses
```

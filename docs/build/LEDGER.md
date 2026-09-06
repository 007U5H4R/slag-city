# Build Ledger — SLAG CITY (Stage 6 Execution)

Resume point after any context reset or `/clear`. One row per task.
Status vocabulary: `todo` / `in-progress` / `review` / `fix-N` / `done` / `parked`.
Update after **every** task. `npm run check` must be green before the next task starts.

## Session / workspace notes

- **Branch:** `build/stage-1` (off unborn `main`). `main` is never committed to.
- **Worktree deviation (recorded 2026-09-06):** ExecutionPlaybook §0.2 specifies a
  separate worktree at `…/Slag City.build`. The repo had **zero commits**, so `main`
  was an unborn ref — a worktree (native `EnterWorktree` or `git worktree add`) cannot
  be based on a branch with no commits. Resolution: branch `build/stage-1` created
  **in place** in the primary directory. Every substantive guarantee holds (main
  untouched/unborn, first commit on `build/stage-1`, isolated branch). A separate
  directory would protect nothing (main has no tracked files). Approved by owner
  interaction at Stage 6 start.
- **Stage 5 sign-off:** all six plan decisions accepted as written.
- **Higgsfield credit ceiling:** ⛔ DEFERRED — owner to provide before ticket 03 (Phase B).
  No art generation until recorded here and in `assets/LICENSES.md`.

## Phase A — M1 combat core (boxes) · tickets 01 → 05 → 02 ∥ 20 → 06 → 07 ∥ 08 ∥ 09

| Task | Status | Model | Commit | Notes |
|------|--------|-------|--------|-------|
| planning docs | done | — | 10a555c | `docs: stage 1-5 planning artifacts` |
| build ledger  | done | — | (this)  | ledger + brief/report/review scaffolding |
| 01.1 Project init, toolchain, E-Drive caches | todo | standard (opus) | — | |
| 01.2 Pure integer-scale math + test | todo | standard (opus) | — | |
| 01.3 Boot blank canvas in a dark room | todo | standard (opus) | — | native-res framebuffer (decision 4) |
| 01.4 Core seed + Vitest without Phaser | todo | standard (opus) | — | |
| 01.5 ESLint core/adapter boundary rule | todo | standard (opus) | — | |
| 01.6 CI workflow | todo | standard (opus) | — | push only on owner ok (no remote yet) |
| **Ticket 01 gate** | todo | — | — | `npm run check` green; canvas renders; lint bites; CI |

_Later Phase A tickets (05, 02, 20, 06, 07, 08, 09) and Phases B–G expand here as reached._

## Open threads / parked items

- Push to a git remote / CI first run: repo has **no remote**. ⛔ confirm with owner before any push (ticket 01 gate, ticket 24).
- Credit ceiling (see above) before ticket 03.

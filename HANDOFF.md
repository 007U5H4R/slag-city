# HANDOFF — SLAG CITY (working title)

> Running baton for the build. **Rewrite this file at the end of every stage/task.**
> Not the notes of record — durable progress also goes to the Obsidian vault + auto-memory.

## Where we are

- **Stages complete:** 1 Product Discovery → `Discovery-PRD.md`; 2 Solution Design → `Solution-PRD.md`;
  3 UI/UX Design → `Design.md`; 4 Problem Breakdown → `tickets.md` + `.scratch/slag-city/issues/01–24`;
  **5 Technical Planning (2026-09-06) → `ImplementationPlan.md` + `ExecutionPlaybook.md` — awaiting sign-off.**
- **Status:** no code written. Repo is its own git repo at `/Volumes/E Drive/Dev/Code/Claude/Slag City`
  (confirmed: `git rev-parse --show-toplevel`), branch `main`, **zero commits**, everything untracked.
- **Toolchain on disk:** Node v26.7.0, npm 11.19.0, npm cache already at `/Volumes/E Drive/Dev/.caches/npm`,
  pnpm store on the E Drive. Higgsfield, Recraft, Vercel MCP servers are attached to the session.

## Stage 5 output summary

`ImplementationPlan.md` (~7,200 lines): header (goal, architecture, stack, Global Constraints copied verbatim from
the specs), six **plan decisions** to confirm at sign-off, a locked **file structure** (`src/core` pure TS,
`src/adapters/phaser`, `src/shell`, `tools/art`, `tools/fonts`, `test/`), the **shared core interfaces**
(`InputFrame`, `Entity`, `WorldState`, `SimEvent`, `tick`, `hashState`, `runReplay`), the **execution order**
(ticket DAG frontier: 01 → 05 → 02 ∥ 20 → 06 → 03 → 07 ∥ 08 ∥ 09 → 04 → 10 → 11 → 12 ∥ 13 ∥ 21 → 14 → 15 → 16 ∥ 17
→ 18 → 19 → 22 ∥ 23 → 24), then **one plan per ticket, all 24**, each broken into 2–5-minute TDD steps with exact
paths, real test code, real implementation code, browser verification steps and a commit per task. Human gates
(⛔) are marked inside the tickets. Placeholder scan: zero hits.

`ExecutionPlaybook.md`: worktree/branch (`build/stage-1`), ledger, brief/report files, one-implementer-per-task
loop, two-stage review + 5-round fix loop, model tiers per task, seven phases (A–G) with a QA-tester gate each,
the human checkpoints, budget phasing, close-out into Stages 7–10.

### Plan decisions that need the owner's yes/no at the gate

1. **One OFL font** (*Press Start 2P*) at 8 px and 16 px instead of two licensed pixel faces (`Design.md` §2.2).
2. **CRT toggle = `C`**, debug hitboxes = `H` (dev only).
3. `tick` mutates state in place; determinism is proven by `hashState` + replay goldens (not immutability).
4. Native-resolution framebuffer (`384k × 224k`, camera zoom k) so scanlines are 1 px per k rows.
5. Walkable band `y ∈ [128, 208]`, HUD band 16 px.
6. Faction hit rules (hero ↔ gang/boss/feral/crate; gang ↔ hero/feral; feral ↔ everyone but feral).
   Plus: boss phase-2 recolor is a palette swap of the phase-1 frames (no extra generations; torn socket only in
   `throw`/`tear-open`); `COIN` is a machine state overlaying ATTRACT.

## What this is

An **original, publishable arcade beat-'em-up** (one polished stage) replacing the frozen Cadillacs & Dinosaurs
emulator. Phaser 3 + Vite + TypeScript; all game logic in a framework-free TS core; 384×224 integer-scaled with a
CRT post-pass; hooks = hit-feel, salvage weapons, neutral feral machines; free browser demo on itch.io + Vercel;
art via Higgsfield (Nano Banana Pro → AutoSprite) → downscale → 64-colour palette; no Kling-backed model; licence
manifest from day one.

## Reusable inputs from the old project (nothing else)

- `../dino-arcade-pwa/js/rom-store.js` `openDB` (30 lines) — ported verbatim in plan Task 19.1 (`src/shell/kv-store.ts`).
- `../DESIGN.md` cabinet/marquee/bezel/vignette/start-gate spec — already folded into `Design.md`.

## Open questions (carried)

- **Final name** — decided in plan Task 21.1 (⛔ pick from the CLEAR list + USPTO/EUIPO lookup, Classes 9 & 41).
- **Higgsfield credit ceiling** (a number) — ⛔ required before plan Task 3.3; written into `assets/LICENSES.md`.
- Hero name, boss final name — `ENEMY_NAMES` working names are in plan Task 9.2; only that table changes.
- Licensed SFX / music packs — ⛔ plan Task 22.1.

## Next stage — 6, Execution (STOP for sign-off before starting)

- **Gate first:** the user approves Stage 5 (`ImplementationPlan.md` + `ExecutionPlaybook.md`) and answers the six
  plan decisions above.
- **Skill:** `superpowers:subagent-driven-development` (load `orchestration-playbook` first). **Model:** Opus 4.8
  (`claude-opus-4-8`), standard effort — confirm or adjust at the gate; a non-Claude session (`claudex`) is a
  per-session choice, raise it here if wanted.
- **Read first:** `ExecutionPlaybook.md` §0–§2, then this file, then `ImplementationPlan.md` header + Global
  Constraints + shared interfaces, then **ticket 01** only. Do not load the whole plan into context.
- **First actions:** create the worktree + `build/stage-1`; commit the planning docs; create
  `docs/build/LEDGER.md`; dispatch ticket 01 task 1.1.
- Then `/clear` and start Stage 6 in a fresh session, reading this `HANDOFF.md` first.

## Not yet done (open threads)

- Freeze the old emulator project in `../Game/` (commit dangling WIP, tag `freeze/dino-arcade-emulator-2026-09-05`,
  rewrite `Game/HANDOFF.md` to a FROZEN notice) — planned, not executed.
- Initial git commit of this repo — happens as the first commit on `build/stage-1` (playbook §0.2), only when the
  user says go.
- Obsidian vault note `Slag City/Progress.md` and auto-memory pointer were written at the end of Stage 5 (2026-09-06).

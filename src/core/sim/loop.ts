// src/core/sim/loop.ts
export const STEP_MS = 1000 / 60;
export const MAX_STEPS_PER_ADVANCE = 5;
/**
 * Float tolerance for the step-boundary comparison. STEP_MS = 1000/60 is not exactly
 * representable, so repeated subtraction leaves a residue a hair below STEP_MS and the
 * final step would be dropped (e.g. STEP_MS*3 yields 2 steps, not 3). Approved plan
 * deviation (2026-09-06): compare against STEP_MS - EPSILON. Pure IEEE-754 arithmetic,
 * so it stays deterministic across machines.
 */
const EPSILON = 1e-9;
export interface FixedStep { accumulator: number }
export function createFixedStep(): FixedStep { return { accumulator: 0 }; }
export function resetFixedStep(fs: FixedStep): void { fs.accumulator = 0; }
/** Adds dtMs, runs up to MAX_STEPS_PER_ADVANCE fixed steps, drops the excess. Returns steps run. */
export function advanceFixedStep(fs: FixedStep, dtMs: number, step: () => void): number {
  fs.accumulator = Math.min(fs.accumulator + dtMs, STEP_MS * MAX_STEPS_PER_ADVANCE);
  let n = 0;
  while (fs.accumulator >= STEP_MS - EPSILON && n < MAX_STEPS_PER_ADVANCE) {
    step(); fs.accumulator -= STEP_MS; n++;
  }
  if (n === MAX_STEPS_PER_ADVANCE) fs.accumulator = fs.accumulator % STEP_MS;
  return n;
}

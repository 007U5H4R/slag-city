// test/core/sim/loop.test.ts
import { describe, it, expect } from 'vitest';
import { createFixedStep, advanceFixedStep, STEP_MS, MAX_STEPS_PER_ADVANCE } from '@core/sim/loop';

describe('fixed step', () => {
  it('runs one step per 16.67ms', () => {
    const fs = createFixedStep();
    let n = 0;
    expect(advanceFixedStep(fs, STEP_MS * 3, () => n++)).toBe(3);
    expect(n).toBe(3);
  });
  it('carries the remainder', () => {
    const fs = createFixedStep();
    let n = 0;
    advanceFixedStep(fs, STEP_MS * 1.5, () => n++);
    advanceFixedStep(fs, STEP_MS * 0.5, () => n++);
    expect(n).toBe(2);
  });
  it('caps a huge delta (tab was hidden) to MAX_STEPS_PER_ADVANCE', () => {
    const fs = createFixedStep();
    let n = 0;
    expect(advanceFixedStep(fs, 60_000, () => n++)).toBe(MAX_STEPS_PER_ADVANCE);
    expect(fs.accumulator).toBeLessThan(STEP_MS);
  });
});

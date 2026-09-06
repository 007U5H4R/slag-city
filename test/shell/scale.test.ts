// test/shell/scale.test.ts
import { describe, it, expect } from 'vitest';
import { computeIntegerScale } from '@shell/scale';

describe('computeIntegerScale', () => {
  it('gives x4 at 1080p with no chrome (224*4 = 896 <= 1080)', () => {
    expect(computeIntegerScale(1920, 1080)).toBe(4);
  });
  it('gives x3 at 1080p once cabinet chrome takes 200px', () => {
    expect(computeIntegerScale(1920, 1080, 200)).toBe(3);
  });
  it('gives x5 at 1440p with 200px chrome', () => {
    expect(computeIntegerScale(2560, 1440, 200)).toBe(5);
  });
  it('never returns a fraction and never below 1', () => {
    expect(computeIntegerScale(500, 300)).toBe(1);
    expect(computeIntegerScale(100, 100)).toBe(1);
    expect(Number.isInteger(computeIntegerScale(1234, 777))).toBe(true);
  });
  it('is limited by the tighter axis', () => {
    expect(computeIntegerScale(3840, 600)).toBe(2);
    expect(computeIntegerScale(800, 2000)).toBe(2);
  });
});

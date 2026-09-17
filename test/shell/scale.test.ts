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

import { computeMobileScale } from '@shell/scale';
describe('computeMobileScale', () => {
  it('renders phones at ~device density, clamped 2..3, regardless of boot orientation', () => {
    expect(computeMobileScale(812, 375, 3)).toBe(3);   // iPhone landscape: 643 css px × 3 dpr → clamp 3
    expect(computeMobileScale(375, 812, 3)).toBe(3);   // same phone booted in portrait
    expect(computeMobileScale(667, 375, 2)).toBe(3);   // 643 × 2 / 384 = 3.3 → 3 (clamped)
    expect(computeMobileScale(568, 320, 1)).toBe(2);   // low-density: never below 2 (k=1 text was mush)
    expect(computeMobileScale(812, 375, 0)).toBe(2);   // bogus dpr → treated as 1
  });
});

import { chooseCabinet } from '@shell/scale';
describe('chooseCabinet', () => {
  const FULL = 224, COMPACT = 48;
  it('drops the marquee + panel when that gains a whole scale step (typical laptops)', () => {
    expect(chooseCabinet(1440, 780, FULL, COMPACT)).toEqual({ k: 3, compact: true });  // was ×2 with the full cabinet
    expect(chooseCabinet(1366, 650, FULL, COMPACT)).toEqual({ k: 2, compact: true });  // was ×1
  });
  it('keeps the full cabinet when it costs nothing', () => {
    expect(chooseCabinet(1600, 900, FULL, COMPACT)).toEqual({ k: 3, compact: false });  // ×3 either way
    expect(chooseCabinet(1920, 1130, FULL, COMPACT)).toEqual({ k: 4, compact: false }); // ×4 either way
    expect(chooseCabinet(1920, 1000, FULL, COMPACT)).toEqual({ k: 4, compact: true });  // …but here compact gains ×3→×4
  });
  it('is width-limited before it is height-limited on narrow windows', () => {
    expect(chooseCabinet(800, 1200, FULL, COMPACT)).toEqual({ k: 2, compact: false });
  });
});

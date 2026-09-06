// test/core/sim/rng.test.ts
import { describe, it, expect } from 'vitest';
import { createRng, rngNext, rngInt } from '@core/sim/rng';

describe('rng (mulberry32)', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(1234), b = createRng(1234);
    const sa = Array.from({ length: 5 }, () => rngNext(a));
    const sb = Array.from({ length: 5 }, () => rngNext(b));
    expect(sa).toEqual(sb);
    expect(sa.every((v) => v >= 0 && v < 1)).toBe(true);
  });
  it('differs across seeds', () => {
    expect(rngNext(createRng(1))).not.toBe(rngNext(createRng(2)));
  });
  it('rngInt is inclusive of both bounds', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rngInt(r, 0, 3));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
});

// test/core/entities/items.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnCrate, spawnPickup, LUNCHPAIL_HEAL } from '@core/entities/items';
import { SCORE } from '@core/arcade/score';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };

describe('crates and pickups', () => {
  it('a hit breaks the crate and drops its contents', () => {
    const w = createWorld(1); const h = heroOf(w);
    const c = spawnCrate(w, h.pos.x + 20, h.pos.y, 'lunchpail');
    tick(w, inp({ attack: true })); run(w, 20);
    expect(w.entities.includes(c)).toBe(false);
    const p = w.entities.find((e) => e.kind === 'pickup');
    expect(p?.pickupKind).toBe('lunchpail');
    expect(w.score).toBe(SCORE.hit + SCORE.crate);
  });
  it('lunch pail heals, clamped to maxHp; gear adds points', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.hp = 90;
    spawnPickup(w, 'lunchpail', h.pos.x + 10, h.pos.y);
    run(w, 3);
    expect(h.hp).toBe(100);
    expect(LUNCHPAIL_HEAL).toBe(40);
    spawnPickup(w, 'gear', h.pos.x + 10, h.pos.y);
    run(w, 3);
    expect(w.score).toBe(SCORE.gear);
    expect(w.entities.filter((e) => e.kind === 'pickup')).toHaveLength(0);
  });
  it('pickups are not collected across the depth tolerance', () => {
    const w = createWorld(1); const h = heroOf(w);
    spawnPickup(w, 'gear', h.pos.x, h.pos.y + 20);
    run(w, 3);
    expect(w.score).toBe(0);
  });
});

// test/core/entities/hero-locomotion.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, WALK_BAND } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HERO_DATA } from '@core/combat/frame-data';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });

describe('hero locomotion', () => {
  it('walks right at walkSpeed.x and faces right', () => {
    const w = createWorld(1); const h = heroOf(w); const x0 = h.pos.x;
    tick(w, inp({ right: true }));
    expect(h.state).toBe('walk');
    expect(h.pos.x).toBeCloseTo(x0 + HERO_DATA.walkSpeed.x);
    expect(h.facing).toBe(1);
  });
  it('faces left when walking left and returns to idle when released', () => {
    const w = createWorld(1); const h = heroOf(w);
    tick(w, inp({ left: true }));
    expect(h.facing).toBe(-1);
    tick(w, EMPTY_INPUT);
    expect(h.state).toBe('idle');
  });
  it('changes depth with up/down and is clamped to the band', () => {
    const w = createWorld(1); const h = heroOf(w);
    for (let i = 0; i < 200; i++) tick(w, inp({ up: true }));
    expect(h.pos.y).toBe(WALK_BAND.minY);
    for (let i = 0; i < 200; i++) tick(w, inp({ down: true }));
    expect(h.pos.y).toBe(WALK_BAND.maxY);
  });
  it('jumps on a jump press edge, keeps takeoff velocity, lands to idle', () => {
    const w = createWorld(1); const h = heroOf(w);
    tick(w, inp({ right: true, jump: true }));
    expect(h.state).toBe('jump');
    expect(h.vel.z).toBeGreaterThan(0);
    let frames = 1;
    while (h.state === 'jump' && frames < 200) { tick(w, inp({ right: true, jump: true })); frames++; }
    expect(h.state).toBe('walk');
    expect(frames).toBeGreaterThan(30);
    expect(frames).toBeLessThan(45);
  });
  it('does not re-jump while jump is held', () => {
    const w = createWorld(1); const h = heroOf(w);
    tick(w, inp({ jump: true }));
    while (h.state === 'jump') tick(w, inp({ jump: true }));
    expect(h.state).toBe('idle');
  });
});

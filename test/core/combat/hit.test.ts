// test/core/combat/hit.test.ts
import { describe, it, expect } from 'vitest';
import { createEntity } from '@core/sim/entity';
import { hitConnects, worldRect, DEPTH_TOLERANCE } from '@core/combat/hit';

const hitbox = { x: 8, y: 24, w: 26, h: 16 };
const hurtbox = { x: -10, y: 0, w: 20, h: 56 };

describe('hit rule', () => {
  it('flips the hitbox with facing', () => {
    const e = createEntity(1, 'hero', 100, 160);
    expect(worldRect(e, hitbox)).toEqual({ x1: 108, x2: 134, z1: 24, z2: 40 });
    e.facing = -1;
    expect(worldRect(e, hitbox)).toEqual({ x1: 66, x2: 92, z1: 24, z2: 40 });
  });
  it('connects at |dy| = 8 and not at 9 (boundary)', () => {
    const a = createEntity(1, 'hero', 100, 160);
    const v = createEntity(2, 'brawler', 120, 160 + DEPTH_TOLERANCE);
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(true);
    v.pos.y = 160 + DEPTH_TOLERANCE + 1;
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
    v.pos.y = 160 - DEPTH_TOLERANCE;
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(true);
  });
  it('requires x overlap and vertical (z) overlap', () => {
    const a = createEntity(1, 'hero', 100, 160);
    const v = createEntity(2, 'brawler', 200, 160);
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
    v.pos.x = 120; v.pos.z = 41; // hurtbox 41..97 vs hitbox 24..40 → no overlap
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
    v.pos.z = 39;
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(true);
  });
  it('touching edges do not count as overlap', () => {
    const a = createEntity(1, 'hero', 100, 160);
    const v = createEntity(2, 'brawler', 144, 160); // hurtbox x1 = 134 == hitbox x2
    expect(hitConnects(a, hitbox, v, hurtbox)).toBe(false);
  });
});

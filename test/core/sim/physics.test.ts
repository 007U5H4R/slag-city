// test/core/sim/physics.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, spawn, WALK_BAND } from '@core/sim/state';
import { applyPhysics, GRAVITY } from '@core/sim/physics';

describe('physics', () => {
  it('applies gravity and lands at z=0', () => {
    const w = createWorld(1);
    const e = spawn(w, 'brawler', 100, 160);
    e.vel.z = 4.5;
    let frames = 0;
    do { applyPhysics(w); frames++; } while (e.pos.z > 0 && frames < 200);
    expect(e.pos.z).toBe(0);
    expect(e.vel.z).toBe(0);
    // vz 4.5, gravity 0.25: z after n frames = 4.5n - 0.125n(n+1) = 0 at n = 35 (exact in binary floats)
    expect(GRAVITY).toBe(0.25);
    expect(frames).toBe(35);
  });
  it('clamps y to the walkable band and moves by velocity', () => {
    const w = createWorld(1);
    const e = spawn(w, 'brawler', 100, 130);
    e.vel = { x: 2, y: -5, z: 0 };
    applyPhysics(w);
    expect(e.pos.x).toBe(102);
    expect(e.pos.y).toBe(WALK_BAND.minY);
    e.vel = { x: 0, y: 500, z: 0 };
    applyPhysics(w);
    expect(e.pos.y).toBe(WALK_BAND.maxY);
  });
  it('does not clamp projectiles to the band', () => {
    const w = createWorld(1);
    const p = spawn(w, 'projectile', 100, 100);
    applyPhysics(w);
    expect(p.pos.y).toBe(100);
  });
});

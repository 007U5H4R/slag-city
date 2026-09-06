// src/core/sim/physics.ts
import type { WorldState } from './state';
import { WALK_BAND } from './state';

export const GRAVITY = 0.25;

export function applyPhysics(state: WorldState): void {
  for (const e of state.entities) {
    if (e.pos.z > 0 || e.vel.z > 0) {
      e.vel.z -= GRAVITY;
      e.pos.z += e.vel.z;
      if (e.pos.z <= 0) { e.pos.z = 0; e.vel.z = 0; }
    }
    e.pos.x += e.vel.x;
    e.pos.y += e.vel.y;
    if (e.kind !== 'projectile') {
      e.pos.y = Math.max(WALK_BAND.minY, Math.min(WALK_BAND.maxY, e.pos.y));
    }
  }
}

// src/core/combat/hit.ts
import type { Rect } from '../types';
import type { Entity } from '../sim/entity';

/** Hit rule (Solution-PRD §3): boxes overlap in x and z, and |Δy| ≤ DEPTH_TOLERANCE. */
export const DEPTH_TOLERANCE = 8;
export interface WorldBox { x1: number; x2: number; z1: number; z2: number }

export function worldRect(e: Entity, r: Rect): WorldBox {
  const x1 = e.facing === 1 ? e.pos.x + r.x : e.pos.x - r.x - r.w;
  return { x1, x2: x1 + r.w, z1: e.pos.z + r.y, z2: e.pos.z + r.y + r.h };
}
export function boxesOverlap(a: WorldBox, b: WorldBox): boolean {
  return a.x1 < b.x2 && b.x1 < a.x2 && a.z1 < b.z2 && b.z1 < a.z2;
}
export function hitConnects(att: Entity, hitbox: Rect, vic: Entity, hurtbox: Rect): boolean {
  if (Math.abs(att.pos.y - vic.pos.y) > DEPTH_TOLERANCE) return false;
  return boxesOverlap(worldRect(att, hitbox), worldRect(vic, hurtbox));
}

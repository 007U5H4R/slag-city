// src/core/entities/items.ts
import type { InputFrame } from '../types';
import type { Entity, PickupKind } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit, heroOf, spawn } from '../sim/state';
import { DEPTH_TOLERANCE } from '../combat/hit';
import { SCORE } from '../arcade/score';

export const LUNCHPAIL_HEAL = 40;
export const PICKUP_RADIUS = { x: 12, y: DEPTH_TOLERANCE } as const;
// z-height 40 (not the plan's 24): the hero's attack hitboxes sit at z 24–44 (attack1/2 [24,40],
// attack3 [20,44], jumpAttack [12,40]); a 24-tall hurtbox [0,24] only abuts them (boxesOverlap uses
// strict `<`) so every punch whiffed over the crate. 40 makes the crate hittable by the whole combo.
// ORCH DEVIATION (owner-ratifiable): resolves a plan-internal contradiction (crate height vs attack z-offset).
export const CRATE_HURTBOX = { x: -12, y: 0, w: 24, h: 40 } as const;

export function spawnCrate(state: WorldState, x: number, y: number, contents: PickupKind): Entity {
  const c = spawn(state, 'crate', x, y);
  c.hp = 1; c.maxHp = 1; c.pickupKind = contents;
  return c;
}
export function spawnPickup(state: WorldState, kind: PickupKind, x: number, y: number): Entity {
  const p = spawn(state, 'pickup', x, y);
  p.pickupKind = kind;
  return p;
}

export function updateCrate(state: WorldState, c: Entity, _input: InputFrame): void {
  c.stateFrame++;
  if (c.state === 'break' && c.stateFrame === 1) {
    state.score += SCORE.crate;
    emit(state, { type: 'score', amount: SCORE.crate, x: c.pos.x, y: c.pos.y - 24 });
    emit(state, { type: 'sfx', id: 'crate' });
    spawnPickup(state, c.pickupKind ?? 'gear', c.pos.x, c.pos.y);
    c.dead = true;
  }
}

export function updatePickup(state: WorldState, p: Entity, _input: InputFrame): void {
  p.stateFrame++;
  const hero = heroOf(state);
  if (hero.pos.z > 0 || hero.state === 'dead') return;
  if (Math.abs(hero.pos.x - p.pos.x) > PICKUP_RADIUS.x || Math.abs(hero.pos.y - p.pos.y) > PICKUP_RADIUS.y) return;
  if (p.pickupKind === 'lunchpail') hero.hp = Math.min(hero.maxHp, hero.hp + LUNCHPAIL_HEAL);
  else { state.score += SCORE.gear; emit(state, { type: 'score', amount: SCORE.gear, x: p.pos.x, y: p.pos.y - 24 }); }
  emit(state, { type: 'pickup', kind: p.pickupKind ?? 'gear', x: p.pos.x, y: p.pos.y });
  emit(state, { type: 'sfx', id: 'pickup' });
  p.dead = true;
}

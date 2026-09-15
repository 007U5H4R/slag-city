// src/core/entities/items.ts
import type { Facing, InputFrame } from '../types';
import type { Entity, Faction, PickupKind, WeaponKind } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit, heroOf, spawn } from '../sim/state';
import type { MoveData } from '../combat/frame-data';
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
export function spawnWeaponPickup(state: WorldState, kind: WeaponKind, x: number, y: number, heat: number): Entity {
  const p = spawn(state, 'weaponPickup', x, y);
  p.weapon = { kind, heat }; p.weaponKind = kind;
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

export const PROJECTILE_SPEED = { cannon: 6, glob: 3 } as const;
export const PROJECTILE_LIFE = 60;
export const PROJECTILE_MOVES: Record<'cannon' | 'glob', MoveData> = {
  cannon: { startup: 0, active: 1, recovery: 0, hitbox: { x: -4, y: -4, w: 8, h: 8 }, damage: 14, level: 'heavy', pushback: 4 },
  glob:   { startup: 0, active: 1, recovery: 0, hitbox: { x: -6, y: -6, w: 12, h: 12 }, damage: 10, level: 'heavy', pushback: 3 },
};
export function spawnProjectile(state: WorldState, kind: 'cannon' | 'glob', x: number, y: number, z: number, dir: Facing, owner: Faction): Entity {
  const p = spawn(state, 'projectile', x, y);
  p.state = kind; p.pos.z = z; p.vel.x = PROJECTILE_SPEED[kind] * dir; p.facing = dir; p.ownerFaction = owner; p.removeIn = PROJECTILE_LIFE;
  return p;
}
export function updateProjectile(state: WorldState, p: Entity, _input: InputFrame): void {
  p.stateFrame++;
  if (p.state === 'glob') { if (p.pos.z > 0) { /* gravity handled by physics */ } else p.dead = true; }
  if (p.hitIds.length > 0) p.dead = true;   // one hit per projectile
  if (p.pos.x < state.camera.x - 16 || p.pos.x > state.camera.x + 400) p.dead = true;
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

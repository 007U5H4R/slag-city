// src/core/entities/gang.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { byId, heroOf, spawn } from '../sim/state';
import type { ActorData } from '../combat/frame-data';
import { registerActorData, moveTotal } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { DEPTH_TOLERANCE } from '../combat/hit';

export type GangKind = 'brawler' | 'knife' | 'heavy';
export interface GangData extends ActorData { reach: number; attackCooldown: number; attackMove: string; superArmour?: boolean }

export const GANG_DATA: Record<GangKind, GangData> = {
  brawler: {
    walkSpeed: { x: 1, y: 0.75 }, hp: 30, hurtbox: { x: -11, y: 0, w: 22, h: 56 }, jumpVz: 0,
    reach: 30, attackCooldown: 40, attackMove: 'punch',
    moves: { punch: { startup: 10, active: 4, recovery: 16, hitbox: { x: 6, y: 28, w: 24, h: 16 }, damage: 8, level: 'light', pushback: 2 } },
  },
  knife: {
    walkSpeed: { x: 1.8, y: 1.1 }, hp: 18, hurtbox: { x: -8, y: 0, w: 16, h: 52 }, jumpVz: 0,
    reach: 26, attackCooldown: 30, attackMove: 'stab',
    moves: { stab: { startup: 6, active: 3, recovery: 12, hitbox: { x: 4, y: 24, w: 22, h: 12 }, damage: 6, level: 'light', pushback: 1 } },
  },
  heavy: {
    walkSpeed: { x: 0.7, y: 0.5 }, hp: 60, hurtbox: { x: -15, y: 0, w: 30, h: 60 }, jumpVz: 0,
    reach: 34, attackCooldown: 60, attackMove: 'slam', superArmour: true,
    moves: { slam: { startup: 22, active: 5, recovery: 24, hitbox: { x: 6, y: 8, w: 34, h: 32 }, damage: 14, level: 'heavy', pushback: 4 } },
  },
};
for (const k of Object.keys(GANG_DATA) as GangKind[]) registerActorData(k, GANG_DATA[k]);

export function spawnGang(state: WorldState, kind: GangKind, x: number, y: number, variant = 0): Entity {
  const e = spawn(state, kind, x, y);
  const d = GANG_DATA[kind];
  e.hp = d.hp; e.maxHp = d.hp; e.targetId = state.heroId;
  e.variant = variant;
  return e;
}

/** Move toward (tx, ty) at the actor's walk speed; returns true when within reach in x and within depth tolerance. */
export function approach(e: Entity, d: ActorData, tx: number, ty: number, reach: number): boolean {
  const dx = tx - e.pos.x, dy = ty - e.pos.y;
  e.facing = dx >= 0 ? 1 : -1;
  const inX = Math.abs(dx) <= reach, inY = Math.abs(dy) <= DEPTH_TOLERANCE;
  e.vel.x = inX ? 0 : Math.sign(dx) * d.walkSpeed.x * e.speedMul;
  e.vel.y = inY ? 0 : Math.sign(dy) * d.walkSpeed.y * e.speedMul;
  return inX && inY;
}

export function updateGang(state: WorldState, e: Entity, _input: InputFrame): void {
  e.stateFrame++;
  if (updateStunState(state, e)) return;
  const d = GANG_DATA[e.kind as GangKind];
  const target = byId(state, e.targetId) ?? heroOf(state);
  const move = d.moves[e.state];
  if (move) {
    e.vel.x = 0; e.vel.y = 0;
    if (e.stateFrame >= moveTotal(move)) { setState(e, 'idle'); e.cooldown = d.attackCooldown; }
    return;
  }
  switch (e.state) {
    case 'idle':
      e.vel.x = 0; e.vel.y = 0;
      if (e.cooldown === 0) setState(e, 'approach');
      break;
    case 'approach': {
      const inRange = approach(e, d, target.pos.x, target.pos.y, d.reach);
      if (inRange) { setState(e, d.attackMove); if (d.superArmour) e.armorFrames = d.moves[d.attackMove]!.startup; e.vel.x = 0; e.vel.y = 0; }
      break;
    }
    default:
      setState(e, 'idle');
  }
}

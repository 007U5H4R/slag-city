// src/core/entities/feral.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { byId, emit, spawn } from '../sim/state';
import type { ActorData } from '../combat/frame-data';
import { registerActorData, moveTotal } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { nearestBody } from '../ai/targeting';
import { approach } from './gang';
import { spawnWeaponPickup } from './items';
import { WEAPON_HEAT } from '../weapons/heat';

export const FERAL_EMERGE_FRAMES = 20;
export const FERAL_DATA: ActorData & { reach: number; attackCooldown: number } = {
  // hurtbox height 44 (not 28): a 28-tall box sits at z[0,28] and the brawler punch hitbox at z[28,44]
  // only ABUTS it (boxesOverlap is strict `<`), so brawlers could never damage the feral — contradicting
  // the ticket premise "both sides can kill it". 44 makes every gang + hero attack connect. Owner-ratified
  // tuning, same class as the ticket-09 CRATE_HURTBOX 24→40 fix. (Plan §10.2 to be patched to match.)
  walkSpeed: { x: 1.4, y: 1 }, hp: 40, hurtbox: { x: -20, y: 0, w: 40, h: 44 }, jumpVz: 0,
  reach: 44, attackCooldown: 50,
  moves: { pounce: { startup: 14, active: 10, recovery: 20, hitbox: { x: -6, y: 0, w: 40, h: 30 }, damage: 12, level: 'heavy', pushback: 4 } },
};
registerActorData('feral', FERAL_DATA);

export function spawnFeral(state: WorldState, x: number, y: number): Entity {
  const f = spawn(state, 'feral', x, y);
  f.hp = FERAL_DATA.hp; f.maxHp = FERAL_DATA.hp;
  f.weaponKind = 'cannon';                 // the drop it carries
  setState(f, 'emerge'); f.invulnFrames = FERAL_EMERGE_FRAMES;
  emit(state, { type: 'sfx', id: 'feral_emerge' });
  return f;
}

export function updateFeral(state: WorldState, e: Entity, _input: InputFrame): void {
  e.stateFrame++;
  const stunned = updateStunState(state, e);
  if (e.state === 'dead' && e.weaponKind) {          // drop exactly once
    spawnWeaponPickup(state, 'cannon', e.pos.x, e.pos.y, WEAPON_HEAT.cannon);
    e.weaponKind = null;
    emit(state, { type: 'sfx', id: 'weapon_drop' });
  }
  if (stunned) return;
  const current = byId(state, e.targetId);
  if (!current || current.dead || current.state === 'dead') e.targetId = nearestBody(state, e)?.id ?? null;
  const target = byId(state, e.targetId);
  const move = FERAL_DATA.moves[e.state];
  if (move) {
    if (e.stateFrame === move.startup + 1) { e.vel.x = 3 * e.facing; e.vel.z = 2; }   // leap on the first active frame
    if (e.stateFrame > move.startup + move.active) e.vel.x = 0;
    if (e.stateFrame >= moveTotal(move)) { setState(e, 'idle'); e.cooldown = FERAL_DATA.attackCooldown; }
    return;
  }
  switch (e.state) {
    case 'emerge':
      e.vel.x = 0; e.vel.y = 0;
      if (e.stateFrame >= FERAL_EMERGE_FRAMES) setState(e, 'idle');
      break;
    case 'idle':
      e.vel.x = 0; e.vel.y = 0;
      if (e.cooldown === 0 && target) setState(e, 'stalk');
      break;
    case 'stalk': {
      if (!target) { setState(e, 'idle'); break; }
      e.targetId = nearestBody(state, e)?.id ?? e.targetId;   // always the nearest body, no faction preference
      const t = byId(state, e.targetId) ?? target;
      if (approach(e, FERAL_DATA, t.pos.x, t.pos.y, FERAL_DATA.reach)) { setState(e, 'pounce'); e.vel.x = 0; e.vel.y = 0; }
      break;
    }
    default:
      setState(e, 'idle');
  }
}

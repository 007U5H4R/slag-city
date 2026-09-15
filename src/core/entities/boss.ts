// src/core/entities/boss.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit, heroOf, spawn } from '../sim/state';
import type { ActorData } from '../combat/frame-data';
import { registerActorData, moveTotal } from '../combat/frame-data';
import { updateStunState } from '../combat/stun';
import { approach } from './gang';
import { spawnProjectile, spawnWeaponPickup } from './items';
import { WEAPON_HEAT } from '../weapons/heat';
import { rngNext } from '../sim/rng';
import { SCORE } from '../arcade/score';

export const BOSS_PHASE2_AT = 0.5;
export const BOSS_PHASE2_SPEED = 1.3;
export const TEAR_OPEN_FRAMES = 60;
export const DYING_FRAMES = 90;

export const BOSS_DATA: ActorData & { reach: number; attackCooldown: number } = {
  walkSpeed: { x: 0.6, y: 0.4 }, hp: 300, hurtbox: { x: -24, y: 0, w: 48, h: 120 }, jumpVz: 0,
  reach: 64, attackCooldown: 50,
  moves: {
    swing:     { startup: 20, active: 6, recovery: 26, hitbox: { x: 10, y: 20, w: 64, h: 50 }, damage: 16, level: 'heavy', pushback: 5 },
    pound:     { startup: 26, active: 6, recovery: 34, hitbox: { x: -30, y: 0, w: 110, h: 24 }, damage: 20, level: 'launch', pushback: 6 },
    throwGlob: { startup: 18, active: 1, recovery: 30, hitbox: { x: 0, y: 0, w: 0, h: 0 }, damage: 0, level: 'light', pushback: 0 },
  },
};
registerActorData('boss', BOSS_DATA);

export function spawnBoss(state: WorldState, x: number, y: number): Entity {
  const b = spawn(state, 'boss', x, y);
  b.hp = BOSS_DATA.hp; b.maxHp = BOSS_DATA.hp; b.targetId = state.heroId;
  b.weaponKind = 'blade';   // the arm it will tear off
  return b;
}

export function updateBoss(state: WorldState, b: Entity, _input: InputFrame): void {
  b.stateFrame++;
  const hero = heroOf(state);
  if (b.state === 'dying') {
    b.vel.x = 0; b.vel.y = 0;
    if (b.stateFrame >= DYING_FRAMES) { setState(b, 'dead'); b.removeIn = 60; }
    return;
  }
  if (b.state === 'dead') return;
  if (b.hp <= 0) {
    setState(b, 'dying'); b.invulnFrames = 9999;
    state.stage.bossDefeated = true; state.score += SCORE.boss;
    emit(state, { type: 'bossDefeated' }); emit(state, { type: 'sfx', id: 'boss_death' });
    return;
  }
  if (b.state === 'tearOpen') {
    b.vel.x = 0; b.vel.y = 0;
    if (b.stateFrame >= TEAR_OPEN_FRAMES) {
      b.phase = 2; b.speedMul = BOSS_PHASE2_SPEED; b.tint = true; b.invulnFrames = 0;
      if (b.weaponKind === 'blade') { spawnWeaponPickup(state, 'blade', b.pos.x - b.facing * 40, b.pos.y, WEAPON_HEAT.blade); b.weaponKind = null; }
      emit(state, { type: 'bossPhase2' }); emit(state, { type: 'sfx', id: 'boss_phase2' });
      setState(b, 'idle'); b.cooldown = 20;
    }
    return;
  }
  if (b.phase === 1 && b.hp <= BOSS_DATA.hp * BOSS_PHASE2_AT) {
    setState(b, 'tearOpen'); b.invulnFrames = TEAR_OPEN_FRAMES; b.vel.x = 0; b.vel.y = 0;
    emit(state, { type: 'sfx', id: 'boss_tear' });
    return;
  }
  if (updateStunState(state, b)) return;
  const move = BOSS_DATA.moves[b.state];
  if (move) {
    b.vel.x = 0; b.vel.y = 0;
    if (b.state === 'throwGlob' && b.stateFrame === move.startup + 1) {
      const p = spawnProjectile(state, 'glob', b.pos.x + b.facing * 30, b.pos.y, 70, b.facing, 'gang');
      p.vel.z = 2.5; emit(state, { type: 'sfx', id: 'glob' });
    }
    if (b.stateFrame >= moveTotal(move)) { setState(b, 'idle'); b.cooldown = Math.round(BOSS_DATA.attackCooldown / b.speedMul); }
    return;
  }
  switch (b.state) {
    case 'idle':
      b.vel.x = 0; b.vel.y = 0; b.facing = hero.pos.x >= b.pos.x ? 1 : -1;
      if (b.cooldown === 0) {
        const far = Math.abs(hero.pos.x - b.pos.x) > 120;
        if (b.phase === 2 && far && rngNext(state.rng) < 0.6) setState(b, 'throwGlob');
        else setState(b, 'approach');
      }
      break;
    case 'approach': {
      if (approach(b, BOSS_DATA, hero.pos.x, hero.pos.y, BOSS_DATA.reach)) {
        const mv = rngNext(state.rng) < 0.5 ? 'swing' : 'pound';
        setState(b, mv); b.armorFrames = BOSS_DATA.moves[mv]!.startup; b.vel.x = 0; b.vel.y = 0;
      }
      break;
    }
    default:
      setState(b, 'idle');
  }
}

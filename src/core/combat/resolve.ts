// src/core/combat/resolve.ts
import type { Facing } from '../types';
import type { Entity } from '../sim/entity';
import { faction, setState, isBody } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import type { MoveData } from './frame-data';
import { dataFor } from './frame-data';
import { hitConnects } from './hit';
import { HIT_FEEL } from './hit-feel';
import { SCORE } from '../arcade/score';

export function activeMove(e: Entity): MoveData | null {
  if (!isBody(e)) return null;
  const m = dataFor(e.kind).moves[e.state];
  if (!m) return null;
  const f = e.stateFrame;
  return f > m.startup && f <= m.startup + m.active ? m : null;
}

export function canHit(att: Entity, vic: Entity): boolean {
  if (att.id === vic.id || vic.dead) return false;
  const fa = faction(att), fv = faction(vic);
  if (vic.kind === 'crate') return fa === 'hero';
  if (!isBody(vic)) return false;
  if (fa === 'feral') return fv !== 'feral';
  if (fa === 'hero') return fv === 'gang' || fv === 'feral';
  if (fa === 'gang') return fv === 'hero' || fv === 'feral';
  return false;
}

export function applyKnockdown(state: WorldState, vic: Entity, dir: Facing): void {
  setState(vic, 'knockdown');
  vic.vel.z = HIT_FEEL.launch.vz;
  vic.vel.x = HIT_FEEL.launch.vx * dir;
  vic.vel.y = 0;
  vic.hitstun = 0;
  vic.facing = (dir * -1) as Facing; // face the attacker
  emit(state, { type: 'sfx', id: 'knockdown' });
}

export function applyHit(state: WorldState, att: Entity, vic: Entity, move: MoveData): void {
  const dir: Facing = att.pos.x <= vic.pos.x ? 1 : -1;
  vic.hp -= move.damage;
  vic.flashFrames = HIT_FEEL.flashFrames;
  state.hitstop = Math.max(state.hitstop, HIT_FEEL.hitstop[move.level]);
  const px = HIT_FEEL.shakePx[move.level];
  if (px > 0) state.shake = { frames: HIT_FEEL.shakeFrames, px };
  if (att.kind === 'hero' || att.kind === 'projectile' && att.ownerFaction === 'hero') {
    state.score += SCORE.hit;
    emit(state, { type: 'score', amount: SCORE.hit, x: vic.pos.x, y: vic.pos.y - vic.pos.z - 40 });
  }
  emit(state, { type: 'hit', attackerId: att.id, victimId: vic.id, level: move.level, x: vic.pos.x, y: vic.pos.y - vic.pos.z - 30, damage: move.damage });
  emit(state, { type: 'sfx', id: `hit_${move.level}` });
  if (vic.kind === 'crate') { if (vic.hp <= 0) setState(vic, 'break'); return; }
  if (vic.armorFrames > 0 && vic.hp > 0) return;          // super-armour: damage only
  if (move.level === 'launch' || vic.hp <= 0 || vic.pos.z > 0) { applyKnockdown(state, vic, dir); return; }
  setState(vic, 'hurt');
  vic.hitstun = HIT_FEEL.hitstun[move.level === 'heavy' ? 'heavy' : 'light'];
  vic.vel.x = move.pushback * dir; vic.vel.y = 0;
}

export function resolveHits(state: WorldState): void {
  for (const att of state.entities) {
    const move = activeMove(att);
    if (!move) continue;
    for (const vic of state.entities) {
      if (!canHit(att, vic) || att.hitIds.includes(vic.id) || vic.invulnFrames > 0) continue;
      const hurt = vic.kind === 'crate' ? { x: -12, y: 0, w: 24, h: 24 } : dataFor(vic.kind).hurtbox;
      if (!hitConnects(att, move.hitbox, vic, hurt)) continue;
      att.hitIds.push(vic.id);
      applyHit(state, att, vic, move);
    }
  }
}

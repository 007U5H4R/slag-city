// src/core/combat/stun.ts
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import { HIT_FEEL } from './hit-feel';
import { SCORE } from '../arcade/score';

/** Shared hurt/knockdown/down/getup/dead handling. Call after stateFrame++. Returns true if e was in a stun state. */
export function updateStunState(state: WorldState, e: Entity): boolean {
  switch (e.state) {
    case 'hurt':
      e.vel.x *= 0.8;
      if (e.hitstun <= 0) { e.vel.x = 0; setState(e, 'idle'); }
      return true;
    case 'knockdown':
      if (e.stateFrame > 1 && e.pos.z === 0) {
        e.vel.x = 0;
        if (e.hp <= 0) {
          setState(e, 'dead');
          if (e.kind !== 'hero') { e.removeIn = 40; state.score += SCORE.ko; emit(state, { type: 'score', amount: SCORE.ko, x: e.pos.x, y: e.pos.y - 40 }); }
        } else {
          setState(e, 'down');
          e.invulnFrames = HIT_FEEL.downFrames + HIT_FEEL.getupFrames + HIT_FEEL.getupGraceFrames;
        }
      }
      return true;
    case 'down':
      if (e.stateFrame >= HIT_FEEL.downFrames) setState(e, 'getup');
      return true;
    case 'getup':
      // On standing up, grant exactly getupGraceFrames of invulnerability. Explicit (not left to
      // per-frame decrement of the down-entry budget) so the grace window is robust to duration
      // changes and testable without driving a full tick() loop.
      if (e.stateFrame >= HIT_FEEL.getupFrames) { setState(e, 'idle'); e.invulnFrames = HIT_FEEL.getupGraceFrames; }
      return true;
    case 'dead':
      e.vel.x = 0; e.vel.y = 0;
      return true;
    default:
      return false;
  }
}

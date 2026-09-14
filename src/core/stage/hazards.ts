// src/core/stage/hazards.ts
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import { isBody } from '../sim/entity';
import type { Facing } from '../types';
import { applyHazardHit } from '../combat/resolve';
import type { Hazard } from './stage1';
import { sectionIndexAt } from './stage1';

export const CHANNEL = { damage: 8 } as const;
export const LADLE = { damage: 15 } as const;
const NO_CONTACT = new Set(['knockdown', 'down', 'getup', 'dead', 'thrown']);

export function ladlePhase(h: Extract<Hazard, { type: 'ladle' }>, frame: number): 'idle' | 'tell' | 'pour' {
  const p = frame % h.period;
  return p < h.tellFrames ? 'tell' : p < h.tellFrames + h.damageFrames ? 'pour' : 'idle';
}

export function hazardSystem(state: WorldState): void {
  const stage = state.stage.stageData;
  if (!stage) return;
  const hazards = stage.sections.flatMap((s) => s.hazards);
  for (const h of hazards) {
    if (h.type === 'ladle' && ladlePhase(h, state.frame) === 'tell' && ladlePhase(h, state.frame - 1) !== 'tell') emit(state, { type: 'hazardTell', x: h.x, y: 120, frames: h.tellFrames });
    for (const e of state.entities) {
      if (!isBody(e) || e.dead) continue;
      if (h.type === 'belt') {
        if (e.pos.z === 0 && e.pos.x >= h.x1 && e.pos.x <= h.x2 && e.pos.y >= h.y1 && e.pos.y <= h.y2) e.pos.x += h.push;
      } else if (h.type === 'channel') {
        if (NO_CONTACT.has(e.state) || e.invulnFrames > 0 || e.pos.z > 0) continue;
        if (e.pos.x >= h.x1 && e.pos.x <= h.x2 && e.pos.y >= h.y1 && e.pos.y <= h.y2) {
          const dir: Facing = e.pos.x < (h.x1 + h.x2) / 2 ? -1 : 1;   // throw it back the way it came
          applyHazardHit(state, e, CHANNEL.damage, 'launch', dir);
          emit(state, { type: 'sfx', id: 'sizzle' });
        }
      } else if (h.type === 'ladle') {
        if (ladlePhase(h, state.frame) !== 'pour' || NO_CONTACT.has(e.state) || e.invulnFrames > 0) continue;
        if (Math.abs(e.pos.x - h.x) <= h.w / 2) { applyHazardHit(state, e, LADLE.damage, 'heavy', e.pos.x < h.x ? -1 : 1); e.invulnFrames = h.damageFrames; }  // once per pour
      }
    }
  }
  state.stage.sectionIndex = sectionIndexAt(stage, state.camera.x + 192);
}

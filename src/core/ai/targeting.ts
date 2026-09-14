// src/core/ai/targeting.ts
import type { Entity } from '../sim/entity';
import { isBody } from '../sim/entity';
import type { WorldState } from '../sim/state';

export function nearestBody(state: WorldState, self: Entity, filter: (e: Entity) => boolean = () => true): Entity | undefined {
  let best: Entity | undefined; let bestD = Infinity;
  for (const e of state.entities) {
    if (e.id === self.id || !isBody(e) || e.dead || e.state === 'dead' || !filter(e)) continue;
    if (e.kind === 'feral' && self.kind === 'feral') continue;   // a feral never targets another feral; gangs may
    const d = (e.pos.x - self.pos.x) ** 2 + (e.pos.y - self.pos.y) ** 2;
    if (d < bestD || (d === bestD && best && e.id < best.id)) { bestD = d; best = e; }
  }
  return best;
}

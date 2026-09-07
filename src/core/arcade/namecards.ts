// src/core/arcade/namecards.ts
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';
import { ENEMY_NAMES } from './hud';

/** First appearance of each enemy type (and the boss) fires one namecard event per game. */
export function nameCardSystem(state: WorldState): void {
  for (const e of state.entities) {
    if (!(e.kind in ENEMY_NAMES) || state.seenNameCards.includes(e.kind)) continue;
    state.seenNameCards.push(e.kind);
    emit(state, { type: 'namecard', kind: e.kind });
    emit(state, { type: 'sfx', id: 'namecard' });
  }
}

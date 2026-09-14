// src/core/stage/spawn.ts
import type { Entity } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { spawnGang } from '../entities/gang';
import { spawnCrate } from '../entities/items';
import { spawnFeral } from '../entities/feral';
import type { SpawnEntry } from './stage1';

/**
 * Spawn one stage entry and tag it with its owning lock index (so the lock knows when its wave is cleared).
 *
 * Ticket 10 (feral machine) has landed, so `feral` entries now spawn a real feral via `spawnFeral`
 * (was previously deferred/skipped). STAGE1 sections 2–3 populate their feral entries; the feral renders
 * as its `BOX_SIZE.feral` box until the feral atlas arrives in a later art pass.
 */
export function spawnEntry(state: WorldState, entry: SpawnEntry, lockIndex: number): Entity | null {
  let e: Entity;
  if (entry.kind === 'crate') e = spawnCrate(state, entry.x, entry.y, entry.contents ?? 'gear');
  else if (entry.kind === 'feral') e = spawnFeral(state, entry.x, entry.y);
  else e = spawnGang(state, entry.kind, entry.x, entry.y, entry.variant ?? 0);
  e.lockIndex = lockIndex;
  return e;
}

// src/core/stage/spawn.ts
import type { Entity } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { spawnGang } from '../entities/gang';
import { spawnCrate } from '../entities/items';
import type { SpawnEntry } from './stage1';

/**
 * Spawn one stage entry and tag it with its owning lock index (so the lock knows when its wave is cleared).
 *
 * DEVIATION (owner-ratifiable): the plan spawns `feral` entries via `spawnFeral` from ticket 10 (feral
 * machine), which is not built yet. Feral entries are DEFERRED here (skipped, returns null) rather than
 * pulling a half-built ticket 10 forward — the STAGE1 data keeps its feral entries, and this switch gains
 * a `feral` branch when ticket 10 lands. Locks still clear correctly (a skipped feral never joins the
 * "remaining" count), so the stage plays end-to-end on the gang roster + hazards today.
 */
export function spawnEntry(state: WorldState, entry: SpawnEntry, lockIndex: number): Entity | null {
  let e: Entity;
  if (entry.kind === 'crate') e = spawnCrate(state, entry.x, entry.y, entry.contents ?? 'gear');
  else if (entry.kind === 'feral') return null; // DEFERRED to ticket 10 (feral machine)
  else e = spawnGang(state, entry.kind, entry.x, entry.y, entry.variant ?? 0);
  e.lockIndex = lockIndex;
  return e;
}

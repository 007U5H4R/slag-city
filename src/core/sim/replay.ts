// src/core/sim/replay.ts
import { decodeInput } from '../input-codec';
import type { WorldState } from './state';
import { createWorld } from './state';
import { tick } from './tick';
import { hashState } from './hash';

export function runReplay(seed: number, encoded: number[], world: WorldState = createWorld(seed)): { state: WorldState; hash: string } {
  for (const n of encoded) tick(world, decodeInput(n));
  return { state: world, hash: hashState(world) };
}

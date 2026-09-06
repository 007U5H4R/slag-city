// src/core/sim/hash.ts
import type { WorldState } from './state';

/** FNV-1a over canonical JSON of the deterministic parts of the state.
 * `events` is transient (sfx/score/etc.) and is excluded via the replacer so it
 * never affects the hash. (Replacer instead of a `{ events, ...rest }` omit: the
 * rest-sibling binding tripped no-unused-vars and eslint.config.js is hook-protected.) */
export function hashState(state: WorldState): string {
  const json = JSON.stringify(state, (key, value) => (key === 'events' ? undefined : value));
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

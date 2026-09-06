// src/core/sim/rng.ts
export interface RngState { s: number }
export function createRng(seed: number): RngState { return { s: seed >>> 0 }; }
/** mulberry32 — returns [0,1). Mutates r.s. */
export function rngNext(r: RngState): number {
  r.s = (r.s + 0x6d2b79f5) >>> 0;
  let t = r.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function rngInt(r: RngState, min: number, max: number): number {
  return min + Math.floor(rngNext(r) * (max - min + 1));
}

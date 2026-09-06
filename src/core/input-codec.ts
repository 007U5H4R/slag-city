// src/core/input-codec.ts
import type { InputFrame } from './types';
const ORDER: Array<keyof InputFrame> = ['left', 'right', 'up', 'down', 'attack', 'jump', 'special', 'start', 'coin'];
export function encodeInput(f: InputFrame): number {
  let n = 0;
  ORDER.forEach((k, i) => { if (f[k]) n |= 1 << i; });
  return n;
}
export function decodeInput(n: number): InputFrame {
  const f = { left: false, right: false, up: false, down: false, attack: false, jump: false, special: false, start: false, coin: false };
  ORDER.forEach((k, i) => { f[k] = (n & (1 << i)) !== 0; });
  return f;
}

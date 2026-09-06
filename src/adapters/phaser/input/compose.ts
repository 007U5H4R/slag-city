// src/adapters/phaser/input/compose.ts
import type { InputFrame } from '@core/types';
import { EMPTY_INPUT } from '@core/types';
import type { InputSource } from './keyboard';

export function composeInput(sources: InputSource[]): InputFrame {
  const out = { ...EMPTY_INPUT };
  for (const s of sources) {
    const f = s.read();
    for (const k of Object.keys(out) as Array<keyof InputFrame>) out[k] = out[k] || f[k];
  }
  return out;
}

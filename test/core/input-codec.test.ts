// test/core/input-codec.test.ts
import { describe, it, expect } from 'vitest';
import { encodeInput, decodeInput } from '@core/input-codec';
import { EMPTY_INPUT } from '@core/types';

describe('input codec', () => {
  it('round-trips every single button', () => {
    for (const k of Object.keys(EMPTY_INPUT) as Array<keyof typeof EMPTY_INPUT>) {
      const f = { ...EMPTY_INPUT, [k]: true };
      expect(decodeInput(encodeInput(f))).toEqual(f);
    }
  });
  it('uses the documented bit order', () => {
    expect(encodeInput({ ...EMPTY_INPUT, left: true })).toBe(1);
    expect(encodeInput({ ...EMPTY_INPUT, coin: true })).toBe(256);
    expect(encodeInput({ ...EMPTY_INPUT, attack: true, jump: true })).toBe(48);
  });
});

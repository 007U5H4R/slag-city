// test/core/types.test.ts
import { describe, it, expect } from 'vitest';
import { EMPTY_INPUT } from '@core/types';

describe('core runs in node without Phaser', () => {
  it('EMPTY_INPUT has every button false', () => {
    expect(Object.values(EMPTY_INPUT).every((v) => v === false)).toBe(true);
    expect(Object.keys(EMPTY_INPUT).sort()).toEqual(
      ['attack', 'coin', 'down', 'jump', 'left', 'right', 'special', 'start', 'up'],
    );
  });
});

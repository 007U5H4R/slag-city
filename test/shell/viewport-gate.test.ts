// test/shell/viewport-gate.test.ts
import { describe, it, expect } from 'vitest';
import { shouldGate, GATE_MAX_WIDTH } from '@shell/viewport-gate';

describe('viewport gate', () => {
  it('gates at and below 768 and not above', () => {
    expect(GATE_MAX_WIDTH).toBe(768);
    expect(shouldGate(320)).toBe(true);
    expect(shouldGate(768)).toBe(true);
    expect(shouldGate(769)).toBe(false);
    expect(shouldGate(1920)).toBe(false);
  });
});

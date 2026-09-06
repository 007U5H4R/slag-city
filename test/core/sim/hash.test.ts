// test/core/sim/hash.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, spawn } from '@core/sim/state';
import { hashState } from '@core/sim/hash';

describe('hashState', () => {
  it('is stable for equal worlds and 8 hex chars', () => {
    const a = createWorld(42), b = createWorld(42);
    expect(hashState(a)).toBe(hashState(b));
    expect(hashState(a)).toMatch(/^[0-9a-f]{8}$/);
  });
  it('changes when an entity moves', () => {
    const a = createWorld(42), b = createWorld(42);
    spawn(a, 'brawler', 10, 150); spawn(b, 'brawler', 11, 150);
    expect(hashState(a)).not.toBe(hashState(b));
  });
  it('ignores transient events', () => {
    const a = createWorld(42), b = createWorld(42);
    a.events.push({ type: 'sfx', id: 'coin' });
    expect(hashState(a)).toBe(hashState(b));
  });
});

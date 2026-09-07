// test/core/entities/hero-dead.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { applyKnockdown } from '@core/combat/resolve';

describe('hero death', () => {
  it('health 0 → knockdown → dead; stage.heroDead set; heroDead event emitted exactly once', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.hp = 0; applyKnockdown(w, h, 1);
    let events = 0;
    for (let i = 0; i < 120; i++) { tick(w, EMPTY_INPUT); events += w.events.filter((e) => e.type === 'heroDead').length; }
    expect(h.state).toBe('dead');
    expect(w.stage.heroDead).toBe(true);
    expect(events).toBe(1);
    expect(w.entities.includes(h)).toBe(true); // the hero is never culled
  });
});

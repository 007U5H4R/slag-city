import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, spawn } from '@core/sim/state';
import { spawnGang } from '@core/entities/gang';
import { nearestBody } from '@core/ai/targeting';

describe('nearestBody', () => {
  it('has no faction preference: picks whichever body is closer', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100; h.pos.y = 160;
    const g = spawnGang(w, 'brawler', 130, 160);
    const f = spawn(w, 'feral', 120, 160);
    expect(nearestBody(w, f)?.id).toBe(g.id);
    f.pos.x = 105;
    expect(nearestBody(w, f)?.id).toBe(h.id);
  });
  it('ignores dead bodies and other ferals', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100;
    const g = spawnGang(w, 'brawler', 121, 160); g.dead = true;
    const f2 = spawn(w, 'feral', 122, 160);
    const f = spawn(w, 'feral', 120, 160);
    expect(nearestBody(w, f)?.id).toBe(h.id);
    expect(f2.kind).toBe('feral');
  });
});

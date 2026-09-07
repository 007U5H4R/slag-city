import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { HIT_FEEL } from '@core/combat/hit-feel';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };

function stunned(w: ReturnType<typeof createWorld>, dx: number, dy = 0) {
  const h = heroOf(w);
  const v = spawnGang(w, 'brawler', h.pos.x + dx, h.pos.y + dy);
  v.state = 'hurt'; v.hitstun = 60; v.cooldown = 999;
  return v;
}

describe('grab and throw', () => {
  it('walking into a stunned enemy grabs it; a non-stunned enemy is not grabbed', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    run(w, 12, inp({ right: true }));
    expect(h.state).toBe('grab'); expect(h.grabbedId).toBe(v.id); expect(v.state).toBe('grabbed');
    const w2 = createWorld(1); const h2 = heroOf(w2);
    const v2 = spawnGang(w2, 'brawler', h2.pos.x + 30, h2.pos.y); v2.cooldown = 999;
    run(w2, 12, inp({ right: true }));
    expect(h2.state).not.toBe('grab');
  });
  it('does not grab across the depth tolerance', () => {
    const w = createWorld(1); const h = heroOf(w);
    stunned(w, 30, 12);
    run(w, 12, inp({ right: true }));
    expect(h.state).not.toBe('grab');
  });
  it('Attack throws; the thrown enemy knocks down another enemy it hits and lands knocked down', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    const other = spawnGang(w, 'brawler', h.pos.x + 90, h.pos.y); other.cooldown = 999;
    run(w, 12, inp({ right: true }));
    tick(w, inp({ attack: true }));
    expect(h.state).toBe('throw');
    run(w, 8);
    expect(v.state).toBe('thrown');
    expect(v.hp).toBe(v.maxHp - 10);
    run(w, 60);
    expect(other.state === 'knockdown' || other.state === 'down').toBe(true);
    expect(['down', 'getup', 'dead']).toContain(v.state);
  });
  it('releases the grab after the timeout', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    run(w, 12, inp({ right: true }));
    run(w, 130);
    expect(h.state).toBe('idle'); expect(v.state).not.toBe('grabbed');
  });
  it('being hit while grabbing releases the enemy', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = stunned(w, 30);
    run(w, 12, inp({ right: true }));
    h.hp = 50; h.hitstun = HIT_FEEL.hitstun.light; h.state = 'hurt';
    tick(w, EMPTY_INPUT);
    expect(v.state).not.toBe('grabbed'); expect(h.grabbedId).toBeNull();
  });
});

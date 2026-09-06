// test/core/entities/brawler.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HIT_FEEL } from '@core/combat/hit-feel';
import { spawnGang, GANG_DATA } from '@core/entities/gang';

const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let i = 0; i < n; i++) tick(w, EMPTY_INPUT); };

describe('brawler', () => {
  it('approaches the hero, faces him, and punches within reach', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnGang(w, 'brawler', h.pos.x + 150, h.pos.y + 30);
    expect(b.hp).toBe(GANG_DATA.brawler.hp);
    run(w, 5);
    expect(b.state).toBe('approach');
    expect(b.facing).toBe(-1);
    let punched = false;
    for (let i = 0; i < 400 && !punched; i++) { tick(w, EMPTY_INPUT); if (b.state === 'punch') punched = true; }
    expect(punched).toBe(true);
    expect(Math.abs(b.pos.x - h.pos.x)).toBeLessThanOrEqual(GANG_DATA.brawler.reach + 2);
    expect(Math.abs(b.pos.y - h.pos.y)).toBeLessThanOrEqual(8);
  });
  it('hits the hero back', () => {
    const w = createWorld(1); const h = heroOf(w);
    spawnGang(w, 'brawler', h.pos.x + 20, h.pos.y);
    run(w, 400);
    expect(h.hp).toBeLessThan(100);
  });
  it('waits out the cooldown between punches', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnGang(w, 'brawler', h.pos.x + 20, h.pos.y);
    const starts: number[] = [];
    for (let i = 0; i < 600; i++) { tick(w, EMPTY_INPUT); if (b.state === 'punch' && b.stateFrame === 1) starts.push(w.frame); }
    expect(starts.length).toBeGreaterThan(2);
    for (let i = 1; i < starts.length; i++) expect(starts[i]! - starts[i - 1]!).toBeGreaterThanOrEqual(GANG_DATA.brawler.attackCooldown);
  });
  it('hero hit 3 launches the brawler; hitstop is 3 then 8', () => {
    const w = createWorld(1); const h = heroOf(w);
    const A = { ...EMPTY_INPUT, attack: true };
    const v = spawnGang(w, 'brawler', h.pos.x + 24, h.pos.y); v.hp = 100;
    tick(w, A);
    let launched = false, sawLight = false, sawLaunch = false;
    for (let i = 0; i < 120 && !launched; i++) {
      tick(w, i % 2 === 0 ? A : EMPTY_INPUT);
      if (w.hitstop === HIT_FEEL.hitstop.light) sawLight = true;
      if (w.hitstop === HIT_FEEL.hitstop.launch) sawLaunch = true;
      if (v.state === 'knockdown') launched = true;
    }
    expect(sawLight && sawLaunch && launched).toBe(true);
  });
});

// test/core/entities/gang-trio.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { GANG_DATA, spawnGang } from '@core/entities/gang';
import { applyHit } from '@core/combat/resolve';
import { HERO_DATA } from '@core/combat/frame-data';

describe('gang trio data', () => {
  it('knife is faster and frailer than the brawler; heavy is slower and tougher', () => {
    expect(GANG_DATA.knife.walkSpeed.x).toBeGreaterThan(GANG_DATA.brawler.walkSpeed.x);
    expect(GANG_DATA.knife.hp).toBeLessThan(GANG_DATA.brawler.hp);
    expect(GANG_DATA.heavy.walkSpeed.x).toBeLessThan(GANG_DATA.brawler.walkSpeed.x);
    expect(GANG_DATA.heavy.hp).toBeGreaterThan(GANG_DATA.brawler.hp);
    expect(GANG_DATA.heavy.moves.slam!.damage).toBeGreaterThan(GANG_DATA.brawler.moves.punch!.damage);
  });
  it('heavy ignores hitstun during wind-up but takes damage', () => {
    const w = createWorld(1); const h = heroOf(w);
    const hv = spawnGang(w, 'heavy', h.pos.x + 20, h.pos.y);
    hv.attackTicket = true; hv.cooldown = 0;
    for (let i = 0; i < 300 && hv.state !== 'slam'; i++) tick(w, EMPTY_INPUT);
    expect(hv.state).toBe('slam');
    expect(hv.armorFrames).toBeGreaterThan(0);
    const hp = hv.hp;
    applyHit(w, h, hv, HERO_DATA.moves.attack1!);
    expect(hv.hp).toBe(hp - HERO_DATA.moves.attack1!.damage);
    expect(hv.state).toBe('slam');
  });
  it('knife stabs quickly', () => {
    const w = createWorld(1); const h = heroOf(w);
    const k = spawnGang(w, 'knife', h.pos.x + 20, h.pos.y); k.attackTicket = true;
    let f = 0;
    for (; f < 300 && k.state !== 'stab'; f++) tick(w, EMPTY_INPUT);
    expect(k.state).toBe('stab');
    expect(f).toBeLessThan(60);
  });
  it('spawnGang records the palette-swap variant', () => {
    const w = createWorld(1);
    expect(spawnGang(w, 'brawler', 200, 160, 2).variant).toBe(2);
  });
});

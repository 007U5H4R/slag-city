import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HERO_DATA, SPECIAL_COST, moveTotal } from '@core/combat/frame-data';
import { spawnGang } from '@core/entities/gang';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };

describe('jump attack', () => {
  it('enters jumpAttack from jump on an attack press and hits with its own hitbox', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawnGang(w, 'brawler', h.pos.x + 24, h.pos.y); v.state = 'idle'; v.cooldown = 999;
    tick(w, inp({ jump: true })); run(w, 6);
    tick(w, inp({ attack: true }));
    expect(h.state).toBe('jumpAttack');
    expect(HERO_DATA.moves.jumpAttack!.hitbox).not.toEqual(HERO_DATA.moves.attack1!.hitbox);
    run(w, 40);
    expect(v.hp).toBeLessThan(v.maxHp);
    expect(h.state).not.toBe('jumpAttack'); // landed
  });
});

describe('special', () => {
  it('costs SPECIAL_COST health and launches every enemy in range', () => {
    const w = createWorld(1); const h = heroOf(w);
    const a = spawnGang(w, 'brawler', h.pos.x + 30, h.pos.y); a.cooldown = 999;
    const b = spawnGang(w, 'brawler', h.pos.x - 30, h.pos.y + 6); b.cooldown = 999;
    tick(w, inp({ special: true }));
    expect(h.state).toBe('special');
    expect(h.hp).toBe(100 - SPECIAL_COST);
    run(w, moveTotal(HERO_DATA.moves.special!) + 2);
    expect(a.state).toBe('knockdown'); expect(b.state).toBe('knockdown');
  });
  it('cannot be used at or below its cost', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.hp = SPECIAL_COST;
    tick(w, inp({ special: true }));
    expect(h.state).toBe('idle');
    expect(h.hp).toBe(SPECIAL_COST);
  });
});

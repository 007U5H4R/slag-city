// test/core/ai/tickets.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { MAX_ATTACKERS, isGangKind } from '@core/ai/tickets';
import { applyKnockdown } from '@core/combat/resolve';

describe('attacker tickets', () => {
  it('never more than 2 attackers at any tick across a 5-enemy fight', () => {
    const w = createWorld(1); const h = heroOf(w);
    const kinds = ['brawler', 'knife', 'heavy', 'brawler', 'knife'] as const;
    kinds.forEach((k, i) => spawnGang(w, k, h.pos.x + 60 + i * 30, h.pos.y + (i % 3) * 10));
    let maxTickets = 0, sawRing = false, sawAttack = false;
    for (let i = 0; i < 1200; i++) {
      tick(w, EMPTY_INPUT);
      const gangs = w.entities.filter((e) => isGangKind(e.kind));
      maxTickets = Math.max(maxTickets, gangs.filter((e) => e.attackTicket).length);
      if (gangs.some((e) => e.state === 'ring')) sawRing = true;
      if (gangs.some((e) => e.state === 'punch' || e.state === 'stab' || e.state === 'slam')) sawAttack = true;
    }
    expect(maxTickets).toBe(MAX_ATTACKERS);
    expect(sawRing && sawAttack).toBe(true);
  });
  it('releases a ticket on knockdown and on death', () => {
    const w = createWorld(1); const h = heroOf(w);
    const a = spawnGang(w, 'brawler', h.pos.x + 40, h.pos.y);
    const b = spawnGang(w, 'brawler', h.pos.x - 40, h.pos.y);
    const c = spawnGang(w, 'brawler', h.pos.x + 200, h.pos.y);
    tick(w, EMPTY_INPUT);
    expect(a.attackTicket && b.attackTicket).toBe(true); expect(c.attackTicket).toBe(false);
    applyKnockdown(w, a, 1); tick(w, EMPTY_INPUT);
    expect(a.attackTicket).toBe(false);
    b.hp = 0; applyKnockdown(w, b, 1); for (let i = 0; i < 60; i++) tick(w, EMPTY_INPUT);
    expect(b.attackTicket).toBe(false);
    expect(c.attackTicket).toBe(true);
  });
  it('ring enemies hover at ring distance and rotate in when a ticket frees', () => {
    const w = createWorld(1); const h = heroOf(w);
    const gangs = [0, 1, 2].map((i) => spawnGang(w, 'brawler', h.pos.x + 50 + i * 20, h.pos.y));
    const holders = new Set<number>();
    for (let i = 0; i < 1500; i++) { tick(w, EMPTY_INPUT); gangs.forEach((g) => { if (g.attackTicket) holders.add(g.id); }); }
    expect(holders.size).toBe(3);
  });
});

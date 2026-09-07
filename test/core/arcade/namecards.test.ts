// test/core/arcade/namecards.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';

describe('name-cards', () => {
  it('fires once per enemy type per game, on first appearance', () => {
    const w = createWorld(1); const h = heroOf(w);
    const cards: string[] = [];
    spawnGang(w, 'brawler', h.pos.x + 300, h.pos.y);
    tick(w, EMPTY_INPUT); cards.push(...w.events.filter((e) => e.type === 'namecard').map((e) => (e as { kind: string }).kind));
    spawnGang(w, 'brawler', h.pos.x + 320, h.pos.y); spawnGang(w, 'knife', h.pos.x + 340, h.pos.y);
    tick(w, EMPTY_INPUT); cards.push(...w.events.filter((e) => e.type === 'namecard').map((e) => (e as { kind: string }).kind));
    for (let i = 0; i < 100; i++) { tick(w, EMPTY_INPUT); cards.push(...w.events.filter((e) => e.type === 'namecard').map((e) => (e as { kind: string }).kind)); }
    expect(cards).toEqual(['brawler', 'knife']);
    expect(w.seenNameCards).toEqual(['brawler', 'knife']);
  });
});

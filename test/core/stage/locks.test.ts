import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { STAGE1 } from '@core/stage/stage1';
import type { StageData } from '@core/stage/stage1';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const MINI: StageData = { width: 2000, sections: [{ name: 'A', bg: 's1', startX: 0, hazards: [] }], bossDoorX: 1500,
  locks: [{ camX: 200, entries: [{ kind: 'brawler', x: 620, y: 160, delay: 0 }, { kind: 'brawler', x: 660, y: 190, delay: 30 }] }] };

describe('scroll locks', () => {
  it('locks the camera at camX, spawns the table with delays, releases when all are dead', () => {
    const w = createWorld(1, undefined, MINI); const h = heroOf(w);
    for (let i = 0; i < 400 && w.camera.lockX === null; i++) tick(w, inp({ right: true }));
    expect(w.camera.lockX).toBe(200);
    expect(w.entities.filter((e) => e.kind === 'brawler')).toHaveLength(1);
    for (let i = 0; i < 31; i++) tick(w, EMPTY_INPUT);
    expect(w.entities.filter((e) => e.kind === 'brawler')).toHaveLength(2);
    for (let i = 0; i < 100; i++) tick(w, inp({ right: true }));
    expect(w.camera.x).toBe(200);                                        // camera does not advance while locked
    for (const g of w.entities.filter((e) => e.kind === 'brawler')) { g.hp = 0; g.state = 'dead'; g.dead = true; }
    tick(w, EMPTY_INPUT);
    expect(w.camera.lockX).toBeNull();
    expect(w.stage.lockCleared).toEqual([true]);
    expect(w.events.some((e) => e.type === 'lockRelease')).toBe(true);
    h.pos.x = 1400; let door = 0;
    for (let i = 0; i < 300; i++) { tick(w, inp({ right: true })); door += w.events.filter((e) => e.type === 'bossDoor').length; }
    expect(door).toBe(1);
  });
  it('the full stage engages every lock in order as the hero walks right (enemies auto-killed)', () => {
    const w = createWorld(1, undefined, STAGE1);
    const h = heroOf(w);
    const seen: number[] = [];
    for (let i = 0; i < 20000 && !w.events.some((e) => e.type === 'bossDoor'); i++) {
      tick(w, inp({ right: true }));
      // This test isolates LOCK-PROGRESSION logic, not combat: keep the hero alive and unhittable so it
      // keeps walking right. (Plan-test fix, owner-ratifiable: the verbatim plan test left the hero
      // undefended, so it died at ~frame 1762 and the camera stalled following the corpse, never reaching
      // lock 2 — a real-player defends themselves; the engine is correct.)
      h.hp = h.maxHp; h.invulnFrames = Math.max(h.invulnFrames, 3);
      // capture only real locks — the boss door also sets lockX but with lockIndex === locks.length
      if (w.camera.lockX !== null && w.camera.lockIndex < STAGE1.locks.length && seen[seen.length - 1] !== w.camera.lockIndex) seen.push(w.camera.lockIndex);
      if (w.stage.lockFrame > 600) for (const e of w.entities) if (e.kind !== 'hero' && e.kind !== 'crate' && e.kind !== 'pickup') { e.hp = 0; e.state = 'dead'; e.dead = true; }
    }
    expect(seen).toEqual(STAGE1.locks.map((_, i) => i));
    expect(w.stage.lockCleared.every(Boolean)).toBe(true);
  });
});

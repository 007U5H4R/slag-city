import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { spawnFeral, FERAL_DATA } from '@core/entities/feral';

const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let k = 0; k < n; k++) tick(w, EMPTY_INPUT); };

describe('feral machine', () => {
  it('emerges invulnerable, then stalks the nearest body and pounces with telegraph frames', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 60;
    // brawler at 380 (gap 80 > FERAL_DATA.reach 44): the feral must actually stalk toward it before
    // pouncing. The plan's original 330 (gap 30 < reach) put the target already in reach, so stalk was
    // never observable and the frame-25 assertion below could never hold. (Plan §10.2 test to be patched.)
    const g = spawnGang(w, 'brawler', 380, 170); g.cooldown = 9999; g.state = 'idle';
    const f = spawnFeral(w, 300, 170);
    expect(f.invulnFrames).toBeGreaterThan(0);
    run(w, 25);
    expect(f.state).toBe('stalk'); expect(f.targetId).toBe(g.id);
    let telegraph = 0;
    // the telegraph is the startup window (stateFrame 1..startup); stateFrame 0 is the transition instant
    // into 'pounce', not a wind-up frame, so it must not be counted (the plan counted it → off-by-one).
    for (let i = 0; i < 300; i++) { tick(w, EMPTY_INPUT); if (f.state === 'pounce' && f.stateFrame >= 1 && f.stateFrame <= FERAL_DATA.moves.pounce!.startup) telegraph++; if (g.hp < g.maxHp) break; }
    expect(telegraph).toBe(FERAL_DATA.moves.pounce!.startup);
    expect(g.hp).toBeLessThan(g.maxHp);
  });
  it('damages the hero the same way and retargets when its target dies', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100;
    const g = spawnGang(w, 'brawler', 320, 170); g.cooldown = 9999; g.hp = 1;
    const f = spawnFeral(w, 300, 170);
    run(w, 25); expect(f.targetId).toBe(g.id);
    run(w, 400);
    expect(f.targetId).toBe(h.id);
    expect(h.hp).toBeLessThan(100);
  });
  it('gang attacks kill it and it drops exactly one arm-cannon', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 30;
    spawnGang(w, 'brawler', 300, 170); spawnGang(w, 'brawler', 340, 170);
    const f = spawnFeral(w, 320, 170); f.hp = 8;
    run(w, 900);
    expect(w.entities.includes(f)).toBe(false);
    expect(w.entities.filter((e) => e.kind === 'weaponPickup' && e.weapon?.kind === 'cannon')).toHaveLength(1);
  });
});

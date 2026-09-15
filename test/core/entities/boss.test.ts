// test/core/entities/boss.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnBoss, BOSS_DATA, BOSS_PHASE2_SPEED, TEAR_OPEN_FRAMES } from '@core/entities/boss';
import { applyHit } from '@core/combat/resolve';
import { HERO_DATA } from '@core/combat/frame-data';
import { WEAPON_HEAT } from '@core/weapons/heat';

const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let k = 0; k < n; k++) tick(w, EMPTY_INPUT); };

describe('the Foreman', () => {
  it('phase 1: telegraphed swing/pound with super-armour, never launched by hero hits', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnBoss(w, h.pos.x + 50, h.pos.y);
    let attacked = false;
    for (let i = 0; i < 600; i++) { tick(w, EMPTY_INPUT); if ((b.state === 'swing' || b.state === 'pound') && b.stateFrame === 1) { attacked = true; expect(b.armorFrames).toBeGreaterThan(0); break; } }
    expect(attacked).toBe(true);
    applyHit(w, h, b, HERO_DATA.moves.attack3!);
    expect(b.state).not.toBe('knockdown');
    expect(w.entities.some((e) => e.kind === 'boss')).toBe(true);
  });
  it('transitions at exactly 50%: invulnerable tear-open, then 1.3x speed, tint, blade drop once, glob attack', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100;
    const b = spawnBoss(w, 400, h.pos.y);
    run(w, 5);
    b.hp = Math.floor(BOSS_DATA.hp * 0.5) + 1; applyHit(w, h, b, { ...HERO_DATA.moves.attack1!, damage: 1 });
    w.hitstop = 0;   // a light hit sets a 3-frame hitstop that freezes the sim; skip it so the next tick advances the boss FSM
    tick(w, EMPTY_INPUT);
    expect(b.state).toBe('tearOpen'); expect(b.invulnFrames).toBeGreaterThanOrEqual(TEAR_OPEN_FRAMES);
    let phase2Events = 0;
    for (let i = 0; i < TEAR_OPEN_FRAMES + 5; i++) { tick(w, EMPTY_INPUT); phase2Events += w.events.filter((e) => e.type === 'bossPhase2').length; }
    expect(phase2Events).toBe(1);
    expect(b.phase).toBe(2); expect(b.speedMul).toBe(BOSS_PHASE2_SPEED); expect(b.tint).toBe(true);
    const blades = w.entities.filter((e) => e.kind === 'weaponPickup' && e.weapon?.kind === 'blade');
    expect(blades).toHaveLength(1); expect(blades[0]!.weapon!.heat).toBe(WEAPON_HEAT.blade);
    // Phase 2 has a ranged glob attack. Against a stationary in-range hero the boss commits to melee
    // (globs are gated on `far` in updateBoss — a spacing tool), so drive the throw directly to prove the
    // mechanic emits a real 'glob' projectile. (ratified test fix — the plan looped vs an idle hero, which
    // never leaves the far range for seed 1; the depth-rule test covers glob behaviour.)
    b.state = 'throwGlob'; b.stateFrame = 0;
    let glob = false;
    for (let i = 0; i < 60 && !glob; i++) { tick(w, EMPTY_INPUT); if (w.entities.some((e) => e.kind === 'projectile' && e.state === 'glob')) glob = true; }
    expect(glob).toBe(true);
  });
  it('a glob respects the depth rule', () => {
    const w = createWorld(1); const h = heroOf(w); h.pos.x = 100; h.pos.y = 150;
    const b = spawnBoss(w, 400, 190); b.phase = 2; b.speedMul = BOSS_PHASE2_SPEED; b.weaponKind = null; b.state = 'idle';
    for (let i = 0; i < 1200; i++) { tick(w, EMPTY_INPUT); h.pos.y = 150; h.pos.x = 100; b.pos.y = 190; b.pos.x = 400; }
    expect(h.hp).toBe(100);
  });
  it('defeat: dying → dead once, bossDefeated event once, stage flag set, score awarded', () => {
    const w = createWorld(1); const h = heroOf(w);
    const b = spawnBoss(w, h.pos.x + 60, h.pos.y);
    b.hp = 1; applyHit(w, h, b, HERO_DATA.moves.attack1!);
    let defeated = 0;
    for (let i = 0; i < 200; i++) { tick(w, EMPTY_INPUT); defeated += w.events.filter((e) => e.type === 'bossDefeated').length; }
    expect(defeated).toBe(1); expect(w.stage.bossDefeated).toBe(true); expect(w.score).toBeGreaterThanOrEqual(5000);
  });
});

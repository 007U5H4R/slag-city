// test/core/combat/resolve.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf, spawn } from '@core/sim/state';
import { registerActorData, HERO_DATA } from '@core/combat/frame-data';
import { applyHit, applyKnockdown, resolveHits } from '@core/combat/resolve';
import { updateStunState } from '@core/combat/stun';
import { HIT_FEEL } from '@core/combat/hit-feel';
import { setState } from '@core/sim/entity';
import { applyPhysics } from '@core/sim/physics';

const DUMMY = { ...HERO_DATA, hp: 30, moves: {} };
registerActorData('brawler', DUMMY);
const light = { startup: 3, active: 3, recovery: 8, hitbox: { x: 8, y: 24, w: 26, h: 16 }, damage: 6, level: 'light' as const, pushback: 2 };
const launch = { ...light, level: 'launch' as const, damage: 10 };

describe('applyHit', () => {
  it('sets hitstop 3/5/8 by level, flash 2, damage and pushback', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30;
    applyHit(w, h, v, light);
    expect(w.hitstop).toBe(HIT_FEEL.hitstop.light);
    expect(v.flashFrames).toBe(2);
    expect(v.hp).toBe(24);
    expect(v.vel.x).toBe(2);
    expect(v.state).toBe('hurt');
    expect(w.events.some((e) => e.type === 'hit')).toBe(true);
    applyHit(w, h, v, { ...light, level: 'heavy' });
    expect(w.hitstop).toBe(HIT_FEEL.hitstop.heavy);
    expect(w.shake.px).toBe(2);
    applyHit(w, h, v, launch);
    expect(w.hitstop).toBe(HIT_FEEL.hitstop.launch);
    expect(v.state).toBe('knockdown');
    expect(v.vel.z).toBe(HIT_FEEL.launch.vz);
  });
  it('super-armour takes damage but no hitstun', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30; v.armorFrames = 5; setState(v, 'windup');
    applyHit(w, h, v, light);
    expect(v.hp).toBe(24);
    expect(v.state).toBe('windup');
  });
  it('knockdown → down → getup (invulnerable) → idle', () => {
    const w = createWorld(1);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30;
    applyKnockdown(w, v, 1);
    let n = 0;
    while (v.state === 'knockdown' && n++ < 100) { applyPhysics(w); v.stateFrame++; updateStunState(w, v); }
    expect(v.state).toBe('down');
    for (let i = 0; i < HIT_FEEL.downFrames; i++) { v.stateFrame++; updateStunState(w, v); }
    expect(v.state).toBe('getup');
    expect(v.invulnFrames).toBeGreaterThan(HIT_FEEL.getupFrames);
    for (let i = 0; i < HIT_FEEL.getupFrames; i++) { v.stateFrame++; updateStunState(w, v); }
    expect(v.state).toBe('idle');
    expect(v.invulnFrames).toBe(HIT_FEEL.getupGraceFrames);
  });
  it('a hit on an invulnerable victim is ignored', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 130, 168); v.hp = 30; v.invulnFrames = 5;
    setState(h, 'attack1'); h.stateFrame = 4; // active frame
    registerActorData('hero', { ...HERO_DATA, moves: { attack1: light } });
    resolveHits(w);
    expect(v.hp).toBe(30);
  });
  it('each move hits a victim once and hp<=0 knocks down', () => {
    const w = createWorld(1); const h = heroOf(w);
    const v = spawn(w, 'brawler', 100, 168); v.hp = 4;
    registerActorData('hero', { ...HERO_DATA, moves: { attack1: light } });
    setState(h, 'attack1'); h.stateFrame = 4;
    resolveHits(w); resolveHits(w);
    expect(v.hp).toBe(-2);
    expect(v.state).toBe('knockdown');
    expect(w.score).toBeGreaterThan(0);
  });
});

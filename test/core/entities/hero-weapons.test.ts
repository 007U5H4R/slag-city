// test/core/entities/hero-weapons.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { spawnWeaponPickup } from '@core/entities/items';
import { applyKnockdown } from '@core/combat/resolve';
import { WEAPON_HEAT } from '@core/weapons/heat';
import { HERO_DATA, moveTotal } from '@core/combat/frame-data';

const inp = (o: Partial<typeof EMPTY_INPUT>) => ({ ...EMPTY_INPUT, ...o });
const run = (w: ReturnType<typeof createWorld>, n: number, i = EMPTY_INPUT) => { for (let k = 0; k < n; k++) tick(w, i); };
const tap = (w: ReturnType<typeof createWorld>) => { tick(w, inp({ attack: true })); tick(w, EMPTY_INPUT); };

describe('salvage weapons', () => {
  it('Attack over a weapon picks it up instead of punching', () => {
    const w = createWorld(1); const h = heroOf(w);
    spawnWeaponPickup(w, 'cannon', h.pos.x + 4, h.pos.y, 6);
    tap(w);
    expect(h.weapon).toEqual({ kind: 'cannon', heat: 6 });
    expect(h.state).not.toBe('attack1');
    expect(w.entities.filter((e) => e.kind === 'weaponPickup')).toHaveLength(0);
  });
  it('cannon fires a projectile that hurts an enemy at range; 6 shots then it breaks', () => {
    const w = createWorld(1); const h = heroOf(w); h.weapon = { kind: 'cannon', heat: WEAPON_HEAT.cannon };
    const g = spawnGang(w, 'brawler', h.pos.x + 150, h.pos.y); g.cooldown = 9999; g.state = 'idle';
    tap(w); expect(h.state).toBe('cannonFire');
    run(w, 60);
    expect(g.hp).toBeLessThan(g.maxHp);
    // +20 (not +1): a cannon shot that connects triggers the global hitstop (heavy hit freezes all
    // entities for a few frames), which stalls that cannonFire's recovery so it needs a few extra ticks to
    // reach moveTotal and consume its shot. The plan's tight +1 budget dropped one of the 6 uses. Widening
    // the per-shot window matches real play (a move always completes before the next tap). (Plan §11.2 test.)
    for (let i = 0; i < 5; i++) { tap(w); run(w, moveTotal(HERO_DATA.moves.cannonFire!) + 20); }
    expect(h.weapon).toBeNull();
  });
  it('blade swings hit like a heavy melee move and break on the 8th swing', () => {
    const w = createWorld(1); const h = heroOf(w); h.weapon = { kind: 'blade', heat: WEAPON_HEAT.blade };
    for (let i = 0; i < 8; i++) { tap(w); expect(h.state).toBe('bladeSwing'); run(w, moveTotal(HERO_DATA.moves.bladeSwing!) + 1); }
    expect(h.weapon).toBeNull();
    expect(HERO_DATA.moves.bladeSwing!.level).toBe('heavy');
  });
  it('knockdown drops the held weapon as a pickup with its remaining heat', () => {
    const w = createWorld(1); const h = heroOf(w); h.weapon = { kind: 'blade', heat: 3 };
    applyKnockdown(w, h, 1);
    expect(h.weapon).toBeNull();
    const p = w.entities.find((e) => e.kind === 'weaponPickup');
    expect(p?.weapon).toEqual({ kind: 'blade', heat: 3 });
    run(w, 120, EMPTY_INPUT);
    // applyKnockdown launches the hero (vel.x), so after recovery it has slid well away from where the
    // weapon dropped. This case tests re-equip-restores-heat, not locomotion — put the hero back over the
    // drop before the pick-up tap. (Plan §11.2 test.)
    h.pos.x = p!.pos.x;
    tap(w);
    expect(h.weapon).toEqual({ kind: 'blade', heat: 3 });
  });
});

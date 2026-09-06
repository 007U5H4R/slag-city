// test/core/entities/hero-combo.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { HERO_DATA, moveTotal, registerActorData } from '@core/combat/frame-data';

registerActorData('brawler', { ...HERO_DATA, hp: 30, moves: {} });
const A = { ...EMPTY_INPUT, attack: true };
const tap = (w: ReturnType<typeof createWorld>) => { tick(w, A); tick(w, EMPTY_INPUT); };
const run = (w: ReturnType<typeof createWorld>, n: number) => { for (let i = 0; i < n; i++) tick(w, EMPTY_INPUT); };

describe('hero combo', () => {
  it('attack1 → attack2 → attack3 with buffered presses, then idle', () => {
    const w = createWorld(1); const h = heroOf(w);
    tap(w); expect(h.state).toBe('attack1');
    tap(w); // buffered during attack1
    run(w, moveTotal(HERO_DATA.moves.attack1!));
    expect(h.state).toBe('attack2');
    tap(w);
    run(w, moveTotal(HERO_DATA.moves.attack2!));
    expect(h.state).toBe('attack3');
    run(w, moveTotal(HERO_DATA.moves.attack3!) + 1);
    expect(h.state).toBe('idle');
  });
  it('without a buffered press the chain drops to idle', () => {
    const w = createWorld(1); const h = heroOf(w);
    tap(w); run(w, moveTotal(HERO_DATA.moves.attack1!) + 1);
    expect(h.state).toBe('idle');
  });
  // "hit 3 launches the brawler; hitstop is 3 then 8" is verified in ticket 6.4 instead: it needs the
  // brawler entity updater (updateGang → updateStunState per tick) to decay hit knockback so the victim
  // stays in the hero's reach across the 3-hit chain. Without a per-tick brawler updater (6.4) the
  // victim drifts out of range before attack3. See docs/build/reports/06.3.md.
  it('cannot attack while in hitstun', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.state = 'hurt'; h.hitstun = 10;
    tick(w, A);
    expect(h.state).toBe('hurt');
  });
});

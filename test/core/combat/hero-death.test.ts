// Regression for QA observation O-1: an undefended cornered hero kept taking damage into deeply
// negative HP after death — canHit gated only on the `dead` FLAG (which the hero never sets; only its
// STATE becomes 'dead'), so gang members kept hitting the dead hero and each hit re-knocked it out of
// 'dead' with HP spiralling to ~-94. Fix: canHit rejects victims in the 'dead' state, and the
// knockdown->dead transition floors HP at 0. A dead hero must therefore SETTLE at 0 HP and stay there.
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';

describe('hero death (O-1: dead hero floors at 0 and takes no further damage)', () => {
  it('a dead hero settles at 0 HP, stays dead, and heroDead fires exactly once', () => {
    const w = createWorld(1);
    const h = heroOf(w);
    // Pin two brawlers on the hero so an idle (undefended) hero gets pummelled to death.
    spawnGang(w, 'brawler', h.pos.x + 10, h.pos.y);
    spawnGang(w, 'brawler', h.pos.x - 10, h.pos.y);

    let heroDeadEvents = 0;
    let sawDead = false;
    for (let i = 0; i < 1500; i++) {
      tick(w, EMPTY_INPUT);
      heroDeadEvents += w.events.filter((e) => e.type === 'heroDead').length;
      if (h.state === 'dead') {
        sawDead = true;
        // once dead: floored to 0 and never pushed negative by further hits
        expect(h.hp).toBe(0);
      }
    }

    expect(sawDead).toBe(true);          // the hero did die
    expect(h.state).toBe('dead');        // and stayed dead (not oscillating back to knockdown)
    expect(h.hp).toBe(0);
    expect(heroDeadEvents).toBe(1);      // the shell-observable event fires once
  });
});

// test/core/arcade/session.test.ts
import { describe, it, expect } from 'vitest';
import { newGameWorld, reviveHero } from '@core/arcade/session';
import { heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { applyKnockdown } from '@core/combat/resolve';

describe('session', () => {
  it('revives the hero in place: full health, invulnerable, same camera/lock/score', () => {
    const w = newGameWorld(3); const h = heroOf(w);
    w.camera.x = 320; w.camera.lockX = 320; w.score = 4200; h.weapon = { kind: 'blade', heat: 2 };
    h.hp = 0; applyKnockdown(w, h, 1); for (let i = 0; i < 80; i++) tick(w, EMPTY_INPUT);
    expect(w.stage.heroDead).toBe(true);
    reviveHero(w);
    expect(h.hp).toBe(h.maxHp); expect(h.state).toBe('idle'); expect(h.invulnFrames).toBe(90); expect(h.weapon).toBeNull();
    expect(w.stage.heroDead).toBe(false); expect(w.camera.lockX).toBe(320); expect(w.score).toBe(4200);
    expect(h.pos.x).toBe(380);
  });
});

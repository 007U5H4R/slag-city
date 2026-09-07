// test/core/qa-phase-a.test.ts
// Phase-A boundary QA regressions (independent of the per-ticket TDD).
// Closes two acceptance gaps found at the QA gate:
//   1. KO score arithmetic — SCORE.ko (500) awarded exactly once on an enemy death (ticket 06/09).
//   2. Cross-ticket determinism — the ticket-05 "same input log => same hash" property must still hold
//      once ticket 06/08/09 add gang, crates and pickups to the world (the golden replay is hero-only).
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import { spawnGang } from '@core/entities/gang';
import { spawnCrate, spawnPickup } from '@core/entities/items';
import { applyHit } from '@core/combat/resolve';
import { HERO_DATA } from '@core/combat/frame-data';
import { SCORE } from '@core/arcade/score';
import { runReplay } from '@core/sim/replay';
import { encodeInput } from '@core/input-codec';

describe('Phase A — cross-ticket QA regressions', () => {
  it('an enemy KO awards SCORE.ko exactly once (score arithmetic)', () => {
    const w = createWorld(1);
    const h = heroOf(w);
    const g = spawnGang(w, 'brawler', h.pos.x + 20, h.pos.y);
    g.hp = 5;
    applyHit(w, h, g, HERO_DATA.moves.attack1!); // drives hp <= 0 -> knockdown
    const scoreAfterHit = w.score;
    let koEvents = 0;
    for (let i = 0; i < 120; i++) {
      tick(w, EMPTY_INPUT);
      koEvents += w.events.filter((e) => e.type === 'score' && (e as { amount: number }).amount === SCORE.ko).length;
    }
    expect(g.state).toBe('dead');
    expect(koEvents).toBe(1);
    expect(w.score).toBe(scoreAfterHit + SCORE.ko);
  });

  const buildFullWorld = () => {
    const w = createWorld(7);
    const h = heroOf(w);
    spawnGang(w, 'brawler', h.pos.x + 80, h.pos.y);
    spawnGang(w, 'knife', h.pos.x + 120, h.pos.y + 10);
    spawnCrate(w, h.pos.x + 40, h.pos.y, 'lunchpail');
    spawnPickup(w, 'gear', h.pos.x + 30, h.pos.y + 40);
    return w;
  };

  const inputs = Array.from({ length: 400 }, (_, i) =>
    encodeInput({ ...EMPTY_INPUT, right: i % 100 < 70, up: i % 160 < 40, attack: i % 20 === 0, jump: i % 111 === 0 }),
  );

  it('determinism holds with the full ticket-06/08/09 entity set (gang + crate + pickup)', () => {
    expect(runReplay(7, inputs, buildFullWorld()).hash).toBe(runReplay(7, inputs, buildFullWorld()).hash);
  });

  it('the full-entity replay is input-sensitive (guards against a trivially-equal pass)', () => {
    // A sustained 60-frame window of opposite movement guarantees lasting divergence even if some
    // frames land mid-attack (where directional input is ignored).
    const alt = inputs.map((n, i) => (i >= 200 && i < 260 ? encodeInput({ ...EMPTY_INPUT, left: true }) : n));
    expect(runReplay(7, inputs, buildFullWorld()).hash).not.toBe(runReplay(7, alt, buildFullWorld()).hash);
  });
});

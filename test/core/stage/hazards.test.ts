// test/core/stage/hazards.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { EMPTY_INPUT } from '@core/types';
import type { StageData } from '@core/stage/stage1';
import { ladlePhase } from '@core/stage/hazards';

const stage = (hazards: StageData['sections'][0]['hazards']): StageData =>
  ({ width: 2000, sections: [{ name: 'A', bg: 's1', startX: 0, hazards }], locks: [], bossDoorX: 1500 });

describe('hazards', () => {
  it('a belt pushes bodies along x while inside its y-band', () => {
    const w = createWorld(1, undefined, stage([{ type: 'belt', x1: 0, x2: 500, y1: 128, y2: 160, push: 0.6 }])); const h = heroOf(w);
    h.pos.y = 140; const x0 = h.pos.x;
    for (let i = 0; i < 10; i++) tick(w, EMPTY_INPUT);
    expect(h.pos.x).toBeCloseTo(x0 + 6);
    h.pos.y = 190; const x1 = h.pos.x;
    for (let i = 0; i < 10; i++) tick(w, EMPTY_INPUT);
    expect(h.pos.x).toBe(x1);
  });
  it('the molten channel knocks down anything touching it from any side, once per contact', () => {
    const w = createWorld(1, undefined, stage([{ type: 'channel', x1: 100, x2: 200, y1: 184, y2: 208 }])); const h = heroOf(w);
    h.pos.x = 90; h.pos.y = 195; h.vel.x = 0;
    for (let i = 0; i < 12; i++) tick(w, { ...EMPTY_INPUT, right: true });
    expect(h.state === 'knockdown' || h.state === 'down').toBe(true);
    expect(h.hp).toBe(92);
    expect(h.vel.x <= 0 || h.state === 'down').toBe(true);   // pushed back out, away from the channel
  });
  it('ladle pours show a tell for tellFrames before damage frames, on a fixed period', () => {
    const L = { type: 'ladle' as const, x: 300, w: 72, period: 240, tellFrames: 60, damageFrames: 30 };
    expect(ladlePhase(L, 0)).toBe('tell'); expect(ladlePhase(L, 59)).toBe('tell');
    expect(ladlePhase(L, 60)).toBe('pour'); expect(ladlePhase(L, 89)).toBe('pour');
    expect(ladlePhase(L, 90)).toBe('idle'); expect(ladlePhase(L, 240)).toBe('tell');
    const w = createWorld(1, undefined, stage([L])); const h = heroOf(w);
    h.pos.x = 300; h.pos.y = 170;
    let tells = 0;
    for (let i = 0; i < 260; i++) { tick(w, EMPTY_INPUT); tells += w.events.filter((e) => e.type === 'hazardTell').length; }
    expect(tells).toBe(1);          // the tell edge at frame 240 (frames 0..59 are mid-tell at boot, no edge)
    expect(h.hp).toBe(85);          // one pour (frames 60..89) hits once, not on every damage frame
  });
});

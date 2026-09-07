// test/core/arcade/hud.test.ts
import { describe, it, expect } from 'vitest';
import { healthBand, formatScore, nameCardX, NAME_CARD, ENEMY_NAMES } from '@core/arcade/hud';

describe('hud rules', () => {
  it('health bands', () => {
    expect(healthBand(100, 100)).toBe('green');
    expect(healthBand(51, 100)).toBe('green');
    expect(healthBand(50, 100)).toBe('amber');
    expect(healthBand(26, 100)).toBe('amber');
    expect(healthBand(25, 100)).toBe('red');
    expect(healthBand(0, 100)).toBe('red');
  });
  it('score format is six digits, clamped', () => {
    expect(formatScore(0)).toBe('000000');
    expect(formatScore(1234)).toBe('001234');
    expect(formatScore(1_000_000)).toBe('999999');
  });
  it('name-card slides in over 6 frames, holds 24, exits over 4 at constant velocity', () => {
    const w = 384, cw = 200, centre = (w - cw) / 2;
    expect(nameCardX(0, w, cw)).toBe(-cw);
    expect(nameCardX(NAME_CARD.inFrames, w, cw)).toBe(centre);
    const step = nameCardX(1, w, cw)! - nameCardX(0, w, cw)!;
    // constant velocity: successive deltas equal within IEEE-754 precision (x is Math.round-ed by NameCard.ts).
    // ORCH DEVIATION (owner-ratifiable): plan used `.toBe`, but the verbatim formula's `292*1/6` vs `292*2/6`
    // differ by one ULP (48.66666666666666 vs …667) — `.toBeCloseTo` matches the property actually intended.
    expect(nameCardX(2, w, cw)! - nameCardX(1, w, cw)!).toBeCloseTo(step);
    expect(nameCardX(NAME_CARD.inFrames + NAME_CARD.holdFrames, w, cw)).toBe(centre);
    expect(nameCardX(NAME_CARD.total, w, cw)).toBeNull();
    expect(nameCardX(NAME_CARD.total - 1, w, cw)!).toBeGreaterThan(centre);
  });
  it('every enemy kind has a display name', () => {
    for (const k of ['brawler', 'knife', 'heavy', 'feral', 'boss']) expect(ENEMY_NAMES[k]).toMatch(/^[A-Z ]+$/);
  });
});

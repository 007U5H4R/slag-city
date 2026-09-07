// src/core/arcade/hud.ts
export type HealthBand = 'green' | 'amber' | 'red';
export function healthBand(hp: number, maxHp: number): HealthBand {
  const r = hp / maxHp;
  return r > 0.5 ? 'green' : r > 0.25 ? 'amber' : 'red';
}
export const SCORE_MAX = 999_999;
export const formatScore = (n: number): string => String(Math.max(0, Math.min(SCORE_MAX, Math.floor(n)))).padStart(6, '0');

export const NAME_CARD = { inFrames: 6, holdFrames: 24, outFrames: 4, total: 34 } as const;
/** x of the card's left edge at `frame`, or null once the card has left. Constant velocity, no easing (Design §4). */
export function nameCardX(frame: number, screenW: number, cardW: number): number | null {
  const centre = (screenW - cardW) / 2;
  if (frame < NAME_CARD.inFrames) return -cardW + ((centre + cardW) * frame) / NAME_CARD.inFrames;
  if (frame < NAME_CARD.inFrames + NAME_CARD.holdFrames) return centre;
  const t = frame - NAME_CARD.inFrames - NAME_CARD.holdFrames;
  if (t >= NAME_CARD.outFrames) return null;
  return centre + ((screenW - centre) * t) / NAME_CARD.outFrames;
}

/** Working names (final names are an open question in HANDOFF.md; only this table changes). */
export const ENEMY_NAMES: Record<string, string> = {
  brawler: 'PIT BRAWLER', knife: 'SHIV', heavy: 'CRUSHER', feral: 'FERAL RIG', boss: 'THE FOREMAN',
};

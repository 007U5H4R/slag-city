// src/core/combat/hit-feel.ts
/** THE hit-feel file (Solution-PRD §3). Change numbers here, nowhere else. */
export const HIT_FEEL = {
  hitstop: { light: 3, heavy: 5, launch: 8 },
  shakePx: { light: 0, heavy: 2, launch: 2 },
  shakeFrames: 6,
  flashFrames: 2,
  hitstun: { light: 14, heavy: 20 },
  launch: { vz: 3.5, vx: 2.5 },
  downFrames: 30,
  getupFrames: 20,
  getupGraceFrames: 10,
} as const;

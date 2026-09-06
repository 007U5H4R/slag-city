// src/shell/scale.ts
export const BASE_W = 384;
export const BASE_H = 224;

/** Largest integer scale k >= 1 such that BASE_W*k <= viewportW and BASE_H*k <= viewportH - chromeH. */
export function computeIntegerScale(viewportW: number, viewportH: number, chromeH = 0): number {
  const kx = Math.floor(viewportW / BASE_W);
  const ky = Math.floor((viewportH - chromeH) / BASE_H);
  return Math.max(1, Math.min(kx, ky));
}

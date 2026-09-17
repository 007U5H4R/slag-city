// src/shell/scale.ts
export const BASE_W = 384;
export const BASE_H = 224;

/**
 * Mobile framebuffer scale. The canvas is CSS-fitted to the screen, so k only decides how many real pixels the
 * game renders: at k=1 the 8–12px UI text was rasterised at 384×224 and then stretched ~1.7× — mush. Render at
 * (roughly) the device's pixel density instead and let CSS scale DOWN. Clamped 2..3 to keep phone GPUs comfortable.
 */
export function computeMobileScale(viewportW: number, viewportH: number, dpr: number): number {
  const w = Math.max(viewportW, viewportH), h = Math.min(viewportW, viewportH); // always reason in landscape
  const cssCanvasW = Math.min(w, h * (BASE_W / BASE_H));
  return Math.max(2, Math.min(3, Math.ceil((cssCanvasW * (dpr || 1)) / BASE_W)));
}

/** Largest integer scale k >= 1 such that BASE_W*k <= viewportW and BASE_H*k <= viewportH - chromeH. */
export function computeIntegerScale(viewportW: number, viewportH: number, chromeH = 0): number {
  const kx = Math.floor(viewportW / BASE_W);
  const ky = Math.floor((viewportH - chromeH) / BASE_H);
  return Math.max(1, Math.min(kx, ky));
}

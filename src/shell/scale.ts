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

/**
 * The cabinet's marquee + control-panel strip cost 176px of height. On a typical laptop (≈780px viewport) that is
 * exactly the difference between ×2 and ×3 — a 2.25× larger picture. Keep the full cabinet only when it's free:
 * if dropping to the compact chrome (bezel only) gains a whole scale step, take the bigger game.
 */
export function chooseCabinet(viewportW: number, viewportH: number, fullChromeH: number, compactChromeH: number): { k: number; compact: boolean } {
  const full = computeIntegerScale(viewportW, viewportH, fullChromeH);
  const compact = computeIntegerScale(viewportW, viewportH, compactChromeH);
  return compact > full ? { k: compact, compact: true } : { k: full, compact: false };
}

/** Largest integer scale k >= 1 such that BASE_W*k <= viewportW and BASE_H*k <= viewportH - chromeH. */
export function computeIntegerScale(viewportW: number, viewportH: number, chromeH = 0): number {
  const kx = Math.floor(viewportW / BASE_W);
  const ky = Math.floor((viewportH - chromeH) / BASE_H);
  return Math.max(1, Math.min(kx, ky));
}

// src/adapters/phaser/views/ui-font.ts
// Modern UI font for score/credits/scoreboard/entry/menus (Design nuance: arcade game, modern UI text).
// Monospaced (Roboto Mono, loaded in index.html) so numeric columns still align like the old bitmap font.
// The pure-arcade cues (marquee image, name-cards, INSERT COIN/PRESS START) stay on the bitmap font.
export const UI_FONT = "'Roboto Mono', ui-monospace, monospace";

// Kick the browser to fetch the weights we use so Phaser Text renders in the real font, not a fallback.
export function preloadUiFont(): void {
  try {
    const f = (document as unknown as { fonts?: { load?: (s: string) => Promise<unknown> } }).fonts;
    void f?.load?.("700 16px 'Roboto Mono'");
    void f?.load?.("500 16px 'Roboto Mono'");
  } catch { /* fonts API absent — Text falls back to monospace, still legible */ }
}

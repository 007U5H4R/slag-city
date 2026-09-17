import Phaser from 'phaser';
import { createGame } from '@adapters/phaser/createGame';
import { applyScale } from '@adapters/phaser/scale';
import { computeIntegerScale, computeMobileScale } from '@shell/scale';
import { installViewportGate } from '@shell/viewport-gate';
import { installCabinet } from '@shell/cabinet';
import { isTouchDevice, installTouchControls } from '@shell/touch-controls';
import { initAnalytics, track, EVENTS } from '@shell/analytics';
import { installAudioUnlock } from '@adapters/phaser/audio/unlock';
import { openHiScores } from '@shell/hiscore-store';
import { preloadUiFont } from '@adapters/phaser/views/ui-font';
import type { GameScene } from '@adapters/phaser/scenes/GameScene';

const screen = document.getElementById('screen');
if (!screen) throw new Error('#screen missing from index.html');

// Warm the hi-score kv once at boot (IndexedDB, silent memory fallback); GameScene reads the table from it.
void openHiScores();
preloadUiFont(); // fetch the modern UI font (Roboto Mono) so Text renders in it, not a fallback

// Product analytics (Mixpanel). No-op unless VITE_MIXPANEL_TOKEN is set; funnel step 1 = landed the page.
void initAnalytics(); // lazy-loads the SDK; track() calls made meanwhile are queued
track(EVENTS.PAGE_LOADED);

const cabinet = installCabinet();

// Mobile mode: a touch-primary device plays with the on-screen controls and the chrome-less, screen-filling
// layout (<body class="mobile">, styled in room.css) instead of the desktop cabinet + "desktop required" gate.
const MOBILE = isTouchDevice();
if (MOBILE) {
  document.documentElement.classList.add('mobile'); // lets CSS kill browser gestures on <html> too (room.css)
  document.body.classList.add('mobile');
  installTouchControls();
  // "Rotate to landscape" is a nudge, not a wall: an orientation-locked phone can tap through and play in portrait
  // (the canvas sits mid-screen and the controls land in the empty space below it).
  document.getElementById('rotate')?.addEventListener('pointerdown', () => {
    document.body.classList.add('portrait-ok'); window.dispatchEvent(new CustomEvent('slag:orientation'));
  });
  // iOS ignores user-scalable=no: block pinch + double-tap zoom, which would shove the fixed controls off-screen.
  for (const type of ['gesturestart', 'gesturechange', 'dblclick'] as const) document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}

const chromeH = (): number => cabinet.chromeHeight();
// On mobile the framebuffer renders at ~device density (k=2..3) and CSS fits the canvas to the screen (room.css);
// the integer-scale cabinet math is desktop-only.
const currentScale = (): number => MOBILE
  ? computeMobileScale(window.innerWidth, window.innerHeight, window.devicePixelRatio)
  : computeIntegerScale(window.innerWidth, window.innerHeight, chromeH());

let game: Phaser.Game | null = null;
let lastK = currentScale();
const boot = (): void => {
  if (game) return;
  lastK = currentScale();
  game = createGame(screen, lastK);
  game.registry.set('mobile', MOBILE); // scenes read this: CRT pass off + pause-in-portrait on mobile
  installAudioUnlock(game);
  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
  installTestHook();
  game.events.once(Phaser.Core.Events.READY, () => {
    if (game && game.renderer.type === Phaser.CANVAS) {
      const n = document.createElement('div');
      n.id = 'notice';
      n.textContent = 'WebGL unavailable — running on the Canvas renderer, CRT pass off.';
      document.body.appendChild(n);
    }
  });
};
// Desktop is gated below a keyboard-friendly width; mobile is never gated (it boots straight into touch play).
const isGated: () => boolean = MOBILE ? () => false : installViewportGate((gated) => { if (!gated) boot(); });
if (MOBILE) boot();
// Read-only test hook for the Playwright smoke (always present; harmless, no data leaves the page).
function installTestHook(): void {
  const scene = (): GameScene | undefined => game?.scene.getScene('game') as GameScene | undefined;
  Object.defineProperty(window, '__slag', {
    value: {
      // Guard `arcade`/`views`/`world`: the scene can exist for a frame before create() assigns them
      // (a race a slower host exposes), and this read-only hook must never throw.
      screen: () => scene()?.arcade?.screen ?? 'BOOT',
      heroVisible: () => { const s = scene(); return !!s?.arcade && s.arcade.screen === 'PLAY' && !!s.views?.has(s.world.heroId); },
      scale: () => lastK,
    },
    writable: false,
  });
}

window.addEventListener('resize', () => {
  if (isGated() || !game) return;
  const k = currentScale();
  if (k !== lastK) { lastK = k; applyScale(game, k); }
});

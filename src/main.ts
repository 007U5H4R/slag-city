import Phaser from 'phaser';
import { createGame } from '@adapters/phaser/createGame';
import { applyScale } from '@adapters/phaser/scale';
import { computeIntegerScale } from '@shell/scale';
import { installViewportGate } from '@shell/viewport-gate';
import { installCabinet } from '@shell/cabinet';
import { installAudioUnlock } from '@adapters/phaser/audio/unlock';

const screen = document.getElementById('screen');
if (!screen) throw new Error('#screen missing from index.html');

const cabinet = installCabinet();

const chromeH = (): number => cabinet.chromeHeight();
const currentScale = (): number => computeIntegerScale(window.innerWidth, window.innerHeight, chromeH());

let game: Phaser.Game | null = null;
let lastK = currentScale();
const isGated = installViewportGate((gated) => {
  if (!gated && !game) {
    lastK = currentScale();
    game = createGame(screen, lastK);
    installAudioUnlock(game);
    if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
    game.events.once(Phaser.Core.Events.READY, () => {
      if (game && game.renderer.type === Phaser.CANVAS) {
        const n = document.createElement('div');
        n.id = 'notice';
        n.textContent = 'WebGL unavailable — running on the Canvas renderer, CRT pass off.';
        document.body.appendChild(n);
      }
    });
  }
});
window.addEventListener('resize', () => {
  if (isGated() || !game) return;
  const k = currentScale();
  if (k !== lastK) { lastK = k; applyScale(game, k); }
});

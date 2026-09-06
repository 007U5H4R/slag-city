import { createGame } from '@adapters/phaser/createGame';
import { applyScale } from '@adapters/phaser/scale';
import { computeIntegerScale } from '@shell/scale';

const screen = document.getElementById('screen');
if (!screen) throw new Error('#screen missing from index.html');

const chromeH = (): number => {
  const s = getComputedStyle(document.documentElement);
  return parseInt(s.getPropertyValue('--marquee-h')) + parseInt(s.getPropertyValue('--panel-h'));
};
const currentScale = (): number => computeIntegerScale(window.innerWidth, window.innerHeight, chromeH());

let lastK = currentScale();
const game = createGame(screen, lastK);
window.addEventListener('resize', () => {
  const k = currentScale();
  if (k !== lastK) { lastK = k; applyScale(game, k); }
});

import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';

/** Resize the native framebuffer to BASE*k and tell scenes to re-zoom their cameras. */
export function applyScale(game: Phaser.Game, k: number): void {
  game.registry.set('scale', k);
  game.scale.resize(BASE_W * k, BASE_H * k);
  game.events.emit('rescale', k);
}

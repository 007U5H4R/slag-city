import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { GameScene } from './scenes/GameScene';
import { TestPatternScene } from './scenes/TestPatternScene';

export function createGame(parent: HTMLElement, k: number): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: BASE_W * k,
    height: BASE_H * k,
    pixelArt: true,
    backgroundColor: '#000000',
    render: { antialias: false, roundPixels: true, powerPreference: 'high-performance' },
    scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER },
    fps: { target: 60, forceSetTimeOut: false },
    scene: [GameScene, TestPatternScene],
  });
  game.registry.set('scale', k);
  return game;
}

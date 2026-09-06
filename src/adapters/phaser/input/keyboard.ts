// src/adapters/phaser/input/keyboard.ts
import Phaser from 'phaser';
import type { InputFrame } from '@core/types';

export interface InputSource { read(): InputFrame }

const K = Phaser.Input.Keyboard.KeyCodes;

export class KeyboardSource implements InputSource {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) throw new Error('keyboard plugin unavailable');
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN,
      a: K.A, d: K.D, w: K.W, s: K.S,
      attack: K.J, jump: K.K, special: K.L, start: K.ENTER, coin: K.FIVE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    kb.addCapture([K.UP, K.DOWN, K.LEFT, K.RIGHT, K.SPACE]); // stop page scroll
  }
  read(): InputFrame {
    const d = (n: string) => this.keys[n]?.isDown === true;
    return {
      left: d('left') || d('a'), right: d('right') || d('d'), up: d('up') || d('w'), down: d('down') || d('s'),
      attack: d('attack'), jump: d('jump'), special: d('special'), start: d('start'), coin: d('coin'),
    };
  }
}

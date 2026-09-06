// src/adapters/phaser/scenes/TestPatternScene.ts
import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting } from '@shell/settings';
import { enableCrt } from '../crt/CrtPipeline';

export class TestPatternScene extends Phaser.Scene {
  constructor() { super('pattern'); }
  create(): void {
    const k = (this.registry.get('scale') as number | undefined) ?? 1;
    this.cameras.main.setZoom(k); this.cameras.main.centerOn(BASE_W / 2, BASE_H / 2);
    this.game.events.on('rescale', (n: number) => { this.cameras.main.setZoom(n); this.cameras.main.centerOn(BASE_W / 2, BASE_H / 2); });
    const g = this.add.graphics();
    for (let y = 0; y < BASE_H; y += 8) for (let x = 0; x < BASE_W; x += 8) {
      g.fillStyle(((x + y) / 8) % 2 === 0 ? 0xffffff : 0x000000, 1);
      g.fillRect(x, y, 8, 8);
    }
    g.fillStyle(0xff8800, 1); g.fillRect(96, 96, 192, 32);
    this.add.text(100, 104, 'SLAG CITY 384x224 CRT TEST', { fontFamily: 'monospace', fontSize: '12px', color: '#000000' });
    enableCrt(this, getSetting('crt'));
  }
}

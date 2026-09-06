import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';

export class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.applyZoom((this.registry.get('scale') as number | undefined) ?? 1);
    this.game.events.on('rescale', (k: number) => this.applyZoom(k));
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
  }
}

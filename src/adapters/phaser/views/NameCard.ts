// src/adapters/phaser/views/NameCard.ts
import type Phaser from 'phaser';
import { nameCardX, NAME_CARD } from '@core/arcade/hud';
import { HUD_COLOURS } from './hud-colours';
import { BASE_W } from '@shell/scale';

const CARD_W = 256, CARD_H = 32, CARD_Y = 96;
export class NameCardView {
  private g: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.BitmapText;
  private frame: number = NAME_CARD.total;
  private queue: string[] = [];
  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(2500).setVisible(false);
    this.text = scene.add.bitmapText(0, 0, 'display16', '').setOrigin(0.5).setDepth(2501).setTint(HUD_COLOURS.text).setVisible(false);
  }
  show(name: string): void { this.queue.push(name); }
  step(n: number): void {
    if (this.frame >= NAME_CARD.total && this.queue.length > 0) { this.text.setText(this.queue.shift() as string); this.frame = 0; }
    if (this.frame >= NAME_CARD.total) { this.g.setVisible(false); this.text.setVisible(false); return; }
    this.frame += n;
    const x = nameCardX(this.frame, BASE_W, CARD_W);
    if (x === null) { this.frame = NAME_CARD.total; this.g.setVisible(false); this.text.setVisible(false); return; }
    this.g.clear().setVisible(true);
    this.g.fillStyle(HUD_COLOURS.plate, 1).fillRect(Math.round(x), CARD_Y, CARD_W, CARD_H);
    this.g.lineStyle(2, HUD_COLOURS.brass, 1).strokeRect(Math.round(x) + 1, CARD_Y + 1, CARD_W - 2, CARD_H - 2);
    this.text.setVisible(true).setPosition(Math.round(x) + CARD_W / 2, CARD_Y + CARD_H / 2);
  }
}

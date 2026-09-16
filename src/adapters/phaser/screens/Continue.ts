// src/adapters/phaser/screens/Continue.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { blinkOn } from '@core/arcade/screen-machine';
import type { ArcadeState } from '@core/arcade/screen-machine';
import { HUD_COLOURS } from '../views/hud-colours';

// CONTINUE overlay: the frozen hero shows through a dim plate while a per-second countdown ticks down.
// (The `continue_tick` audio cue is deferred with the rest of the audio pass; the machine drives the frames.)
export class Continue {
  private dim: Phaser.GameObjects.Rectangle;
  private count: Phaser.GameObjects.BitmapText;
  private prompt: Phaser.GameObjects.BitmapText;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.dim = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, HUD_COLOURS.plate, 0.6).setDepth(3000).setVisible(false);
    this.count = scene.add.bitmapText(BASE_W / 2, BASE_H / 2 - 8, 'display16', '10').setOrigin(0.5).setScale(2).setDepth(3001).setVisible(false);
    this.prompt = scene.add.bitmapText(BASE_W / 2, BASE_H / 2 + 40, 'hud8', 'INSERT COIN TO CONTINUE').setOrigin(0.5).setDepth(3001).setVisible(false);
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.dim.setVisible(false); this.count.setVisible(false); this.prompt.setVisible(false);
  }

  step(arcade: ArcadeState, _n: number): void {
    if (!this.active) return;
    this.dim.setVisible(true);
    const secs = Math.max(0, Math.ceil(arcade.continueFrames / 60));
    this.count.setText(String(secs)).setVisible(true);
    this.prompt.setVisible(blinkOn(arcade.screenFrame));
  }
}

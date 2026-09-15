// src/adapters/phaser/screens/Attract.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { blinkOn } from '@core/arcade/screen-machine';
import type { ArcadeState } from '@core/arcade/screen-machine';

// Title card for ATTRACT + COIN. `INSERT COIN` blinks with no credits, `PRESS START` once one is banked.
// The wordmark is the display font until ticket 21 ships `marquee.png`, then the logo image takes over.
export class Attract {
  private title: Phaser.GameObjects.BitmapText;
  private marquee?: Phaser.GameObjects.Image;
  private insertCoin: Phaser.GameObjects.BitmapText;
  private pressStart: Phaser.GameObjects.BitmapText;
  private active = false;

  constructor(scene: Phaser.Scene) {
    if (scene.textures.exists('marquee')) {
      this.marquee = scene.add.image(BASE_W / 2, BASE_H / 3, 'marquee').setOrigin(0.5).setDepth(3000).setScrollFactor(0).setVisible(false);
    }
    this.title = scene.add.bitmapText(BASE_W / 2, BASE_H / 3, 'display16', 'SLAG CITY').setOrigin(0.5).setDepth(3000).setScrollFactor(0).setVisible(false);
    this.insertCoin = scene.add.bitmapText(BASE_W / 2, BASE_H - 40, 'hud8', 'INSERT COIN').setOrigin(0.5).setDepth(3001).setScrollFactor(0).setVisible(false);
    this.pressStart = scene.add.bitmapText(BASE_W / 2, BASE_H - 40, 'hud8', 'PRESS START').setOrigin(0.5).setDepth(3001).setScrollFactor(0).setVisible(false);
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.marquee?.setVisible(false); this.title.setVisible(false);
    this.insertCoin.setVisible(false); this.pressStart.setVisible(false);
  }

  step(arcade: ArcadeState, _n: number): void {
    if (!this.active) return;
    if (this.marquee) this.marquee.setVisible(true); else this.title.setVisible(true);
    const on = blinkOn(arcade.screenFrame);
    const needCredit = arcade.credits === 0;
    this.insertCoin.setVisible(on && needCredit);
    this.pressStart.setVisible(on && !needCredit);
  }
}

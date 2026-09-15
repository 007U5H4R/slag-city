// src/adapters/phaser/screens/GameOver.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import type { ArcadeState } from '@core/arcade/screen-machine';

// End-of-game card: `GAME OVER` on death-out, or `STAGE CLEAR` when the boss was defeated.
// `stageClear` is set by the scene each frame from `world.stage.bossDefeated` before `step`.
export class GameOver {
  stageClear = false;
  private text: Phaser.GameObjects.BitmapText;
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add.bitmapText(BASE_W / 2, BASE_H / 2, 'display16', 'GAME OVER').setOrigin(0.5).setDepth(3000).setScrollFactor(0).setVisible(false);
  }

  show(): void { this.active = true; }
  hide(): void { this.active = false; this.text.setVisible(false); }

  step(_arcade: ArcadeState, _n: number): void {
    if (!this.active) return;
    this.text.setText(this.stageClear ? 'STAGE CLEAR' : 'GAME OVER').setVisible(true);
  }
}

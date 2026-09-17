// src/adapters/phaser/screens/GameOver.ts
// End-of-game card (modern UI font). Two moods, deliberately differentiated so the peak and the valley don't
// read the same: boss defeated -> "STAGE CLEAR!" (gold accent) + congrats + PRESS START into name entry;
// death-out -> "GAME OVER" (red accent) + FINAL SCORE + a blinking INSERT COIN / PRESS START re-coin pitch.
// Both show the final score and route to the hi-score table. `stageClear` is set by the scene each frame from
// `world.stage.bossDefeated` before `step`; the arcade state supplies finalScore, credits, and the blink clock.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import type { ArcadeState } from '@core/arcade/screen-machine';
import { blinkOn } from '@core/arcade/screen-machine';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';
import { deviceCopy, type DeviceCopy } from '../views/device-copy';
import { setFitted } from '../views/fit-text';

const GOLD = '#f0c040', RED = '#e0503a', TEXT = '#e8dcc0', DIM = '#b8ac95';
const BOX = { w: 320, h: 108 };
const hex = (css: string): number => parseInt(css.slice(1), 16); // one source of truth for the mood colours

export class GameOver {
  stageClear = false;
  private frame: ScifiFrame;
  private accent: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private score: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private active = false;
  private copy: DeviceCopy;
  private mood: boolean | null = null; // last drawn stageClear; the title + accent only redraw when it changes
  private readonly cx = BASE_W / 2;
  private readonly cy = BASE_H / 2;

  constructor(scene: Phaser.Scene) {
    const { cx, cy } = this;
    this.copy = deviceCopy(scene);
    this.frame = new ScifiFrame(scene, 3000);
    this.frame.draw(cx - BOX.w / 2, cy - BOX.h / 2, BOX.w, BOX.h);
    this.accent = scene.add.graphics().setDepth(3001).setVisible(false);
    this.title = scene.add.text(cx, cy - 30, '', { fontFamily: UI_FONT, fontSize: '22px', fontStyle: '700', color: RED })
      .setOrigin(0.5, 0.5).setDepth(3002).setResolution(4).setVisible(false);
    this.score = scene.add.text(cx, cy + 6, '', { fontFamily: UI_FONT, fontSize: '11px', fontStyle: '500', color: TEXT })
      .setOrigin(0.5, 0.5).setDepth(3002).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(cx, cy + 32, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '700', color: DIM })
      .setOrigin(0.5, 0.5).setDepth(3002).setResolution(4).setVisible(false);
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false; this.mood = null;
    this.frame.hide();
    for (const o of [this.title, this.score, this.prompt]) o.setVisible(false);
    this.accent.setVisible(false);
  }

  step(arcade: ArcadeState, _n: number): void {
    if (!this.active) return;
    this.frame.show(true);
    // Title + mood accent (a soft colour bar under the title: gold STAGE CLEAR vs red GAME OVER) only change
    // with `stageClear`, so draw them once per mood rather than every frame.
    if (this.mood !== this.stageClear) {
      this.mood = this.stageClear;
      const colour = this.stageClear ? GOLD : RED;
      const g = this.accent; g.clear(); g.setVisible(true);
      g.fillStyle(hex(colour), 0.18).fillRect(this.cx - 92, this.cy - 15, 184, 8);
      g.fillStyle(hex(colour), 0.9).fillRect(this.cx - 70, this.cy - 12, 140, 2);
      this.title.setText(this.stageClear ? 'CHAPTER ONE CLEAR' : 'GAME OVER').setColor(colour).setVisible(true);
    }
    this.score.setText(`FINAL SCORE   ${String(arcade.finalScore).padStart(6, '0')}`).setVisible(true);
    // Honest prompt: START advances to the ranking; a coin (when none banked) starts a fresh game after entry.
    const startWord = this.copy.start.replace(' — START', '');
    const prompt = this.stageClear
      ? `CONGRATULATIONS   ·   ${startWord}`
      : (arcade.credits > 0 ? `${startWord} FOR THE RANKING` : `${this.copy.coin}  ·  PLAY AGAIN FREE`);
    setFitted(this.prompt, prompt, BOX.w - 32).setVisible(true).setAlpha(blinkOn(arcade.screenFrame) ? 1 : 0.55);
  }
}

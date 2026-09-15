// src/adapters/phaser/screens/HiScoreEntry.ts
// AAA initials entry: `ENTER YOUR INITIALS`, the final score, three big letters (the active one blinks), and a
// controls hint. The scene owns the EntryState + input edges (reduceEntry) and the insert/save; this view only
// renders whatever state it is handed. Plain view class per the 18.3 convention.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { blinkOn } from '@core/arcade/screen-machine';
import { formatScore } from '@core/arcade/hud';
import { LETTERS } from '@core/arcade/initials';
import type { EntryState } from '@core/arcade/initials';
import { HUD_COLOURS } from '../views/hud-colours';

const LETTER_Y = 112;
const LETTER_DX = 28;

export class HiScoreEntry {
  private dim: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.BitmapText;
  private score: Phaser.GameObjects.BitmapText;
  private letters: Phaser.GameObjects.BitmapText[];
  private hint: Phaser.GameObjects.BitmapText;
  private active = false;

  constructor(scene: Phaser.Scene) {
    const cx = BASE_W / 2;
    this.dim = scene.add.rectangle(cx, BASE_H / 2, BASE_W, BASE_H, HUD_COLOURS.plate, 0.88)
      .setDepth(3200).setScrollFactor(0).setVisible(false);
    this.title = scene.add.bitmapText(cx, 48, 'display16', 'ENTER YOUR INITIALS')
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setTint(HUD_COLOURS.brass).setVisible(false);
    this.score = scene.add.bitmapText(cx, 78, 'hud8', '')
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setTint(HUD_COLOURS.text).setVisible(false);
    this.letters = [0, 1, 2].map((i) =>
      scene.add.bitmapText(cx + (i - 1) * LETTER_DX, LETTER_Y, 'display16', 'A')
        .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setTint(HUD_COLOURS.gold).setVisible(false));
    this.hint = scene.add.bitmapText(cx, 168, 'hud8', 'UP/DOWN CHANGE   ATTACK CONFIRM')
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setTint(HUD_COLOURS.text).setVisible(false);
  }

  setState(entry: EntryState, screenFrame: number, finalScore: number): void {
    this.score.setText(`SCORE ${formatScore(finalScore)}`);
    const on = blinkOn(screenFrame);
    for (let i = 0; i < 3; i++) {
      this.letters[i]!.setText(LETTERS[entry.letters[i]!] ?? 'A');
      // The active slot pulses; a finished (done) entry stops blinking so all three read solid.
      const blinking = i === entry.pos && !entry.done;
      this.letters[i]!.setAlpha(blinking && !on ? 0.2 : 1);
    }
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.dim.setVisible(false); this.title.setVisible(false); this.score.setVisible(false);
    for (const l of this.letters) l.setVisible(false);
    this.hint.setVisible(false);
  }

  step(_n: number): void {
    if (!this.active) return;
    this.dim.setVisible(true); this.title.setVisible(true); this.score.setVisible(true);
    for (const l of this.letters) l.setVisible(true);
    this.hint.setVisible(true);
  }
}

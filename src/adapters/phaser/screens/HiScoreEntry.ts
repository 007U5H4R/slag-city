// src/adapters/phaser/screens/HiScoreEntry.ts
// AAA initials entry in the MODERN UI font (Roboto Mono): `ENTER YOUR INITIALS`, the final score, three big
// letters (the active one blinks), and a controls hint. The scene owns the EntryState + input edges
// (reduceEntry) and the insert/save; this view only renders whatever state it is handed.
import type Phaser from 'phaser';
import { BASE_W } from '@shell/scale';
import { blinkOn } from '@core/arcade/screen-machine';
import { formatScore } from '@core/arcade/hud';
import { LETTERS } from '@core/arcade/initials';
import type { EntryState } from '@core/arcade/initials';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';

const LETTER_Y = 112;
const LETTER_DX = 30;
const TEXT = '#e8dcc0', GOLD = '#f0c040', BRASS = '#b08d3c';

export class HiScoreEntry {
  private frame: ScifiFrame;
  private title: Phaser.GameObjects.Text;
  private score: Phaser.GameObjects.Text;
  private letters: Phaser.GameObjects.Text[];
  private hint: Phaser.GameObjects.Text;
  private active = false;

  constructor(scene: Phaser.Scene) {
    const cx = BASE_W / 2;
    this.frame = new ScifiFrame(scene, 3198);
    this.frame.draw(52, 30, 280, 162);
    this.title = scene.add.text(cx, 46, 'ENTER YOUR INITIALS', { fontFamily: UI_FONT, fontSize: '16px', fontStyle: '700', color: BRASS })
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false);
    this.score = scene.add.text(cx, 74, '', { fontFamily: UI_FONT, fontSize: '12px', fontStyle: '500', color: TEXT })
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false);
    this.letters = [0, 1, 2].map((i) =>
      scene.add.text(cx + (i - 1) * LETTER_DX, LETTER_Y, 'A', { fontFamily: UI_FONT, fontSize: '26px', fontStyle: '700', color: GOLD })
        .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false));
    this.hint = scene.add.text(cx, 168, 'UP / DOWN  CHANGE      ATTACK  CONFIRM', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '500', color: TEXT })
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false);
  }

  setState(entry: EntryState, screenFrame: number, finalScore: number): void {
    this.score.setText(`SCORE ${formatScore(finalScore)}`);
    const on = blinkOn(screenFrame);
    for (let i = 0; i < 3; i++) {
      this.letters[i]!.setText(LETTERS[entry.letters[i]!] ?? 'A');
      const blinking = i === entry.pos && !entry.done;
      this.letters[i]!.setAlpha(blinking && !on ? 0.2 : 1);
    }
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.frame.hide(); this.title.setVisible(false); this.score.setVisible(false);
    for (const l of this.letters) l.setVisible(false);
    this.hint.setVisible(false);
  }

  step(_n: number): void {
    if (!this.active) return;
    this.frame.show(); this.title.setVisible(true); this.score.setVisible(true);
    for (const l of this.letters) l.setVisible(true);
    this.hint.setVisible(true);
  }
}

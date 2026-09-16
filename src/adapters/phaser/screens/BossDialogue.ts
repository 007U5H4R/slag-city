// src/adapters/phaser/screens/BossDialogue.ts
// Boss-encounter dialogue: a lower-third sci-fi dialogue bar that trades lines between the protagonist
// and a boss. Data-driven (an array of speaker lines) so sub-bosses reuse it — pass a fresh `Line[]`.
// Adapter-only: GameScene freezes the sim while a pre-fight exchange plays (like the story intro), and
// advances a line per ATTACK press. `active` tells the scene whether to keep the world frozen.
import type Phaser from 'phaser';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';
import { blinkOn } from '@core/arcade/screen-machine';

export type Speaker = 'HERO' | 'KILVISH';
export interface Line { who: Speaker; text: string }

const NAME_COLOUR: Record<Speaker, string> = { HERO: '#ffd24a', KILVISH: '#ff3b6b' };
const LINE_COLOUR = '#e8dcc0';
const BOX = { x: 18, y: 150, w: 348, h: 58 };

export class BossDialogue {
  private frame: ScifiFrame;
  private name: Phaser.GameObjects.Text;
  private line: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private lines: Line[] = [];
  private idx = 0;
  active = false;

  constructor(scene: Phaser.Scene) {
    const D = 3100;
    this.frame = new ScifiFrame(scene, D);
    this.frame.draw(BOX.x, BOX.y, BOX.w, BOX.h);
    this.name = scene.add.text(BOX.x + 12, BOX.y + 6, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '700', color: '#fff' })
      .setDepth(D + 2).setResolution(4).setVisible(false);
    this.line = scene.add.text(BOX.x + 12, BOX.y + 22, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '400', color: LINE_COLOUR, lineSpacing: 3 })
      .setDepth(D + 2).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(BOX.x + BOX.w - 12, BOX.y + BOX.h - 10, '', { fontFamily: UI_FONT, fontSize: '8px', fontStyle: '700', color: '#8a7f6a' })
      .setOrigin(1, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
  }

  // Begin an exchange. Returns false (and shows nothing) for an empty script so callers can no-op safely.
  start(lines: Line[]): boolean {
    if (lines.length === 0) return false;
    this.lines = lines; this.idx = 0; this.active = true;
    this.frame.show(false);
    this.render();
    for (const o of [this.name, this.line, this.prompt]) o.setVisible(true);
    return true;
  }

  // Advance to the next line; returns true when the exchange is finished (and auto-hides).
  advance(): boolean {
    if (!this.active) return true;
    this.idx += 1;
    if (this.idx >= this.lines.length) { this.hide(); return true; }
    this.render();
    return false;
  }

  private render(): void {
    const l = this.lines[this.idx]!;
    this.name.setText(l.who).setColor(NAME_COLOUR[l.who]);
    this.line.setText(l.text);
  }

  step(frame: number): void {
    if (!this.active) return;
    this.prompt.setText(blinkOn(frame) ? 'ATTACK ▸' : '');
  }

  hide(): void {
    this.active = false; this.lines = []; this.idx = 0;
    this.frame.hide();
    for (const o of [this.name, this.line, this.prompt]) o.setVisible(false);
  }
}

// Kilvish — the steel overlord who exterminated Earth and the hero's family. Reuse this shape per sub-boss.
export const KILVISH_PREFIGHT: Line[] = [
  { who: 'KILVISH', text: 'Another insect that refuses to die.' },
  { who: 'HERO', text: 'You took my family, Kilvish.' },
  { who: 'KILVISH', text: 'I took your whole species.\nThey were... inefficient.' },
  { who: 'HERO', text: 'This hammer says otherwise.' },
];
export const KILVISH_DEFEAT: Line[] = [
  { who: 'KILVISH', text: 'Impossible... flesh does not... win—' },
  { who: 'HERO', text: 'For my wife. My children.\nFor all of them.' },
];

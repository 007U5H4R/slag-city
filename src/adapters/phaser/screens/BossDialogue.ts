// src/adapters/phaser/screens/BossDialogue.ts
// Boss-encounter dialogue: a lower-third sci-fi dialogue bar that trades lines between the protagonist
// and a boss. Data-driven (an array of speaker lines) so sub-bosses reuse it — pass a fresh `Line[]`.
// Adapter-only: GameScene freezes the sim while a pre-fight exchange plays (like the story intro), and
// advances a line per ATTACK press. `active` tells the scene whether to keep the world frozen.
import type Phaser from 'phaser';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';
import { blinkOn } from '@core/arcade/screen-machine';
import { deviceCopy } from '../views/device-copy';

// `who` is the on-screen speaker name; 'HERO' is the protagonist (gold), any other name is a boss (red).
export interface Line { who: string; text: string }

const HERO_COLOUR = '#ffd24a', BOSS_COLOUR = '#ff3b6b', LINE_COLOUR = '#e8dcc0';
const BOX = { x: 18, y: 150, w: 348, h: 58 };

export class BossDialogue {
  private frame: ScifiFrame;
  private name: Phaser.GameObjects.Text;
  private line: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private lines: Line[] = [];
  private idx = 0;
  active = false;
  private attackWord: string;

  constructor(scene: Phaser.Scene) {
    const D = 3100;
    this.attackWord = deviceCopy(scene).attack;
    this.frame = new ScifiFrame(scene, D);
    this.frame.draw(BOX.x, BOX.y, BOX.w, BOX.h);
    this.name = scene.add.text(BOX.x + 12, BOX.y + 6, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '700', color: '#fff' })
      .setDepth(D + 2).setResolution(4).setVisible(false);
    this.line = scene.add.text(BOX.x + 12, BOX.y + 22, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '400', color: LINE_COLOUR, lineSpacing: 3 })
      .setDepth(D + 2).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(BOX.x + BOX.w - 12, BOX.y + BOX.h - 10, '', { fontFamily: UI_FONT, fontSize: '8px', fontStyle: '700', color: '#b0a488' })
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
    this.name.setText(l.who).setColor(l.who === 'HERO' ? HERO_COLOUR : BOSS_COLOUR);
    this.line.setText(l.text);
  }

  step(frame: number): void {
    if (!this.active) return;
    this.prompt.setText(`${this.attackWord} ▸`).setAlpha(blinkOn(frame) ? 1 : 0.5); // pulse, never vanish
  }

  hide(): void {
    this.active = false; this.lines = []; this.idx = 0;
    this.frame.hide();
    for (const o of [this.name, this.line, this.prompt]) o.setVisible(false);
  }
}

// The boss gauntlet: two enforcers, then Kilvish. One entry per wave — KEEP IN SYNC with BOSS_WAVES
// (src/core/entities/boss.ts). Every boss round trades a pre-fight taunt and a dying line with the hero.
export interface BossScript { name: string; pre: Line[]; defeat: Line[] }
export const BOSS_SCRIPTS: BossScript[] = [
  {
    name: 'GRIST',
    pre: [
      { who: 'GRIST', text: 'Kilvish spends his soldiers\nbefore he spends himself.' },
      { who: 'HERO', text: 'Then I start with you.' },
    ],
    defeat: [{ who: 'GRIST', text: 'Sys...tem... fail—' }],
  },
  {
    name: 'SLAGJAW',
    pre: [
      { who: 'SLAGJAW', text: 'Flesh. Warm. Inefficient.' },
      { who: 'HERO', text: 'Where is Kilvish?' },
      { who: 'SLAGJAW', text: 'Behind me. Where the\ncondemned always hide.' },
    ],
    defeat: [
      { who: 'SLAGJAW', text: 'You still think Kilvish\nchose your world...' },
      { who: 'HERO', text: 'He gave the order.' },
      { who: 'SLAGJAW', text: 'He followed one.' },
      { who: 'SLAGJAW', text: 'You chase the sword...\nnot the hand.' },
    ],
  },
  {
    name: 'KILVISH',
    pre: [
      { who: 'KILVISH', text: 'Another insect\nthat refuses to die.' },
      { who: 'HERO', text: 'You burned my world.\nMy wife. My children.' },
      { who: 'KILVISH', text: 'Yours was one of hundreds.\nI have lost count.' },
      { who: 'HERO', text: 'This hammer ends it here.' },
    ],
    defeat: [
      { who: 'KILVISH', text: 'Then kill me.\nI am... tired.' },
      { who: 'HERO', text: 'You? Afraid?' },
      { who: 'KILVISH', text: 'I was a father once —\nuntil they made me this.' },
      { who: 'KILVISH', text: 'I burned your world\nbecause he ordered it.' },
      { who: 'HERO', text: 'Who ordered it?' },
      { who: 'KILVISH', text: 'You wanted the monster.\nNow you have his attention.' },
    ],
  },
];

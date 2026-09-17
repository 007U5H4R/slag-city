// src/adapters/phaser/screens/ChapterOneOutro.ts
// "END OF CHAPTER ONE" epilogue, played once after Kilvish falls (his defeat exchange in BossDialogue seeds
// the reveal; this closes it). The Last Signal twist: Kilvish was only the sword — something far older, the
// entity VAELOR, answers across the dark, and a galaxy-wide "HARVEST CYCLE INITIATED" signal fires. A full-
// screen sci-fi card sequence, structurally like StoryIntro but centred and portrait-less. Purely adapter-
// side: GameScene freezes the world while it plays, advances a slide per ATTACK press, and fires the
// deferred STAGE CLEAR transition when the last slide is dismissed. Determinism-safe (no core/sim state).
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';
import { blinkOn } from '@core/arcade/screen-machine';

const BRASS = '#d7a94a', TEXT = '#d8cbb0', DIM = '#8a7f6a', RED = '#ff3b6b';

const BOX = { x: 34, y: 34, w: BASE_W - 68, h: BASE_H - 68 };
const CX = BOX.x + BOX.w / 2;                 // horizontal centre
const CY = BOX.y + BOX.h / 2;                 // vertical centre

// Each slide: an optional big title (`red` renders it in the menace colour) + centred body lines.
interface Slide { title?: string; red?: boolean; body: string[] }
const SLIDES: Slide[] = [
  { body: ['KILVISH falls silent.', '', "But a warlord's last words", 'were not a threat.', '', 'They were a warning.'] },
  { body: ['Across the dark,', 'something answers —', '', 'older than the machines.', 'older than the war.'] },
  { title: 'VAELOR', red: true, body: ['"You have freed my sword,', 'human.', '', 'Now you will meet', 'the hand."'] },
  { title: 'HARVEST CYCLE INITIATED', red: true, body: ['Every dead frequency', 'on Earth wakes', 'with three words.', '', 'The Forge stirs.'] },
  { title: 'END OF CHAPTER ONE', body: ['Earth was only', 'one link in the chain.', '', 'The hunt has just begun.'] },
];

export class ChapterOneOutro {
  private dim: Phaser.GameObjects.Rectangle;
  private frame: ScifiFrame;
  private pips: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private body: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private active = false;
  readonly count = SLIDES.length;

  constructor(scene: Phaser.Scene) {
    const D = 3200;
    this.dim = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x03060a, 0.92)
      .setDepth(D).setVisible(false);
    this.frame = new ScifiFrame(scene, D);
    this.frame.draw(BOX.x, BOX.y, BOX.w, BOX.h);
    this.pips = scene.add.graphics().setDepth(D + 1).setVisible(false);
    this.title = scene.add.text(CX, 0, '', { fontFamily: UI_FONT, fontSize: '18px', fontStyle: '700', color: BRASS, align: 'center' })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
    this.body = scene.add.text(CX, 0, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '400', color: TEXT, align: 'center', lineSpacing: 5 })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(CX, BASE_H - 18, '', { fontFamily: UI_FONT, fontSize: '8px', fontStyle: '700', color: DIM, align: 'center' })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
  }

  private layout(i: number): void {
    const s = SLIDES[i]!;
    const hasTitle = !!s.title;
    this.title.setText(s.title ?? '').setColor(s.red ? RED : BRASS).setVisible(hasTitle);
    this.body.setText(s.body.join('\n'));
    // vertically centre the title+body block as a group inside the box
    const bodyH = this.body.height;
    const titleH = hasTitle ? this.title.height + 14 : 0;
    const top = CY - (titleH + bodyH) / 2;
    if (hasTitle) { this.title.setY(top + this.title.height / 2); this.body.setY(top + titleH + bodyH / 2); }
    else this.body.setY(CY);
    // slide pips along the bottom
    const g = this.pips; g.clear();
    const n = SLIDES.length, px = CX - (n * 8) / 2;
    for (let k = 0; k < n; k++) g.fillStyle(k === i ? 0x2fd4d4 : 0x1b5a5e, 1).fillRect(px + k * 8, BASE_H - 12, 5, 2);
  }

  setSlide(i: number): void { if (this.active) this.layout(Math.max(0, Math.min(SLIDES.length - 1, i))); }

  show(slide: number): void {
    this.active = true;
    this.frame.show(false); // suppress the frame's own dim — our full-screen dim supplies the noir backing
    for (const o of [this.dim, this.pips, this.body, this.prompt]) o.setVisible(true);
    this.layout(slide);
  }

  step(frame: number, slide: number): void {
    if (!this.active) return;
    const last = slide >= SLIDES.length - 1;
    this.prompt.setText(blinkOn(frame) ? (last ? 'PRESS ATTACK' : 'PRESS ATTACK  ▸') : '');
  }

  hide(): void {
    if (!this.active) return;
    this.active = false;
    this.frame.hide();
    for (const o of [this.dim, this.pips, this.title, this.body, this.prompt]) o.setVisible(false);
  }
}

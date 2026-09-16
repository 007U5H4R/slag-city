// src/adapters/phaser/screens/Controls.ts
// Controls panel shown on the attract title screen so players can see the button map (modern UI font).
// Keyboard is the primary scheme; a gamepad also works (d-pad/stick move, South jump, West attack, Start).
import type Phaser from 'phaser';
import { BASE_W } from '@shell/scale';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';

const TEXT = '#cdbfa6', BRASS = '#b08d3c';
const LINES = [
  'MOVE   ARROWS / WASD',
  'ATTACK  J      JUMP  K      SPECIAL  L',
  'INSERT COIN  5        START  ENTER',
  'CRT  C        VOLUME  − / =',
];
const TOP = 118, LINE_H = 13;

export class Controls {
  private frame: ScifiFrame;
  private title: Phaser.GameObjects.Text;
  private lines: Phaser.GameObjects.Text[];
  private active = false;

  constructor(scene: Phaser.Scene) {
    const cx = BASE_W / 2;
    const h = LINE_H * LINES.length + 28;
    this.frame = new ScifiFrame(scene, 3049);
    this.frame.draw(cx - 168, TOP - 16, 336, h);
    this.title = scene.add.text(cx, TOP - 4, 'CONTROLS', { fontFamily: UI_FONT, fontSize: '11px', fontStyle: '700', color: BRASS })
      .setOrigin(0.5, 0.5).setDepth(3051).setScrollFactor(0).setResolution(4).setVisible(false);
    this.lines = LINES.map((t, i) =>
      scene.add.text(cx, TOP + 12 + i * LINE_H, t, { fontFamily: UI_FONT, fontSize: '9px', fontStyle: '500', color: TEXT })
        .setOrigin(0.5, 0.5).setDepth(3051).setScrollFactor(0).setResolution(4).setVisible(false));
  }

  show(): void {
    if (this.active) return;
    this.active = true;
    this.frame.show(false); this.title.setVisible(true); // no full-screen dim on the attract title
    for (const l of this.lines) l.setVisible(true);
  }

  hide(): void {
    if (!this.active) return;
    this.active = false;
    this.frame.hide(); this.title.setVisible(false);
    for (const l of this.lines) l.setVisible(false);
  }
}

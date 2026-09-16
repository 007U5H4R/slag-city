// src/adapters/phaser/screens/Controls.ts
// Controls panel shown on the attract title screen so players can see the button map (modern UI font).
// Keyboard is the primary scheme; a gamepad also works (d-pad/stick move, South jump, West attack, Start).
import type Phaser from 'phaser';
import { BASE_W } from '@shell/scale';
import { HUD_COLOURS } from '../views/hud-colours';
import { UI_FONT } from '../views/ui-font';

const TEXT = '#cdbfa6', BRASS = '#b08d3c';
const LINES = [
  'MOVE   ARROWS / WASD',
  'ATTACK  J      JUMP  K      SPECIAL  L',
  'INSERT COIN  5        START  ENTER',
  'CRT  C        VOLUME  − / =',
];
const TOP = 118, LINE_H = 13;

export class Controls {
  private bg: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.Text;
  private lines: Phaser.GameObjects.Text[];
  private active = false;

  constructor(scene: Phaser.Scene) {
    const cx = BASE_W / 2;
    const h = LINE_H * LINES.length + 26;
    this.bg = scene.add.rectangle(cx, TOP + h / 2 - 8, 320, h, HUD_COLOURS.plate, 0.66)
      .setStrokeStyle(1, HUD_COLOURS.brass, 0.7).setDepth(3050).setScrollFactor(0).setVisible(false);
    this.title = scene.add.text(cx, TOP - 4, 'CONTROLS', { fontFamily: UI_FONT, fontSize: '11px', fontStyle: '700', color: BRASS })
      .setOrigin(0.5, 0.5).setDepth(3051).setScrollFactor(0).setResolution(4).setVisible(false);
    this.lines = LINES.map((t, i) =>
      scene.add.text(cx, TOP + 12 + i * LINE_H, t, { fontFamily: UI_FONT, fontSize: '9px', fontStyle: '500', color: TEXT })
        .setOrigin(0.5, 0.5).setDepth(3051).setScrollFactor(0).setResolution(4).setVisible(false));
  }

  show(): void {
    if (this.active) return;
    this.active = true;
    this.bg.setVisible(true); this.title.setVisible(true);
    for (const l of this.lines) l.setVisible(true);
  }

  hide(): void {
    if (!this.active) return;
    this.active = false;
    this.bg.setVisible(false); this.title.setVisible(false);
    for (const l of this.lines) l.setVisible(false);
  }
}

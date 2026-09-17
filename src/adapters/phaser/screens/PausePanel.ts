// src/adapters/phaser/screens/PausePanel.ts
// The player's pause — and the only in-game help. Before this the game could only pause itself (hidden tab,
// unplugged pad, phone in portrait), and the button map existed solely on a ~5s attract segment, gone by the
// time anyone needed it. One panel answers "stop", "what are the buttons?" and "how do I change CRT/volume?".
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';
import { deviceCopy } from '../views/device-copy';
import { CONTROL_LINES } from './Controls';

const BRASS = '#d7a94a', TEXT = '#d8cbb0', DIM = '#b0a488';
const BOX = { w: 340, h: 136 };

export class PausePanel {
  private frame: ScifiFrame;
  private texts: Phaser.GameObjects.Text[] = [];
  private active = false;

  constructor(scene: Phaser.Scene) {
    const D = 4000, cx = BASE_W / 2, top = (BASE_H - BOX.h) / 2;
    const mobile = deviceCopy(scene).mobile;
    this.frame = new ScifiFrame(scene, D);
    this.frame.draw(cx - BOX.w / 2, top, BOX.w, BOX.h);
    const add = (y: number, t: string, size: number, weight: string, color: string): void => {
      this.texts.push(scene.add.text(cx, top + y, t, { fontFamily: UI_FONT, fontSize: `${size}px`, fontStyle: weight, color, align: 'center' })
        .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false));
    };
    add(20, 'PAUSED', 16, '700', BRASS);
    (mobile ? CONTROL_LINES.mobile : CONTROL_LINES.desktop).forEach((l, i) => add(46 + i * 14, l, 9, '500', TEXT));
    if (!mobile) add(94, 'CRT  C        VOLUME  − / =        FULLSCREEN  F', 9, '500', TEXT);
    add(BOX.h - 16, mobile ? 'TAP  ▶  TO RESUME' : 'P  /  ESC  /  ENTER   TO RESUME', 9, '700', DIM);
  }

  show(): void { if (this.active) return; this.active = true; this.frame.show(true); for (const t of this.texts) t.setVisible(true); }
  hide(): void { if (!this.active) return; this.active = false; this.frame.hide(); for (const t of this.texts) t.setVisible(false); }
}

// src/adapters/phaser/screens/Continue.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { blinkOn } from '@core/arcade/screen-machine';
import type { ArcadeState } from '@core/arcade/screen-machine';
import { HUD_COLOURS } from '../views/hud-colours';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';

const GOLD = '#f0c040', TEXT = '#cdbfa6';

// CONTINUE overlay: the frozen hero shows through a light dim while a sci-fi panel frames a per-second
// countdown. (The `continue_tick` audio cue is driven by the machine.)
export class Continue {
  private dim: Phaser.GameObjects.Rectangle;
  private frame: ScifiFrame;
  private title: Phaser.GameObjects.Text;
  private count: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private active = false;

  constructor(scene: Phaser.Scene) {
    const cx = BASE_W / 2, cy = BASE_H / 2;
    // keep a light dim so the frozen hero still reads behind the panel; suppress the frame's own heavier dim
    this.dim = scene.add.rectangle(cx, cy, BASE_W, BASE_H, HUD_COLOURS.plate, 0.55).setDepth(3000).setVisible(false);
    this.frame = new ScifiFrame(scene, 3001);
    this.frame.draw(cx - 96, cy - 46, 192, 92);
    this.title = scene.add.text(cx, cy - 30, 'CONTINUE?', { fontFamily: UI_FONT, fontSize: '11px', fontStyle: '700', color: TEXT })
      .setOrigin(0.5).setDepth(3003).setResolution(4).setVisible(false);
    this.count = scene.add.text(cx, cy - 2, '10', { fontFamily: UI_FONT, fontSize: '30px', fontStyle: '700', color: GOLD })
      .setOrigin(0.5).setDepth(3003).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(cx, cy + 30, 'INSERT COIN TO CONTINUE', { fontFamily: UI_FONT, fontSize: '9px', fontStyle: '500', color: TEXT })
      .setOrigin(0.5).setDepth(3003).setResolution(4).setVisible(false);
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.dim.setVisible(false); this.frame.hide();
    this.title.setVisible(false); this.count.setVisible(false); this.prompt.setVisible(false);
  }

  step(arcade: ArcadeState, _n: number): void {
    if (!this.active) return;
    this.dim.setVisible(true); this.frame.show(false); this.title.setVisible(true);
    const secs = Math.max(0, Math.ceil(arcade.continueFrames / 60));
    this.count.setText(String(secs)).setVisible(true);
    this.prompt.setVisible(blinkOn(arcade.screenFrame));
  }
}

// src/adapters/phaser/screens/GameOver.ts
// End-of-game card (modern UI font). Boss defeated -> "STAGE CLEAR!" + "CONGRATULATIONS!" and a lead-in to
// the name entry; death-out -> "GAME OVER". `stageClear` is set by the scene each frame from
// `world.stage.bossDefeated` before `step`. (Next stage is future work — a win routes to the scoreboard.)
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import type { ArcadeState } from '@core/arcade/screen-machine';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';

const GOLD = '#f0c040', RED = '#e0503a', TEXT = '#e8dcc0';

export class GameOver {
  stageClear = false;
  private frame: ScifiFrame;
  private title: Phaser.GameObjects.Text;
  private sub: Phaser.GameObjects.Text;
  private active = false;

  constructor(scene: Phaser.Scene) {
    const cx = BASE_W / 2, cy = BASE_H / 2;
    this.frame = new ScifiFrame(scene, 3000);
    this.frame.draw(cx - 150, cy - 40, 300, 80);
    this.title = scene.add.text(cx, cy - 12, 'GAME OVER', { fontFamily: UI_FONT, fontSize: '26px', fontStyle: '700', color: RED })
      .setOrigin(0.5, 0.5).setDepth(3002).setResolution(4).setVisible(false);
    this.sub = scene.add.text(cx, cy + 18, '', { fontFamily: UI_FONT, fontSize: '11px', fontStyle: '500', color: TEXT })
      .setOrigin(0.5, 0.5).setDepth(3002).setResolution(4).setVisible(false);
  }

  show(): void { this.active = true; }
  hide(): void { this.active = false; this.frame.hide(); this.title.setVisible(false); this.sub.setVisible(false); }

  step(_arcade: ArcadeState, _n: number): void {
    if (!this.active) return;
    this.frame.show(true);
    if (this.stageClear) {
      this.title.setText('STAGE CLEAR!').setColor(GOLD).setVisible(true);
      this.sub.setText('CONGRATULATIONS  —  ENTER YOUR NAME').setVisible(true);
    } else {
      this.title.setText('GAME OVER').setColor(RED).setVisible(true);
      this.sub.setVisible(false);
    }
  }
}

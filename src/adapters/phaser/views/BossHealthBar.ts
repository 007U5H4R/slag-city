// src/adapters/phaser/views/BossHealthBar.ts
// Boss-fight health bar: a sci-fi teal plate under the HUD showing the current boss's NAME and an HP bar
// (green→amber→red by remaining health), with a magenta frame in phase 2. Adapter-only; GameScene feeds it
// the live boss entity's hp/maxHp each frame while a boss is on screen. Matches Hud.ts + scifi-frame.ts.
import type Phaser from 'phaser';
import { healthBand } from '@core/arcade/hud';
import { HUD_COLOURS } from './hud-colours';
import { UI_FONT } from './ui-font';
import { BASE_W } from '@shell/scale';

const TEAL_PANEL = 0x06202a, CY = 0x2fd4d4, CY_HI = 0x8ff7f2, MAGENTA = 0xff3ea8;
const PANEL = { x: 52, y: 18, w: BASE_W - 104, h: 24 };            // centred plate under the 16-px HUD band
const BAR = { x: PANEL.x + 10, y: PANEL.y + 13, w: PANEL.w - 20, h: 7 };

export interface BossHealthModel { name: string; hp: number; maxHp: number; phase2: boolean }

export class BossHealthBar {
  private g: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(2100).setVisible(false);
    this.name = scene.add.text(BASE_W / 2, PANEL.y + 5, '', { fontFamily: UI_FONT, fontSize: '9px', fontStyle: '700', color: '#ff5c7e', stroke: '#02090c', strokeThickness: 3 })
      .setOrigin(0.5, 0.5).setDepth(2101).setResolution(4).setVisible(false);
  }

  setVisible(v: boolean): void { this.g.setVisible(v); this.name.setVisible(v); }

  render(m: BossHealthModel): void {
    const g = this.g; g.clear();
    const edge = m.phase2 ? MAGENTA : CY;
    // panel
    g.fillStyle(TEAL_PANEL, 0.9); g.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    g.lineStyle(6, edge, 0.10).strokeRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);   // soft glow
    g.lineStyle(2, edge, 0.9).strokeRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);     // border
    // corner brackets
    g.lineStyle(2, CY_HI, 1);
    g.lineBetween(PANEL.x, PANEL.y, PANEL.x + 12, PANEL.y); g.lineBetween(PANEL.x, PANEL.y, PANEL.x, PANEL.y + 10);
    g.lineBetween(PANEL.x + PANEL.w - 12, PANEL.y + PANEL.h, PANEL.x + PANEL.w, PANEL.y + PANEL.h);
    g.lineBetween(PANEL.x + PANEL.w, PANEL.y + PANEL.h - 10, PANEL.x + PANEL.w, PANEL.y + PANEL.h);
    // HP trough + fill (bar length is the primary cue, colour secondary)
    g.fillStyle(0x02090c, 0.9); g.fillRect(BAR.x - 1, BAR.y - 1, BAR.w + 2, BAR.h + 2);
    const band = healthBand(m.hp, m.maxHp);
    const col = band === 'green' ? HUD_COLOURS.healthGreen : band === 'amber' ? HUD_COLOURS.healthAmber : HUD_COLOURS.healthRed;
    const fill = Math.round(BAR.w * Math.max(0, Math.min(1, m.hp / Math.max(1, m.maxHp))));
    g.fillStyle(col, 1); g.fillRect(BAR.x, BAR.y, fill, BAR.h);
    for (let x = BAR.x + 16; x < BAR.x + fill; x += 16) { g.fillStyle(TEAL_PANEL, 1); g.fillRect(x, BAR.y, 1, BAR.h); } // segment ticks
    g.lineStyle(1, edge, 0.85); g.strokeRect(BAR.x - 1.5, BAR.y - 1.5, BAR.w + 3, BAR.h + 3);
    this.name.setText(m.name).setColor(m.phase2 ? '#ff8fc0' : '#ff5c7e');
  }
}

// src/adapters/phaser/views/Hud.ts
import Phaser from 'phaser';
import { formatScore, healthBand } from '@core/arcade/hud';
import { HUD_COLOURS } from './hud-colours';

export interface HudModel { hp: number; maxHp: number; score: number; credits: number; weapon: { kind: string; heat: number; max: number } | null; creditFlash: number }

// All positions on the 8-px grid inside the 16-px top band (Design §3.2).
const HEALTH = { x: 8, y: 4, w: 96, h: 8 };
const SCORE_X = 128, CREDITS_X = 296, TEXT_Y = 4;
const HEAT = { x: 8, y: 208, w: 64, h: 8 };

export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private score: Phaser.GameObjects.BitmapText;
  private credits: Phaser.GameObjects.BitmapText;
  constructor(private scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(2000).setScrollFactor(0);
    this.score = scene.add.bitmapText(SCORE_X, TEXT_Y, 'hud8', 'SCORE 000000').setDepth(2001).setTint(HUD_COLOURS.text);
    this.credits = scene.add.bitmapText(CREDITS_X, TEXT_Y, 'hud8', 'CREDIT 0').setDepth(2001).setTint(HUD_COLOURS.text);
  }
  render(m: HudModel): void {
    const g = this.g; g.clear();
    // plates: one shared style (dark plate + brass border) so the three elements read as one group (Design §3.2)
    const PLATES = [{ x: HEALTH.x - 4, w: HEALTH.w + 8 }, { x: SCORE_X - 4, w: 108 }, { x: CREDITS_X - 4, w: 76 }];
    for (const p of PLATES) {
      g.fillStyle(HUD_COLOURS.plate, 1); g.fillRect(p.x, 0, p.w, 16);
      g.lineStyle(1, HUD_COLOURS.brass, 1); g.strokeRect(p.x + 0.5, 0.5, p.w - 1, 15);
    }
    // health: bar length is the primary cue, colour secondary
    const band = healthBand(m.hp, m.maxHp);
    const col = band === 'green' ? HUD_COLOURS.healthGreen : band === 'amber' ? HUD_COLOURS.healthAmber : HUD_COLOURS.healthRed;
    const fill = Math.round((HEALTH.w - 4) * Math.max(0, m.hp) / m.maxHp);
    g.fillStyle(col, 1); g.fillRect(HEALTH.x + 4, HEALTH.y, fill, HEALTH.h);
    for (let x = HEALTH.x + 4 + 8; x < HEALTH.x + 4 + fill; x += 8) { g.fillStyle(HUD_COLOURS.plate, 1); g.fillRect(x, HEALTH.y, 1, HEALTH.h); } // segments
    this.score.setText(`SCORE ${formatScore(m.score)}`);
    this.credits.setText(`CREDIT ${m.credits}`);
    // coin-accepted pulse: 1.0 → 1.15 → 1.0 over 2 frames, hand-stepped
    this.credits.setScale(m.creditFlash === 2 ? 1.15 : 1);
    // weapon heat (ticket 11 fills the model; drawing lives here so the layout is fixed now)
    if (m.weapon) {
      g.fillStyle(HUD_COLOURS.plate, 1); g.fillRect(HEAT.x - 4, HEAT.y - 4, HEAT.w + 8, HEAT.h + 8);
      const seg = HEAT.w / m.weapon.max;
      for (let i = 0; i < m.weapon.heat; i++) {
        const t = i / Math.max(1, m.weapon.max - 1);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(HUD_COLOURS.heatCyan), Phaser.Display.Color.ValueToColor(HUD_COLOURS.heatWhite), 1, t);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
        g.fillRect(HEAT.x + i * seg, HEAT.y, Math.ceil(seg) - 1, HEAT.h);
      }
      if (m.weapon.heat === 1) { g.lineStyle(1, HUD_COLOURS.healthRed, 1); g.strokeRect(HEAT.x - 4.5, HEAT.y - 4.5, HEAT.w + 9, HEAT.h + 9); }
    }
  }
}

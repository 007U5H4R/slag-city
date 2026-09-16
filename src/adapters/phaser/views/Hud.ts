// src/adapters/phaser/views/Hud.ts
import Phaser from 'phaser';
import { formatScore, healthBand } from '@core/arcade/hud';
import { HUD_COLOURS } from './hud-colours';
import { UI_FONT } from './ui-font';
import { BASE_W } from '@shell/scale';

export interface HudModel { hp: number; maxHp: number; score: number; credits: number; weapon: { kind: string; heat: number; max: number } | null; creditFlash: number }

// All positions on the 8-px grid inside the 16-px top band (Design §3.2).
const HEALTH = { x: 8, y: 4, w: 96, h: 8 };
const SCORE_X = 126, CREDITS_X = 262; // CREDIT pulled in from the right so the CRT barrel doesn't clip it
const HEAT = { x: 8, y: 208, w: 64, h: 8 };
// Sci-fi teal palette (matches scifi-frame.ts) so the HUD bar and the panels read as one system.
const TEAL_PANEL = 0x06202a, TEAL_EDGE = 0x116b70, CY = 0x2fd4d4, CY_HI = 0x8ff7f2;

export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private score: Phaser.GameObjects.Text;
  private credits: Phaser.GameObjects.Text;
  constructor(private scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(2000);
    // Bright colour + heavy dark stroke + drop shadow so the readout stays legible over any busy parallax bg.
    const base = { fontFamily: UI_FONT, fontSize: '12px', fontStyle: '700', stroke: '#02090c', strokeThickness: 4 };
    this.score = scene.add.text(SCORE_X, 2, 'SCORE 000000', { ...base, color: '#ffd24a' }).setDepth(2001).setResolution(4);
    this.credits = scene.add.text(CREDITS_X, 2, 'CREDIT 0', { ...base, color: '#aef6f2' }).setDepth(2001).setResolution(4);
    for (const t of [this.score, this.credits]) t.setShadow(0, 1, '#000000', 3, true, true);
  }
  // Hidden outside PLAY/CONTINUE by the coin-op machine (ticket 18); re-shown a frame before the next render.
  setVisible(v: boolean): void { this.g.setVisible(v); this.score.setVisible(v); this.credits.setVisible(v); }

  render(m: HudModel): void {
    const g = this.g; g.clear();
    // one full-width teal bar so the readout reads as a single sci-fi HUD strip, not three loose plates
    g.fillStyle(TEAL_PANEL, 0.88); g.fillRect(0, 0, BASE_W, 16);
    g.lineStyle(1, TEAL_EDGE, 0.8); g.lineBetween(0, 1, BASE_W, 1);       // faint top rule
    g.lineStyle(2, CY, 0.9); g.lineBetween(0, 15, BASE_W, 15);            // bright cyan underline
    // corner brackets at each end (the sci-fi cue)
    g.lineStyle(2, CY_HI, 1);
    g.lineBetween(0, 0, 12, 0); g.lineBetween(0, 0, 0, 10);
    g.lineBetween(BASE_W - 12, 0, BASE_W, 0); g.lineBetween(BASE_W, 0, BASE_W, 10);
    // health: bar length is the primary cue, colour secondary; framed in cyan to match the bar
    const band = healthBand(m.hp, m.maxHp);
    const col = band === 'green' ? HUD_COLOURS.healthGreen : band === 'amber' ? HUD_COLOURS.healthAmber : HUD_COLOURS.healthRed;
    g.fillStyle(0x02090c, 0.9); g.fillRect(HEALTH.x - 1, HEALTH.y - 1, HEALTH.w + 2, HEALTH.h + 2); // dark trough
    const fill = Math.round((HEALTH.w - 4) * Math.max(0, m.hp) / m.maxHp);
    g.fillStyle(col, 1); g.fillRect(HEALTH.x + 2, HEALTH.y, fill, HEALTH.h);
    for (let x = HEALTH.x + 2 + 8; x < HEALTH.x + 2 + fill; x += 8) { g.fillStyle(TEAL_PANEL, 1); g.fillRect(x, HEALTH.y, 1, HEALTH.h); } // segments
    g.lineStyle(1, CY, 0.85); g.strokeRect(HEALTH.x - 1.5, HEALTH.y - 1.5, HEALTH.w + 3, HEALTH.h + 3);
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

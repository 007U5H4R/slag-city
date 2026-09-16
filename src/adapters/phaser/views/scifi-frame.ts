// src/adapters/phaser/views/scifi-frame.ts
// Futuristic HUD frame (teal, cut corners, cyan glow border, bright corner brackets + tick marks) — the
// dialogue/panel look from the reference art. Used as the backdrop for the controls, scoreboard, name-entry
// and game-over panels. Drawn procedurally so it scales crisply and needs no image asset.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';

const CY = 0x2fd4d4, CY_HI = 0x8ff7f2, PANEL = 0x08222a, EDGE = 0x116b70;

export class ScifiFrame {
  private dim: Phaser.GameObjects.Rectangle;
  private g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, depth: number) {
    this.dim = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x02080a, 0.82)
      .setDepth(depth).setVisible(false);
    this.g = scene.add.graphics().setDepth(depth + 1).setVisible(false);
  }

  // Draw the framed panel once (geometry is static per screen).
  draw(x: number, y: number, w: number, h: number): void {
    const g = this.g; g.clear();
    const c = 12;
    const p = [
      { x: x + c, y }, { x: x + w - c, y }, { x: x + w, y: y + c }, { x: x + w, y: y + h - c },
      { x: x + w - c, y: y + h }, { x: x + c, y: y + h }, { x, y: y + h - c }, { x, y: y + c },
    ];
    g.fillStyle(PANEL, 0.94).fillPoints(p, true);
    g.lineStyle(1, EDGE, 0.9).strokeRect(x + 4, y + 4, w - 8, h - 8);   // inner accent line
    g.lineStyle(2, CY, 0.9).strokePoints(p, true);                       // cyan border
    // bright corner brackets
    g.lineStyle(2, CY_HI, 1);
    const b = 16;
    g.lineBetween(x + c, y, x + c + b, y); g.lineBetween(x, y + c, x, y + c + b);
    g.lineBetween(x + w - c - b, y, x + w - c, y); g.lineBetween(x + w, y + c, x + w, y + c + b);
    g.lineBetween(x + c, y + h, x + c + b, y + h); g.lineBetween(x, y + h - c - b, x, y + h - c);
    g.lineBetween(x + w - c - b, y + h, x + w - c, y + h); g.lineBetween(x + w, y + h - c - b, x + w, y + h - c);
    // tick-mark accent (top-left) like the reference tabs
    g.lineStyle(2, CY, 0.85);
    for (let i = 0; i < 4; i++) { const tx = x + 22 + i * 6; g.lineBetween(tx, y + 6, tx + 3, y + 6); }
    // corner nodes
    g.fillStyle(CY_HI, 1);
    for (const q of [{ x: x + c, y }, { x: x + w - c, y }, { x, y: y + h - c }, { x: x + w, y: y + h - c }]) g.fillCircle(q.x, q.y, 1.5);
  }

  show(withDim = true): void { this.dim.setVisible(withDim); this.g.setVisible(true); }
  hide(): void { this.dim.setVisible(false); this.g.setVisible(false); }
}

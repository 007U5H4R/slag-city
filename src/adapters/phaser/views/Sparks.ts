// src/adapters/phaser/views/Sparks.ts
import type Phaser from 'phaser';
import { HUD_COLOURS } from './hud-colours';
const LIFE = 18;
export class Sparks {
  private parts: Array<{ r: Phaser.GameObjects.Rectangle; vx: number; vy: number; age: number; wx: number; wy: number }> = [];
  constructor(private scene: Phaser.Scene) {}
  burst(wx: number, wy: number): void {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      this.parts.push({ r: this.scene.add.rectangle(0, 0, 2, 2, HUD_COLOURS.gold).setDepth(1600), vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 1.5, age: 0, wx, wy });
    }
  }
  step(n: number, cameraX: number): void {
    for (const p of this.parts) for (let i = 0; i < n; i++) { p.age++; p.wx += p.vx; p.vy += 0.15; p.wy += p.vy; }
    for (const p of this.parts) p.r.setPosition(Math.round(p.wx - cameraX), Math.round(p.wy));
    this.parts = this.parts.filter((p) => { if (p.age >= LIFE) { p.r.destroy(); return false; } return true; });
  }
}

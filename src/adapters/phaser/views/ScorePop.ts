// src/adapters/phaser/views/ScorePop.ts
import type Phaser from 'phaser';
import { HUD_COLOURS } from './hud-colours';
const LIFE = 40;
export class ScorePops {
  private pops: Array<{ t: Phaser.GameObjects.BitmapText; age: number; wx: number; wy: number }> = [];
  constructor(private scene: Phaser.Scene) {}
  spawn(amount: number, wx: number, wy: number): void {
    const t = this.scene.add.bitmapText(0, 0, 'hud8', String(amount)).setOrigin(0.5, 1).setDepth(1500).setTint(HUD_COLOURS.gold);
    this.pops.push({ t, age: 0, wx, wy });
  }
  /** Advance by n sim ticks and reposition against the camera. */
  step(n: number, cameraX: number): void {
    for (const p of this.pops) { p.age += n; p.t.setPosition(Math.round(p.wx - cameraX), Math.round(p.wy - p.age)); }
    this.pops = this.pops.filter((p) => { if (p.age >= LIFE) { p.t.destroy(); return false; } return true; });
  }
}

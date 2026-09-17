// src/adapters/phaser/views/LaserCurtain.ts
// Cosmetic cyan laser-curtain set-pieces (the robot-cell "light plane" from the reference): vertical scanning
// beams at fixed world-x points across the stage. Purely decorative — the hero passes through them (drawn
// behind the entities). Frame-stepped by the sim clock so it stays deterministic-friendly.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';

const CURTAIN_X = [560, 1240, 2000, 2760]; // world-x anchors; only on-screen ones are drawn
const TOP = 22, BOT = BASE_H - 6;

export class LaserCurtain {
  private g: Phaser.GameObjects.Graphics;
  // depth -20 keeps it a background light-plane, clearly behind the entities (hero/enemies render at depth ≈ pos.y ≥ 0)
  constructor(scene: Phaser.Scene, depth = -20) { this.g = scene.add.graphics().setDepth(depth); }

  draw(cameraX: number, frame: number): void {
    const g = this.g; g.clear();
    for (const wx of CURTAIN_X) {
      const sx = Math.round(wx - cameraX);
      if (sx < -6 || sx > BASE_W + 6) continue;
      const flick = 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.28 + wx * 0.7));
      // toned down so it reads as a background scanning-light plane the hero clearly stands in front of
      g.fillStyle(0x2fd4d4, 0.10 * flick).fillRect(sx - 4, TOP, 9, BOT - TOP);   // wide glow
      g.fillStyle(0x39d6d6, 0.24 * flick).fillRect(sx - 1, TOP, 3, BOT - TOP);   // beam
      g.fillStyle(0xbafcf7, 0.42 * flick).fillRect(sx, TOP, 1, BOT - TOP);       // core
      g.fillStyle(0x9ff5ff, 0.5 * flick).fillRect(sx - 3, TOP - 3, 7, 4).fillRect(sx - 3, BOT - 1, 7, 4); // emitters
      const sy = TOP + ((frame * 3 + wx) % (BOT - TOP));                          // scanning pulse
      g.fillStyle(0xffffff, 0.4 * flick).fillRect(sx - 2, Math.round(sy), 5, 3);
    }
  }
}

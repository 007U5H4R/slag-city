// src/adapters/phaser/views/HazardView.ts
import type Phaser from 'phaser';
import type { WorldState } from '@core/sim/state';
import { ladlePhase } from '@core/stage/hazards';
import type { Hazard } from '@core/stage/stage1';

// Placeholder hazard visuals from STAGE1 data (real art is ticket 17). Everything is frame-stepped by the
// sim (`world.frame`, `world.camera.x`) — nothing is timed by wall clock — so the visuals stay in lockstep
// with the deterministic hazard logic in `src/core/stage/hazards.ts`.
export class HazardView {
  private g: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, private hazards: Hazard[], depth = -50) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  draw(world: WorldState): void {
    const g = this.g;
    g.clear();
    const cx = world.camera.x;
    for (const h of this.hazards) {
      if (h.type === 'belt') {
        const w = h.x2 - h.x1, hgt = h.y2 - h.y1;
        g.fillStyle(0x2b2b33, 1).fillRect(Math.round(h.x1 - cx), h.y1, w, hgt);
        // chevrons scroll at `push` px/frame to show the belt direction
        g.fillStyle(0x555560, 1);
        const dir = Math.sign(h.push) || 1;
        const scroll = ((world.frame * Math.abs(h.push)) % 16 + 16) % 16;
        for (let x = h.x1; x < h.x2; x += 16) {
          const sx = x - cx + dir * scroll;
          g.fillRect(Math.round(sx), h.y1, 8, hgt);
        }
      } else if (h.type === 'channel') {
        const w = h.x2 - h.x1, hgt = h.y2 - h.y1;
        const pulse = 0.6 + 0.4 * Math.sin(world.frame * 0.2);
        g.fillStyle(0xff6a00, pulse).fillRect(Math.round(h.x1 - cx), h.y1, w, hgt);
      } else if (h.type === 'ladle') {
        const left = Math.round(h.x - h.w / 2 - cx);
        g.fillStyle(0x777788, 1).fillRect(left, 40, h.w, 4); // the pour bracket
        const phase = ladlePhase(h, world.frame);
        if (phase === 'tell') {
          const p = (world.frame % h.period) / h.tellFrames; // 0..1 growing tell bar
          g.fillStyle(0xffcc33, 1).fillRect(left, 44, Math.round(h.w * p), 4);
        } else if (phase === 'pour') {
          g.fillStyle(0xff5a00, 0.85).fillRect(left, 44, h.w, 180); // the molten pour column
        }
      }
    }
  }
}

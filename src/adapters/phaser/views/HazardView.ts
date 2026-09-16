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
        const x0 = Math.round(h.x1 - cx), y0 = h.y1;
        g.fillStyle(0x162030, 1).fillRect(x0, y0, w, hgt);                   // dark blue-steel bed
        // two-tone tread slats scrolling in the push direction (reads as a moving belt)
        const dir = Math.sign(h.push) || 1;
        const period = 14;
        const scroll = ((world.frame * Math.max(1, Math.abs(h.push) * 2)) % period + period) % period;
        for (let x = h.x1 - period; x < h.x2 + period; x += period) {
          const sx = Math.round(x - cx + dir * scroll);
          if (sx + 7 < x0 || sx > x0 + w) continue;                          // skip slats fully off the belt
          g.fillStyle(0x24384e, 1).fillRect(sx, y0 + 3, 7, hgt - 6);
          g.fillStyle(0x35526e, 1).fillRect(sx, y0 + 3, 2, hgt - 6);         // slat highlight
        }
        // blue LED light strips along both rails + a bright pulsing centre line (reference: lit conveyor)
        const pulse = 0.7 + 0.3 * Math.sin(world.frame * 0.25);
        g.fillStyle(0x0a2c5a, 1).fillRect(x0, y0, w, 3).fillRect(x0, y0 + hgt - 3, w, 3); // rail housing
        g.fillStyle(0x37b7ff, pulse).fillRect(x0, y0 + 1, w, 1).fillRect(x0, y0 + hgt - 2, w, 1); // LEDs
        g.fillStyle(0x8fdcff, 0.35 * pulse).fillRect(x0, y0 + Math.round(hgt / 2) - 1, w, 2);     // centre glow
        g.fillStyle(0x4a6a8a, 1).fillRect(x0, y0, 3, hgt).fillRect(x0 + w - 3, y0, 3, hgt);       // end rollers
      } else if (h.type === 'channel') {
        const w = h.x2 - h.x1, hgt = h.y2 - h.y1;
        const x0 = Math.round(h.x1 - cx), y0 = h.y1;
        g.fillStyle(0x1a1512, 1).fillRect(x0 - 2, y0 - 2, w + 4, hgt + 4);   // steel trough rim
        g.fillStyle(0xff6a00, 0.78 + 0.22 * Math.sin(world.frame * 0.3)).fillRect(x0, y0, w, hgt); // molten flicker
        const core = y0 + Math.round(hgt * 0.32), coreH = Math.max(2, Math.round(hgt * 0.34));
        g.fillStyle(0xffd23e, 0.5 + 0.3 * Math.sin(world.frame * 0.4 + 1)).fillRect(x0, core, w, coreH); // bright core
        g.fillStyle(0xffe58a, 0.5).fillRect(x0, y0, w, 1);                   // emissive top rim
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

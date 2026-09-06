import type Phaser from 'phaser';
import type { WorldState } from '@core/sim/state';
import { activeMove } from '@core/combat/resolve';
import { dataFor } from '@core/combat/frame-data';
import { worldRect } from '@core/combat/hit';
import { isBody } from '@core/sim/entity';

export class DebugOverlay {
  private g: Phaser.GameObjects.Graphics;
  on = false;
  constructor(scene: Phaser.Scene) { this.g = scene.add.graphics().setDepth(900); }
  toggle(): void { this.on = !this.on; this.g.clear(); }
  draw(state: WorldState): void {
    if (!this.on) return;
    this.g.clear();
    for (const e of state.entities) {
      if (!isBody(e)) continue;
      const hb = worldRect(e, dataFor(e.kind).hurtbox);
      this.g.lineStyle(1, 0x00ff00, 1);
      this.g.strokeRect(hb.x1 - state.camera.x, e.pos.y - hb.z2, hb.x2 - hb.x1, hb.z2 - hb.z1);
      const m = activeMove(e);
      if (m) {
        const r = worldRect(e, m.hitbox);
        this.g.lineStyle(1, 0xff0000, 1);
        this.g.strokeRect(r.x1 - state.camera.x, e.pos.y - r.z2, r.x2 - r.x1, r.z2 - r.z1);
      }
    }
  }
}

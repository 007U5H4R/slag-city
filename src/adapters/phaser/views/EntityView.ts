// src/adapters/phaser/views/EntityView.ts
import type Phaser from 'phaser';
import type { Entity, EntityKind } from '@core/sim/entity';
import type { WorldState } from '@core/sim/state';
import { VARIANT_TINT } from './anim-table';

export const BOX_SIZE: Record<EntityKind, { w: number; h: number; color: number }> = {
  hero: { w: 20, h: 56, color: 0x4fc3f7 },
  brawler: { w: 22, h: 56, color: 0xef5350 },
  knife: { w: 16, h: 52, color: 0xffa726 },
  heavy: { w: 30, h: 60, color: 0xab47bc },
  feral: { w: 40, h: 28, color: 0x66bb6a },
  boss: { w: 48, h: 120, color: 0xd81b60 },
  crate: { w: 24, h: 24, color: 0x8d6e63 },
  pickup: { w: 12, h: 12, color: 0xffd54f },
  weaponPickup: { w: 20, h: 10, color: 0x80deea },
  projectile: { w: 8, h: 8, color: 0xff7043 },
};

export class EntityViews {
  private views = new Map<number, Phaser.GameObjects.Rectangle>();
  constructor(private scene: Phaser.Scene, private layer: Phaser.GameObjects.Layer) {}

  sync(state: WorldState): void {
    const alive = new Set<number>();
    for (const e of state.entities) {
      alive.add(e.id);
      let v = this.views.get(e.id);
      if (!v) {
        const s = BOX_SIZE[e.kind];
        v = this.scene.add.rectangle(0, 0, s.w, s.h, s.color).setOrigin(0.5, 1);
        this.layer.add(v);
        this.views.set(e.id, v);
      }
      this.place(v, e, state);
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { v.destroy(); this.views.delete(id); }
    this.layer.sort('depth'); // depth set to pos.y below → draw order = y sort
  }

  private place(v: Phaser.GameObjects.Rectangle, e: Entity, state: WorldState): void {
    v.setPosition(Math.round(e.pos.x - state.camera.x), Math.round(e.pos.y - e.pos.z));
    v.setDepth(e.pos.y);
    v.setScale(e.facing, 1);
    v.setFillStyle(e.flashFrames > 0 ? 0xffffff : BOX_SIZE[e.kind].color, e.invulnFrames > 0 && state.frame % 4 < 2 ? 0.4 : 1);
    v.setStrokeStyle(2, VARIANT_TINT[e.variant] ?? 0xffffff);
  }
}

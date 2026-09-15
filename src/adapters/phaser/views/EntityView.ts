// src/adapters/phaser/views/EntityView.ts
import Phaser from 'phaser';
import { isBody } from '@core/sim/entity';
import type { Entity, EntityKind } from '@core/sim/entity';
import type { WorldState } from '@core/sim/state';
import { dataFor, moveTotal } from '@core/combat/frame-data';
import { animFor, frameIndexFor, VARIANT_TINT } from './anim-table';

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
  private views = new Map<number, Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite>();
  private frameNames = new Map<string, string[]>();
  constructor(private scene: Phaser.Scene, private layer: Phaser.GameObjects.Layer) {}

  // Drop every cached view. Called when the rendered world is swapped (attract demo <-> play) so a reused
  // entity id from the new world never inherits the previous world's box/sprite of a different kind.
  reset(): void {
    for (const v of this.views.values()) v.destroy();
    this.views.clear();
  }

  // Whether an entity currently has a visible view (the e2e smoke hook reads this for the hero).
  has(id: number): boolean { const v = this.views.get(id); return !!v && v.visible; }

  sync(state: WorldState): void {
    const alive = new Set<number>();
    for (const e of state.entities) {
      alive.add(e.id);
      let v = this.views.get(e.id);
      if (!v) {
        const spec = animFor(e);
        if (spec && this.scene.textures.exists(spec.atlas)) {
          v = this.scene.add.sprite(0, 0, spec.atlas).setOrigin(0.5, 1);
        } else {
          const s = BOX_SIZE[e.kind];
          v = this.scene.add.rectangle(0, 0, s.w, s.h, s.color).setOrigin(0.5, 1);
        }
        this.layer.add(v);
        this.views.set(e.id, v);
      }
      this.place(v, e, state);
    }
    for (const [id, v] of this.views) if (!alive.has(id)) { v.destroy(); this.views.delete(id); }
    this.layer.sort('depth'); // depth set to pos.y below → draw order = y sort
  }

  private place(v: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite, e: Entity, state: WorldState): void {
    v.setPosition(Math.round(e.pos.x - state.camera.x), Math.round(e.pos.y - e.pos.z));
    v.setDepth(e.pos.y);
    if (v instanceof Phaser.GameObjects.Sprite) {
      const spec = animFor(e);
      if (!spec) return;
      const key = `${spec.atlas}/${spec.action}`;
      let names = this.frameNames.get(key);
      if (!names) {
        const tex = this.scene.textures.get(spec.atlas);
        names = tex.getFrameNames().filter((n) => n.startsWith(`${key}/`));
        this.frameNames.set(key, names);
      }
      // GUARD: only set a frame when this action actually has frames in the atlas.
      // An action with no frames (e.g. attack* before the attack sheet exists) leaves the
      // current frame in place — never call setFrame on a non-existent name (Phaser warns/errors).
      if (names.length > 0) {
        const move = isBody(e) ? dataFor(e.kind).moves[e.state] : undefined;
        const i = frameIndexFor(e, names.length, spec, move ? moveTotal(move) : undefined);
        v.setFrame(`${key}/${i}`);
        v.setFlipX(e.facing === -1);
        // Flash = solid white silhouette (hit feedback); otherwise apply the palette-swap variant tint
        // (VARIANT_TINT[0] = 0xffffff = neutral, so variant-0 entities and the hero are untinted).
        if (e.flashFrames > 0) v.setTintFill(0xffffff);
        else v.setTint(VARIANT_TINT[e.variant] ?? 0xffffff);
        v.setAlpha(e.invulnFrames > 0 && state.frame % 4 < 2 ? 0.4 : 1);
      }
      return;
    }
    v.setScale(e.facing, 1);
    v.setFillStyle(e.flashFrames > 0 ? 0xffffff : BOX_SIZE[e.kind].color, e.invulnFrames > 0 && state.frame % 4 < 2 ? 0.4 : 1);
    // Phase-2 boss (e.tint) gets an emissive magenta stroke (reserve slot #ff3ea8) until the ticket-16
    // recolor atlas lands; every other box keeps its variant stroke.
    v.setStrokeStyle(2, e.tint ? 0xff3ea8 : (VARIANT_TINT[e.variant] ?? 0xffffff));
  }
}

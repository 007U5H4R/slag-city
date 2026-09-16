// src/adapters/phaser/views/Parallax.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { WALK_BAND } from '@core/sim/state';

// Three scrolling parallax layers per section (sky/mid/ground) once the art (ticket 04/17) is loaded, with a
// per-section flat-tint fallback for any section whose textures are not present yet. The Phaser camera is
// static (GameScene draws the world in screen space with a manual camera offset), so each layer scrolls via
// tilePositionX = cameraX * ratio rather than via scrollFactor.
const SECTION_KEYS = ['s1', 's2', 's3'] as const;
const RATIOS = { sky: 0.15, mid: 0.5, ground: 1 } as const;

// Flat-tint fallback (pre-art look): distinct per-section colours so scroll-lock section changes read.
const SECTIONS = [
  { sky: 0x181420, wall: 0x241d2e, floor: 0x120f18 }, // s1 Foundry Gates — dark slate
  { sky: 0x14202a, wall: 0x1d2e3a, floor: 0x0f171e }, // s2 Conveyor Floor — industrial blue-grey
  { sky: 0x2a1410, wall: 0x3a1d16, floor: 0x1e0f0b }, // s3 Furnace Hall — molten red
] as const;

const STRUT_SPACING = 96;
const HORIZON = WALK_BAND.minY;

export class Parallax {
  private g: Phaser.GameObjects.Graphics;
  private sky?: Phaser.GameObjects.TileSprite;
  private mid?: Phaser.GameObjects.TileSprite;
  private ground?: Phaser.GameObjects.TileSprite;
  private curKey = '';

  constructor(private scene: Phaser.Scene, depth = -100) {
    this.g = scene.add.graphics().setDepth(depth);
    // Create the tile layers only if at least section 1's art is loaded (else stay on the flat fallback).
    if (scene.textures.exists('s1-sky')) {
      this.sky = scene.add.tileSprite(0, 0, BASE_W, HORIZON, 's1-sky').setOrigin(0, 0).setDepth(depth - 2).setVisible(false);
      this.mid = scene.add.tileSprite(0, 0, BASE_W, HORIZON, 's1-mid').setOrigin(0, 0).setDepth(depth - 1).setVisible(false);
      this.ground = scene.add.tileSprite(0, HORIZON, BASE_W, BASE_H - HORIZON, 's1-ground').setOrigin(0, 0).setDepth(depth).setVisible(false);
    }
  }

  sync(cameraX: number, sectionIndex: number, atPit = false): void {
    const key = atPit ? 'pit' : (SECTION_KEYS[sectionIndex] ?? 's1');
    const hasArt = !!this.sky && this.scene.textures.exists(`${key}-sky`);
    if (hasArt && this.sky && this.mid && this.ground) {
      this.g.clear();
      if (key !== this.curKey) {
        this.sky.setTexture(`${key}-sky`); this.mid.setTexture(`${key}-mid`); this.ground.setTexture(`${key}-ground`);
        this.curKey = key;
      }
      this.sky.setVisible(true).tilePositionX = Math.round(cameraX * RATIOS.sky);
      this.mid.setVisible(true).tilePositionX = Math.round(cameraX * RATIOS.mid);
      this.ground.setVisible(true).tilePositionX = Math.round(cameraX * RATIOS.ground);
      return;
    }
    // Flat-tint fallback (no art for this section yet).
    this.sky?.setVisible(false); this.mid?.setVisible(false); this.ground?.setVisible(false);
    const c = SECTIONS[sectionIndex] ?? SECTIONS[0];
    const g = this.g;
    g.clear();
    g.fillStyle(c.sky, 1).fillRect(0, 0, BASE_W, HORIZON);
    g.fillStyle(c.floor, 1).fillRect(0, HORIZON, BASE_W, BASE_H - HORIZON);
    g.fillStyle(c.wall, 1);
    const off = ((cameraX * 0.5) % STRUT_SPACING + STRUT_SPACING) % STRUT_SPACING;
    for (let x = -off; x < BASE_W; x += STRUT_SPACING) g.fillRect(Math.round(x), 0, 6, HORIZON);
  }
}

// src/adapters/phaser/views/Parallax.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { WALK_BAND } from '@core/sim/state';

// Placeholder section backgrounds until the real parallax art lands (ticket 04/17). Each section gets a
// distinct tint so scroll-lock section changes are visible, and faint wall struts scroll with the camera
// (parallax 0.5×) so the world reads as moving. No `${bg}-sky` textures exist yet, so this always draws
// the flat-rect fallback the plan (§14.4 Step 1) specifies. Colours are inlined here — there is no runtime
// palette with the plan's "industrial"/"molten" slots (that was the art-tool palette concept).
const SECTIONS = [
  { sky: 0x181420, wall: 0x241d2e, floor: 0x120f18 }, // s1 Foundry Gates — dark slate
  { sky: 0x14202a, wall: 0x1d2e3a, floor: 0x0f171e }, // s2 Conveyor Floor — industrial blue-grey
  { sky: 0x2a1410, wall: 0x3a1d16, floor: 0x1e0f0b }, // s3 Furnace Hall — molten red
] as const;

const STRUT_SPACING = 96;
const HORIZON = WALK_BAND.minY;

export class Parallax {
  private g: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene, depth = -100) {
    this.g = scene.add.graphics().setDepth(depth);
  }

  sync(cameraX: number, sectionIndex: number): void {
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

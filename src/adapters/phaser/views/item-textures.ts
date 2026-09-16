// src/adapters/phaser/views/item-textures.ts
// Procedural textures for the small pickups/projectiles that used to render as flat rectangles: the dropped
// weapons (laser cannon, flame blade) and the projectiles (hero laser bolt, boss molten glob). Drawn once at
// boot via a Graphics -> generateTexture so they read as real objects with glow; EntityView renders Images.
import type Phaser from 'phaser';

export function ensureItemTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const gen = (key: string, w: number, h: number, draw: () => void): void => {
    if (scene.textures.exists(key)) return;
    g.clear(); draw(); g.generateTexture(key, w, h);
  };

  // Dropped LASER CANNON pickup (22x12): steel body + cyan muzzle emitter with glow.
  gen('wpn-cannon', 22, 12, () => {
    g.fillStyle(0x40d0e0, 0.35).fillCircle(18, 6, 5);          // muzzle glow
    g.fillStyle(0x2a2f3a, 1).fillRoundedRect(0, 3, 16, 7, 2);  // body
    g.fillStyle(0x4a5568, 1).fillRect(2, 4, 11, 2);            // top highlight
    g.fillStyle(0x1b1f27, 1).fillRect(4, 9, 4, 3);             // grip
    g.fillStyle(0x9fe8ff, 1).fillRect(14, 4, 5, 4);            // emitter
    g.fillStyle(0xffffff, 1).fillRect(17, 5, 2, 2);            // hot tip
  });

  // Dropped FLAME BLADE pickup (22x14): steel blade with a fire overlay + hot core.
  gen('wpn-blade', 22, 14, () => {
    g.fillStyle(0xff7a3e, 0.3).fillCircle(13, 7, 7);           // heat haze
    g.fillStyle(0x3a2a20, 1).fillRect(1, 8, 8, 3);            // handle
    g.fillStyle(0x2a1c14, 1).fillRect(1, 8, 3, 3);            // pommel
    g.fillStyle(0xc0c4cc, 1).fillTriangle(8, 4, 21, 7, 8, 11); // steel blade
    g.fillStyle(0xff7a3e, 0.9).fillTriangle(9, 5, 18, 7, 9, 10); // flame
    g.fillStyle(0xffd23e, 0.95).fillTriangle(9, 6, 15, 7, 9, 9);  // hot core
  });

  // Hero LASER BOLT (16x6): white core in a cyan capsule with glow.
  gen('proj-cannon', 16, 6, () => {
    g.fillStyle(0x40d0e0, 0.5).fillRoundedRect(0, 0, 16, 6, 3);  // glow
    g.fillStyle(0x9fe8ff, 1).fillRoundedRect(2, 1, 12, 4, 2);    // bolt
    g.fillStyle(0xffffff, 1).fillRect(3, 2, 9, 2);              // core
  });

  // Boss MOLTEN GLOB (12x12): orange blob with a hot yellow core + glow.
  gen('proj-glob', 12, 12, () => {
    g.fillStyle(0xff7a3e, 0.5).fillCircle(6, 6, 6);            // glow
    g.fillStyle(0xff6a00, 1).fillCircle(6, 6, 4);             // molten
    g.fillStyle(0xffd23e, 1).fillCircle(5, 5, 2);             // hot core
  });

  g.destroy();
}

// src/adapters/phaser/views/fonts.ts
import Phaser from 'phaser';
export const RETRO_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function installFonts(scene: Phaser.Scene): void {
  for (const [key, size] of [['hud8', 8], ['display16', 16]] as const) {
    if (scene.cache.bitmapFont.exists(key)) continue;
    scene.cache.bitmapFont.add(key, Phaser.GameObjects.RetroFont.Parse(scene, {
      image: key, width: size, height: size, chars: RETRO_CHARS, charsPerRow: 16, 'offset.x': 0, 'offset.y': 0, 'spacing.x': 0, 'spacing.y': 0, lineSpacing: 0,
    }));
  }
}

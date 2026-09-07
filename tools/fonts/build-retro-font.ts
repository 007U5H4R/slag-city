// tools/fonts/build-retro-font.ts — run: npm run fonts:build
import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';

export const RETRO_CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CELL = 8, PER_ROW = 16;

function build(): void {
  GlobalFonts.registerFromPath('assets/sources/fonts/PressStart2P-Regular.ttf', 'PressStart2P');
  const rows = Math.ceil(RETRO_CHARS.length / PER_ROW);
  const canvas = createCanvas(CELL * PER_ROW, CELL * rows);
  const ctx = canvas.getContext('2d');
  ctx.font = `${CELL}px PressStart2P`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < RETRO_CHARS.length; i++) {
    ctx.fillText(RETRO_CHARS[i] as string, (i % PER_ROW) * CELL, Math.floor(i / PER_ROW) * CELL);
  }
  // 1-bit threshold: opaque white where alpha>=128, else transparent
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const on = (d[i + 3] as number) >= 128;
    d[i] = d[i + 1] = d[i + 2] = 255;
    d[i + 3] = on ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  mkdirSync('public/assets/fonts', { recursive: true });
  writeFileSync('public/assets/fonts/hud8.png', canvas.toBuffer('image/png'));
  // display16 = 2x nearest-neighbour (no sharp; smoothing off)
  const big = createCanvas(canvas.width * 2, canvas.height * 2);
  const bctx = big.getContext('2d');
  bctx.imageSmoothingEnabled = false;
  bctx.drawImage(canvas, 0, 0, big.width, big.height);
  writeFileSync('public/assets/fonts/display16.png', big.toBuffer('image/png'));
  console.log(`fonts: ${RETRO_CHARS.length} glyphs, ${canvas.width}x${canvas.height} (hud8) and 2x (display16)`);
}
build();

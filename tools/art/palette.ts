// tools/art/palette.ts
import { readFileSync } from 'node:fs';

export type RGB = [number, number, number];
export interface PaletteFile { name: string; groups: Array<{ name: string; slots: number[] }>; colours: string[] }

export function nearest(palette: RGB[], r: number, g: number, b: number): number {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const p = palette[i] as RGB;
    const d = (p[0] - r) ** 2 + (p[1] - g) ** 2 + (p[2] - b) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

export function quantise(rgba: Uint8Array, palette: RGB[], alphaThreshold = 128): Uint8Array {
  const out = new Uint8Array(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const a = rgba[i + 3] as number;
    if (a < alphaThreshold) { out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; out[i + 3] = 0; continue; }
    const p = palette[nearest(palette, rgba[i] as number, rgba[i + 1] as number, rgba[i + 2] as number)] as RGB;
    out[i] = p[0]; out[i + 1] = p[1]; out[i + 2] = p[2]; out[i + 3] = 255;
  }
  return out;
}

/** Median cut over opaque pixels. Returns `count` colours (fewer only if the image has fewer distinct colours). */
export function buildPalette(rgba: Uint8Array, count: number): RGB[] {
  const pts: RGB[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < rgba.length; i += 4) {
    if ((rgba[i + 3] as number) < 128) continue;
    const key = ((rgba[i] as number) << 16) | ((rgba[i + 1] as number) << 8) | (rgba[i + 2] as number);
    if (seen.has(key)) continue;
    seen.add(key);
    pts.push([rgba[i] as number, rgba[i + 1] as number, rgba[i + 2] as number]);
  }
  if (pts.length <= count) return pts;
  const boxes: RGB[][] = [pts];
  while (boxes.length < count) {
    boxes.sort((a, b) => spread(b) - spread(a));
    const box = boxes.shift() as RGB[];
    if (box.length < 2) { boxes.push(box); break; }
    const ch = widestChannel(box);
    box.sort((a, b) => a[ch] - b[ch]);
    const mid = box.length >> 1;
    boxes.push(box.slice(0, mid), box.slice(mid));
  }
  return boxes.map((box) => {
    const s = box.reduce<RGB>((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
    return [Math.round(s[0] / box.length), Math.round(s[1] / box.length), Math.round(s[2] / box.length)];
  });
}
function widestChannel(box: RGB[]): 0 | 1 | 2 {
  const r = range(box, 0), g = range(box, 1), b = range(box, 2);
  return r >= g && r >= b ? 0 : g >= b ? 1 : 2;
}
function range(box: RGB[], ch: 0 | 1 | 2): number {
  let lo = 255, hi = 0;
  for (const c of box) { lo = Math.min(lo, c[ch]); hi = Math.max(hi, c[ch]); }
  return hi - lo;
}
const spread = (box: RGB[]): number => Math.max(range(box, 0), range(box, 1), range(box, 2)) * box.length;

export const hex = (c: RGB): string => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
export const unhex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function loadPaletteFile(path: string): RGB[] {
  const f = JSON.parse(readFileSync(path, 'utf8')) as PaletteFile;
  return f.colours.map(unhex);
}

import sharp from 'sharp';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { loadPaletteFile, quantise } from './palette';

export interface AtlasAction { name: string; sheet: string; frames: number; cols?: number }
export interface AtlasManifest {
  name: string; targetHeight: number; palette: string; scaleFrom: string; bgKey?: string; outDir: string; actions: AtlasAction[];
}
interface RawFrame { action: string; index: number; data: Buffer; w: number; h: number }
interface Box { x1: number; y1: number; x2: number; y2: number }

async function splitSheet(a: AtlasAction, bgKey?: string): Promise<RawFrame[]> {
  const img = sharp(a.sheet).ensureAlpha();
  const meta = await img.metadata();
  const cols = a.cols ?? a.frames;
  const fw = Math.floor((meta.width as number) / cols);
  const rows = Math.ceil(a.frames / cols);
  const fh = Math.floor((meta.height as number) / rows);
  const frames: RawFrame[] = [];
  for (let i = 0; i < a.frames; i++) {
    const left = (i % cols) * fw, top = Math.floor(i / cols) * fh;
    const { data } = await sharp(a.sheet).ensureAlpha().extract({ left, top, width: fw, height: fh }).raw().toBuffer({ resolveWithObject: true });
    if (bgKey) knockout(data, bgKey);
    frames.push({ action: a.name, index: i, data, w: fw, h: fh });
  }
  return frames;
}

/** Make pixels within tolerance of a flat key colour transparent (AutoSprite sheets on a flat grey). */
function knockout(data: Buffer, keyHex: string, tol = 28): Buffer {
  const kr = parseInt(keyHex.slice(1, 3), 16), kg = parseInt(keyHex.slice(3, 5), 16), kb = parseInt(keyHex.slice(5, 7), 16);
  for (let i = 0; i < data.length; i += 4) {
    if (Math.abs(data[i]! - kr) <= tol && Math.abs(data[i + 1]! - kg) <= tol && Math.abs(data[i + 2]! - kb) <= tol) data[i + 3] = 0;
  }
  return data;
}

function bounds(f: RawFrame): Box | null {
  let x1 = f.w, y1 = f.h, x2 = -1, y2 = -1;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
    if ((f.data[(y * f.w + x) * 4 + 3] as number) >= 128) { x1 = Math.min(x1, x); y1 = Math.min(y1, y); x2 = Math.max(x2, x); y2 = Math.max(y2, y); }
  }
  return x2 < 0 ? null : { x1, y1, x2: x2 + 1, y2: y2 + 1 };
}
const union = (boxes: Box[]): Box => ({
  x1: Math.min(...boxes.map((b) => b.x1)), y1: Math.min(...boxes.map((b) => b.y1)),
  x2: Math.max(...boxes.map((b) => b.x2)), y2: Math.max(...boxes.map((b) => b.y2)),
});

export async function buildAtlas(m: AtlasManifest): Promise<{ png: string; json: string; frameW: number; frameH: number; scale: number }> {
  mkdirSync(m.outDir, { recursive: true });
  const palette = loadPaletteFile(m.palette);
  const raw: RawFrame[] = [];
  for (const a of m.actions) raw.push(...await splitSheet(a, m.bgKey));
  const boxes = raw.map((f) => bounds(f) ?? { x1: 0, y1: 0, x2: f.w, y2: f.h });
  const all = union(boxes);
  const refBoxes = raw.map((f, i) => (f.action === m.scaleFrom ? boxes[i] as Box : null)).filter((b): b is Box => b !== null);
  if (refBoxes.length === 0) throw new Error(`scaleFrom action '${m.scaleFrom}' not in manifest`);
  const refH = union(refBoxes).y2 - union(refBoxes).y1;
  const scale = m.targetHeight / refH;
  // Common crop = union box across ALL frames, so the feet line (all.y2) is the same for every frame → origin (0.5, 1) never slides.
  const cropW = all.x2 - all.x1, cropH = all.y2 - all.y1;
  const frameW = Math.ceil(cropW * scale), frameH = Math.ceil(cropH * scale);
  const cells: Buffer[] = [];
  for (const f of raw) {
    const cropped = await sharp(f.data, { raw: { width: f.w, height: f.h, channels: 4 } })
      .extract({ left: all.x1, top: all.y1, width: cropW, height: cropH })
      .resize(frameW, frameH, { kernel: 'lanczos3', fit: 'fill' })
      .raw().toBuffer();
    cells.push(Buffer.from(quantise(new Uint8Array(cropped), palette)));
  }
  const atlasW = frameW * cells.length;
  const png = join(m.outDir, `${m.name}.png`), json = join(m.outDir, `${m.name}.json`);
  await sharp({ create: { width: atlasW, height: frameH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(cells.map((c, i) => ({ input: c, raw: { width: frameW, height: frameH, channels: 4 }, left: i * frameW, top: 0 })))
    .png({ compressionLevel: 9, palette: false }).toFile(png);
  const frames: Record<string, unknown> = {};
  raw.forEach((f, i) => {
    frames[`${m.name}/${f.action}/${f.index}`] = {
      frame: { x: i * frameW, y: 0, w: frameW, h: frameH }, rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH }, sourceSize: { w: frameW, h: frameH },
    };
  });
  writeFileSync(json, JSON.stringify({
    frames,
    meta: { app: 'slag-city build-atlas', image: basename(png), size: { w: atlasW, h: frameH }, scale: '1', slagcity: { origin: [0.5, 1], scale, frameW, frameH } },
  }, null, 1));
  return { png, json, frameW, frameH, scale };
}

// CLI: npx tsx tools/art/build-atlas.ts <manifest.json>
if (process.argv[1] && process.argv[1].endsWith('build-atlas.ts')) {
  const path = process.argv[2];
  if (!path) { console.error('usage: build-atlas <manifest.json>'); process.exit(2); }
  const m = JSON.parse(readFileSync(path, 'utf8')) as AtlasManifest;
  buildAtlas(m).then((r) => console.log(`atlas ${r.png} ${r.frameW}x${r.frameH} scale=${r.scale.toFixed(3)}`)).catch((e) => { console.error(e); process.exit(1); });
}

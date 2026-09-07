// tools/art/make-provisional-palette.ts  — npx tsx tools/art/make-provisional-palette.ts <out.json> <img...>
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { buildPalette, hex } from './palette';

const [out, ...imgs] = process.argv.slice(2);
if (!out || imgs.length === 0) { console.error('usage: make-provisional-palette <out.json> <img...>'); process.exit(2); }
const chunks: Uint8Array[] = [];
for (const p of imgs) chunks.push(new Uint8Array(await sharp(p).ensureAlpha().resize({ width: 256 }).raw().toBuffer()));
const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
const colours = buildPalette(all, 64).map(hex);
writeFileSync(out, JSON.stringify({ name: 'provisional', groups: [], colours }, null, 1));
console.log(`${colours.length} colours → ${out}`);

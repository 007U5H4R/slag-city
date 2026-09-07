import { describe, it, expect, beforeAll } from 'vitest';
import sharp from 'sharp';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { buildAtlas } from '../../tools/art/build-atlas';

const TMP = '/Volumes/E Drive/Dev/.scratch/slag-city-test/atlas';

async function sheet(path: string, frames: number, size: number): Promise<void> {
  // each frame: a coloured 40x100 block standing on the frame's floor, x-offset varies to prove trimming/alignment
  const composites = [];
  for (let i = 0; i < frames; i++) {
    composites.push({ input: { create: { width: 40, height: 100 - i * 10, channels: 4 as const, background: { r: 200, g: 40 + i * 20, b: 30, alpha: 1 } } }, left: i * size + 60 + i * 5, top: size - (100 - i * 10) - 20 });
  }
  await sharp({ create: { width: size * frames, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(composites).png().toFile(path);
}

describe('build-atlas', () => {
  beforeAll(async () => {
    mkdirSync(TMP, { recursive: true });
    await sheet(`${TMP}/walk.png`, 3, 256);
    await sheet(`${TMP}/attack.png`, 2, 256);
    writeFileSync(`${TMP}/pal.json`, JSON.stringify({ name: 't', groups: [], colours: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffffff'] }));
  });
  it('emits a Phaser atlas whose frames share one size, are scaled to targetHeight, and use only palette colours', async () => {
    const out = await buildAtlas({
      name: 'dummy', targetHeight: 64, palette: `${TMP}/pal.json`, scaleFrom: 'walk', outDir: TMP,
      actions: [{ name: 'walk', sheet: `${TMP}/walk.png`, frames: 3 }, { name: 'attack', sheet: `${TMP}/attack.png`, frames: 2 }],
    });
    const json = JSON.parse(readFileSync(out.json, 'utf8')) as { frames: Record<string, { frame: { w: number; h: number } }>; meta: { slagcity: { frameH: number } } };
    expect(Object.keys(json.frames).sort()).toEqual(['dummy/attack/0', 'dummy/attack/1', 'dummy/walk/0', 'dummy/walk/1', 'dummy/walk/2']);
    expect(json.meta.slagcity.frameH).toBe(64);
    for (const f of Object.values(json.frames)) expect(f.frame.h).toBe(64);
    const { data, info } = await sharp(out.png).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    const allowed = new Set(['0,0,0', '255,0,0', '0,255,0', '0,0,255', '255,255,255']);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      expect(data[i + 3]).toBe(255);
      expect(allowed.has(`${data[i]},${data[i + 1]},${data[i + 2]}`)).toBe(true);
    }
  });
});

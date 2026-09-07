// test/tools/palette.test.ts
import { describe, it, expect } from 'vitest';
import { buildPalette, nearest, quantise } from '../../tools/art/palette';

function px(...cols: Array<[number, number, number, number]>): Uint8Array {
  return new Uint8Array(cols.flat());
}

describe('palette', () => {
  it('nearest picks the closest colour by RGB distance', () => {
    const pal: Array<[number, number, number]> = [[0, 0, 0], [255, 255, 255], [255, 0, 0]];
    expect(nearest(pal, 250, 10, 10)).toBe(2);
    expect(nearest(pal, 200, 200, 200)).toBe(1);
  });
  it('quantise snaps colours and binarises alpha with no dither', () => {
    const pal: Array<[number, number, number]> = [[0, 0, 0], [255, 255, 255]];
    const out = quantise(px([120, 120, 120, 255], [130, 130, 130, 255], [10, 10, 10, 100]), pal);
    expect([...out]).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0]);
  });
  it('buildPalette returns exactly `count` distinct colours from an opaque image', () => {
    const cols: Array<[number, number, number, number]> = [];
    for (let i = 0; i < 4096; i++) cols.push([(i * 37) % 256, (i * 91) % 256, (i * 13) % 256, 255]);
    const pal = buildPalette(px(...cols), 64);
    expect(pal).toHaveLength(64);
    expect(new Set(pal.map((c) => c.join(','))).size).toBe(64);
  });
  it('buildPalette ignores transparent pixels', () => {
    const pal = buildPalette(px([255, 0, 0, 255], [0, 255, 0, 0]), 1);
    expect(pal).toEqual([[255, 0, 0]]);
  });
});

// test/core/arcade/attract.test.ts
import { describe, it, expect } from 'vitest';
import { attractSegmentAt, ATTRACT } from '@core/arcade/attract';

const DEMO = 1200;
const total = ATTRACT.titleFrames + DEMO + ATTRACT.tableFrames;

describe('attract timeline', () => {
  it('walks title -> demo -> table in order', () => {
    expect(attractSegmentAt(0, DEMO).segment).toBe('title');
    expect(attractSegmentAt(ATTRACT.titleFrames, DEMO).segment).toBe('demo');
    expect(attractSegmentAt(ATTRACT.titleFrames + DEMO, DEMO).segment).toBe('table');
  });
  it('reports frameInSegment relative to each segment start', () => {
    expect(attractSegmentAt(ATTRACT.titleFrames + 5, DEMO)).toMatchObject({ segment: 'demo', frameInSegment: 5 });
  });
  it('flags the crossfade window in the last crossfadeFrames of a segment', () => {
    expect(attractSegmentAt(ATTRACT.titleFrames - 1, DEMO).fading).toBe(true);
    expect(attractSegmentAt(ATTRACT.titleFrames - ATTRACT.crossfadeFrames - 1, DEMO).fading).toBe(false);
  });
  it('loops cleanly at the total period', () => {
    expect(attractSegmentAt(total, DEMO)).toEqual(attractSegmentAt(0, DEMO));
  });
});

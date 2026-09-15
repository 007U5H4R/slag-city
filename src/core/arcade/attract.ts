// src/core/arcade/attract.ts
// Attract-mode timeline: title card -> recorded demo replay -> hi-score table, looping, with a short
// crossfade at each boundary (the one soft transition Design §4 allows). `demoFrames` is the length of
// the recorded demo (from attract-demo.json) so the demo segment is exactly as long as the replay.
export type AttractSegment = 'title' | 'demo' | 'table';
export const ATTRACT = { titleFrames: 300, tableFrames: 360, crossfadeFrames: 30 } as const; // 30f ~= 500ms

export function attractSegmentAt(frame: number, demoFrames: number): { segment: AttractSegment; frameInSegment: number; fading: boolean } {
  const lens: Array<[AttractSegment, number]> = [['title', ATTRACT.titleFrames], ['demo', demoFrames], ['table', ATTRACT.tableFrames]];
  const total = lens.reduce((n, [, l]) => n + l, 0);
  let f = frame % total;
  for (const [segment, len] of lens) {
    if (f < len) return { segment, frameInSegment: f, fading: f >= len - ATTRACT.crossfadeFrames };
    f -= len;
  }
  return { segment: 'title', frameInSegment: 0, fading: false };
}

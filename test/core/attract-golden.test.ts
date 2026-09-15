// test/core/attract-golden.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runReplay } from '@core/sim/replay';
import { createWorld } from '@core/sim/state';
import { STAGE1 } from '@core/stage/stage1';

describe('attract demo golden', () => {
  it('replays to the committed hash', () => {
    const g = JSON.parse(readFileSync('test/replays/attract-demo.json', 'utf8')) as { seed: number; inputs: number[]; hash: string };
    expect(g.inputs.length).toBeGreaterThan(600);
    expect(runReplay(g.seed, g.inputs, createWorld(g.seed, undefined, STAGE1)).hash).toBe(g.hash);
  });
});

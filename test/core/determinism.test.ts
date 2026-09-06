// test/core/determinism.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { runReplay } from '@core/sim/replay';
import { encodeInput } from '@core/input-codec';
import { EMPTY_INPUT } from '@core/types';

function syntheticInputs(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(encodeInput({
      ...EMPTY_INPUT,
      right: i % 120 < 80, up: i % 200 < 50, down: i % 200 >= 150,
      jump: i % 90 === 0, attack: i % 37 === 0,
    }));
  }
  return out;
}

describe('determinism', () => {
  it('same seed + same input log => same hash', () => {
    const inputs = syntheticInputs(600);
    expect(runReplay(7, inputs).hash).toBe(runReplay(7, inputs).hash);
  });
  it('different inputs => different hash', () => {
    // Perturb frame 60: the hero is grounded and walking there, so zeroing input
    // actually changes lasting state. (Frame 10 was airborne — input is ignored
    // mid-jump, so the worlds reconverged and hashed identically; see LEDGER 05.4.)
    const a = syntheticInputs(600), b = syntheticInputs(600); b[60] = 0;
    expect(runReplay(7, a).hash).not.toBe(runReplay(7, b).hash);
  });
  it('matches the committed golden test/replays/locomotion-01.json', () => {
    const path = 'test/replays/locomotion-01.json';
    const inputs = syntheticInputs(600);
    const { hash } = runReplay(7, inputs);
    if (process.env.UPDATE_GOLDENS === '1' || !existsSync(path)) {
      writeFileSync(path, JSON.stringify({ seed: 7, inputs, hash }, null, 0) + '\n');
    }
    const golden = JSON.parse(readFileSync(path, 'utf8')) as { seed: number; inputs: number[]; hash: string };
    expect(runReplay(golden.seed, golden.inputs).hash).toBe(golden.hash);
  });
});

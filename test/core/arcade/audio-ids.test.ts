import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SFX_IDS } from '@core/arcade/audio-ids';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('audio id contract', () => {
  it('the core never emits an sfx id outside SFX_IDS', () => {
    // Matches only literal ids: the `hit_${level}` template is skipped, and its concrete ids are in SFX_IDS.
    const src = walk('src/core').map((f) => readFileSync(f, 'utf8')).join('\n');
    const emitted = [...src.matchAll(/type: 'sfx', id: '([a-z_]+)'/g)].map((m) => m[1]);
    expect(emitted.length).toBeGreaterThan(0);
    for (const id of emitted) expect(SFX_IDS as readonly string[]).toContain(id);
  });
});

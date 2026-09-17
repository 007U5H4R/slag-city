// Regression scar for the SLAGJAW dialogue overflow (2026-09-17): the boss-encounter dialogue box
// (BossDialogue.BOX, 58px tall) renders at most TWO text rows. A line written with 3+ rows (2+ "\n")
// spills below the frame — which is exactly what shipped and had to be split. This guards BOSS_SCRIPTS
// against it mechanically, in `npm run check`, so a future 3-row line fails the gate instead of the eye.
//
// It reads the source as text (rather than importing the module) on purpose: BossDialogue pulls in Phaser
// via ScifiFrame, which does not load in the node test environment. The invariant lives in the literal
// data, so a text check over the `text: '…'` literals is both sufficient and Phaser-free.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const SRC = fileURLToPath(new URL('../../src/adapters/phaser/screens/BossDialogue.ts', import.meta.url));
const MAX_ROWS = 2; // BossDialogue.BOX holds two rows; keep in sync if the box height changes.

describe('BossDialogue scripts fit the dialogue box', () => {
  it(`no dialogue line exceeds ${MAX_ROWS} rows (would overflow BOX)`, () => {
    const src = readFileSync(SRC, 'utf8');
    // Every speaker line is `text: '…'` — capture the single-quoted literal (with escape handling).
    const lines = [...src.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]!);
    expect(lines.length).toBeGreaterThan(0); // sanity: the regex actually found the scripts
    const tooTall = lines
      .map((t) => ({ text: t, rows: (t.match(/\\n/g)?.length ?? 0) + 1 }))
      .filter((l) => l.rows > MAX_ROWS);
    expect(tooTall, `these lines render >${MAX_ROWS} rows and will spill out of the box:\n` +
      tooTall.map((l) => `  (${l.rows} rows) "${l.text}"`).join('\n')).toEqual([]);
  });
});

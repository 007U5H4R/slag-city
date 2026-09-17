// Regression scar for the SLAGJAW dialogue overflow (2026-09-17): the boss-encounter dialogue box
// (BossDialogue.BOX, 58px tall) renders at most TWO text rows. A line written with 3+ rows spills below the
// frame — which is exactly what shipped and had to be split. Asserts on the REAL script data (not a regex over
// the source), so a line can't dodge it by using double quotes or a template literal.
import { describe, it, expect } from 'vitest';
import { BOSS_SCRIPTS } from '@adapters/phaser/screens/BossDialogue';
import { BOSS_WAVES } from '@core/entities/boss';

const MAX_ROWS = 2; // BossDialogue.BOX holds two rows; keep in sync if the box height changes.

describe('BossDialogue scripts fit the dialogue box', () => {
  it(`no dialogue line exceeds ${MAX_ROWS} rows (would overflow BOX)`, () => {
    const lines = BOSS_SCRIPTS.flatMap((s) => [...s.pre, ...s.defeat].map((l) => ({ boss: s.name, who: l.who, text: l.text, rows: l.text.split('\n').length })));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((l) => l.rows > MAX_ROWS)).toEqual([]);
  });
  it('has exactly one script per boss wave (GameScene indexes BOSS_SCRIPTS by wave)', () => {
    expect(BOSS_SCRIPTS.length).toBe(BOSS_WAVES.length);
    for (const s of BOSS_SCRIPTS) { expect(s.pre.length).toBeGreaterThan(0); expect(s.defeat.length).toBeGreaterThan(0); }
  });
});

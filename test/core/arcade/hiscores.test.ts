import { describe, it, expect } from 'vitest';
import { DEFAULT_TABLE, insertScore, qualifies, rowIs1CC, sanitiseTable, TABLE_SIZE } from '@core/arcade/hiscores';
import { createEntry, reduceEntry, entryText, LETTERS } from '@core/arcade/initials';

const row = (score: number, credits = 2) => ({ initials: 'TST', score, credits, stage: 1, date: '2026-09-06T00:00:00.000Z' });

describe('hi-scores', () => {
  it('default table is 10 rows, sorted descending, ISO dates', () => {
    expect(DEFAULT_TABLE).toHaveLength(TABLE_SIZE);
    expect(DEFAULT_TABLE.every((r, i, a) => i === 0 || a[i - 1]!.score >= r.score)).toBe(true);
    expect(DEFAULT_TABLE.every((r) => !Number.isNaN(Date.parse(r.date)))).toBe(true);
  });
  it('qualifies only above the 10th score; insert keeps order and cuts to 10', () => {
    const t = DEFAULT_TABLE;
    expect(qualifies(t, t[9]!.score)).toBe(false);
    expect(qualifies(t, t[9]!.score + 1)).toBe(true);
    const { table, index } = insertScore(t, row(t[0]!.score + 1));
    expect(index).toBe(0); expect(table).toHaveLength(10); expect(table[0]!.initials).toBe('TST');
    expect(insertScore(t, row(0)).index).toBeNull();
  });
  it('flags 1CC rows', () => { expect(rowIs1CC(row(1, 1))).toBe(true); expect(rowIs1CC(row(1, 2))).toBe(false); });
  it('sanitise rejects garbage', () => {
    expect(sanitiseTable(null)).toEqual(DEFAULT_TABLE);
    expect(sanitiseTable([{ initials: 'AB', score: 'x' }])).toEqual(DEFAULT_TABLE);
    expect(sanitiseTable(DEFAULT_TABLE)).toEqual(DEFAULT_TABLE);
  });
});
describe('AAA entry', () => {
  it('cycles letters with wrap, confirm advances, third confirm finishes', () => {
    let s = createEntry(); expect(entryText(s)).toBe('AAA');
    s = reduceEntry(s, 'down'); expect(entryText(s)).toBe(LETTERS[LETTERS.length - 1] + 'AA');
    s = reduceEntry(s, 'up'); s = reduceEntry(s, 'up'); expect(entryText(s)).toBe('BAA');
    s = reduceEntry(s, 'confirm'); expect(s.pos).toBe(1);
    s = reduceEntry(s, 'confirm'); s = reduceEntry(s, 'confirm');
    expect(s.done).toBe(true); expect(entryText(s)).toBe('BAA');
  });
});

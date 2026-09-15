// src/core/arcade/hiscores.ts
import { LETTERS } from './initials';

export interface HiScoreRow { initials: string; score: number; credits: number; stage: number; date: string /* ISO-8601 */ }
export const TABLE_SIZE = 10;

/** 10 seeded rows, descending scores 50000→5000 (step 5000); top three are 1CC (credits 1). */
export const DEFAULT_TABLE: HiScoreRow[] = [
  { initials: 'SLG', score: 50000, credits: 1, stage: 3, date: '2026-01-01T00:00:00.000Z' },
  { initials: 'IRN', score: 45000, credits: 1, stage: 3, date: '2026-01-02T00:00:00.000Z' },
  { initials: 'MLT', score: 40000, credits: 1, stage: 2, date: '2026-01-03T00:00:00.000Z' },
  { initials: 'ORE', score: 35000, credits: 2, stage: 2, date: '2026-01-04T00:00:00.000Z' },
  { initials: 'COG', score: 30000, credits: 2, stage: 2, date: '2026-01-05T00:00:00.000Z' },
  { initials: 'PIG', score: 25000, credits: 2, stage: 1, date: '2026-01-06T00:00:00.000Z' },
  { initials: 'ASH', score: 20000, credits: 2, stage: 1, date: '2026-01-07T00:00:00.000Z' },
  { initials: 'TAP', score: 15000, credits: 2, stage: 1, date: '2026-01-08T00:00:00.000Z' },
  { initials: 'RIG', score: 10000, credits: 2, stage: 1, date: '2026-01-09T00:00:00.000Z' },
  { initials: 'DUG', score: 5000, credits: 2, stage: 1, date: '2026-01-10T00:00:00.000Z' },
];

export function qualifies(table: HiScoreRow[], score: number): boolean {
  if (table.length < TABLE_SIZE) return true;
  return score > table[table.length - 1]!.score;
}

/** Insert desc; ties place the new row below the incumbent; cut to TABLE_SIZE. index is null if the row was cut. */
export function insertScore(table: HiScoreRow[], row: HiScoreRow): { table: HiScoreRow[]; index: number | null } {
  const sorted = [...table, row].sort((a, b) => b.score - a.score || (a === row ? 1 : -1)).slice(0, TABLE_SIZE);
  const index = sorted.indexOf(row);
  return { table: sorted, index: index === -1 ? null : index };
}

export const rowIs1CC = (r: HiScoreRow): boolean => r.credits === 1;

function isValidRow(v: unknown): v is HiScoreRow {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.initials === 'string' && r.initials.length === 3 && [...r.initials].every((c) => LETTERS.includes(c)) &&
    typeof r.score === 'number' && Number.isFinite(r.score) && r.score >= 0 &&
    typeof r.credits === 'number' && Number.isInteger(r.credits) && r.credits >= 1 &&
    typeof r.stage === 'number' && Number.isInteger(r.stage) && r.stage >= 1 &&
    typeof r.date === 'string' && !Number.isNaN(Date.parse(r.date))
  );
}

/** Defensive load: anything that isn't a valid table of ≤ TABLE_SIZE rows falls back to DEFAULT_TABLE. */
export function sanitiseTable(v: unknown): HiScoreRow[] {
  if (!Array.isArray(v) || v.length === 0 || v.length > TABLE_SIZE) return DEFAULT_TABLE;
  if (!v.every(isValidRow)) return DEFAULT_TABLE;
  return v as HiScoreRow[];
}

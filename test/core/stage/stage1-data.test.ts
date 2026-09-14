import { describe, it, expect } from 'vitest';
import { STAGE1, sectionIndexAt } from '@core/stage/stage1';

const kinds = (i: number) => STAGE1.locks[i]!.entries.filter((e) => e.kind !== 'crate').map((e) => e.kind).sort();
const sectionOf = (lock: { camX: number }) => sectionIndexAt(STAGE1, lock.camX + 192);

describe('stage 1 data (Solution-PRD §4)', () => {
  it('has three sections then the boss door, in order', () => {
    expect(STAGE1.sections.map((s) => s.name)).toEqual(['Foundry Gates', 'Conveyor Floor', 'Furnace Hall']);
    expect(STAGE1.locks.every((l, i, a) => i === 0 || l.camX > a[i - 1]!.camX)).toBe(true);
    expect(STAGE1.bossDoorX).toBeGreaterThan(STAGE1.locks[STAGE1.locks.length - 1]!.camX + 384);
    expect(STAGE1.bossDoorX).toBeLessThanOrEqual(STAGE1.width - 384);
  });
  it('section 1: two fights — 2 brawlers, then 3 brawlers + 1 knife; a health crate', () => {
    const s1 = STAGE1.locks.filter((l) => sectionOf(l) === 0);
    expect(s1).toHaveLength(2);
    expect(kinds(STAGE1.locks.indexOf(s1[0]!))).toEqual(['brawler', 'brawler']);
    expect(kinds(STAGE1.locks.indexOf(s1[1]!))).toEqual(['brawler', 'brawler', 'brawler', 'knife']);
    expect(s1.flatMap((l) => l.entries).some((e) => e.kind === 'crate' && e.contents === 'lunchpail')).toBe(true);
  });
  it('section 2: three fights, adds the heavy, first feral from a wall vent; belts and a molten channel', () => {
    const s2 = STAGE1.locks.filter((l) => sectionOf(l) === 1);
    expect(s2).toHaveLength(3);
    expect(s2.flatMap((l) => l.entries).some((e) => e.kind === 'heavy')).toBe(true);
    const ferals = s2.flatMap((l) => l.entries).filter((e) => e.kind === 'feral');
    expect(ferals).toHaveLength(1); expect(ferals[0]!.vent).toBe(true);
    const hz = STAGE1.sections[1]!.hazards.map((h) => h.type);
    expect(hz).toContain('belt'); expect(hz).toContain('channel');
  });
  it('section 3: mixed gangs, two ferals at once, final gauntlet; ladle pours', () => {
    const s3 = STAGE1.locks.filter((l) => sectionOf(l) === 2);
    expect(s3.length).toBeGreaterThanOrEqual(2);
    expect(s3.some((l) => l.entries.filter((e) => e.kind === 'feral').length === 2)).toBe(true);
    const last = s3[s3.length - 1]!;
    expect(last.entries.filter((e) => e.kind !== 'crate').length).toBeGreaterThanOrEqual(6);
    expect(STAGE1.sections[2]!.hazards.some((h) => h.type === 'ladle')).toBe(true);
  });
  it('no feral appears before section 2', () => {
    expect(STAGE1.locks.filter((l) => sectionOf(l) === 0).flatMap((l) => l.entries).some((e) => e.kind === 'feral')).toBe(false);
  });
});

// src/core/stage/stage1.ts
import type { PickupKind } from '../sim/entity';

export interface SpawnEntry { kind: 'brawler' | 'knife' | 'heavy' | 'feral' | 'crate'; x: number; y: number; delay: number; variant?: number; contents?: PickupKind; vent?: boolean }
export interface ScrollLock { camX: number; entries: SpawnEntry[] }
export type Hazard =
  | { type: 'belt'; x1: number; x2: number; y1: number; y2: number; push: number }
  | { type: 'channel'; x1: number; x2: number; y1: number; y2: number }
  | { type: 'ladle'; x: number; w: number; period: number; tellFrames: number; damageFrames: number };
export interface Section { name: string; bg: 's1' | 's2' | 's3'; startX: number; hazards: Hazard[] }
export interface StageData { width: number; sections: Section[]; locks: ScrollLock[]; bossDoorX: number }

const R = (camX: number, off: number): number => camX + off;   // spawn just outside the right edge (off ≥ 400) or left (off < 0)

export const STAGE1: StageData = {
  width: 4400,
  sections: [
    { name: 'Foundry Gates', bg: 's1', startX: 0, hazards: [] },
    { name: 'Conveyor Floor', bg: 's2', startX: 1400, hazards: [
      { type: 'belt', x1: 1500, x2: 1900, y1: 128, y2: 160, push: 0.6 },
      { type: 'belt', x1: 2100, x2: 2500, y1: 176, y2: 208, push: -0.6 },
      { type: 'channel', x1: 1950, x2: 2050, y1: 184, y2: 208 },
    ] },
    { name: 'Furnace Hall', bg: 's3', startX: 2800, hazards: [
      { type: 'ladle', x: 3000, w: 72, period: 240, tellFrames: 60, damageFrames: 30 },
      { type: 'ladle', x: 3450, w: 72, period: 300, tellFrames: 60, damageFrames: 30 },
    ] },
  ],
  locks: [
    // § Foundry Gates — teaches combo, jump, grab→throw; health crate
    { camX: 320,  entries: [ { kind: 'brawler', x: R(320, 420), y: 160, delay: 0 }, { kind: 'brawler', x: R(320, 460), y: 190, delay: 40 },
                             { kind: 'crate', x: 560, y: 200, delay: 0, contents: 'lunchpail' } ] },
    { camX: 900,  entries: [ { kind: 'brawler', x: R(900, 420), y: 150, delay: 0, variant: 1 }, { kind: 'brawler', x: R(900, -40), y: 190, delay: 30 },
                             { kind: 'knife', x: R(900, 440), y: 175, delay: 60 }, { kind: 'brawler', x: R(900, 480), y: 200, delay: 240, variant: 2 } ] },
    // § Conveyor Floor — hazards, neutral hazard, salvage
    { camX: 1520, entries: [ { kind: 'brawler', x: R(1520, 420), y: 170, delay: 0 }, { kind: 'brawler', x: R(1520, -40), y: 190, delay: 20, variant: 1 },
                             { kind: 'heavy', x: R(1520, 460), y: 180, delay: 90 } ] },
    { camX: 2000, entries: [ { kind: 'knife', x: R(2000, 420), y: 150, delay: 0 }, { kind: 'knife', x: R(2000, -40), y: 200, delay: 40, variant: 1 },
                             { kind: 'brawler', x: R(2000, 440), y: 185, delay: 80 },
                             { kind: 'feral', x: 2340, y: 140, delay: 150, vent: true },
                             { kind: 'crate', x: 2260, y: 205, delay: 0, contents: 'gear' } ] },
    { camX: 2450, entries: [ { kind: 'heavy', x: R(2450, 420), y: 175, delay: 0, variant: 1 }, { kind: 'knife', x: R(2450, -40), y: 150, delay: 30 },
                             { kind: 'brawler', x: R(2450, 440), y: 200, delay: 60 }, { kind: 'brawler', x: R(2450, 480), y: 160, delay: 200, variant: 2 } ] },
    // § Furnace Hall — everything at once, final gauntlet
    { camX: 3050, entries: [ { kind: 'brawler', x: R(3050, 420), y: 165, delay: 0 }, { kind: 'knife', x: R(3050, -40), y: 195, delay: 20 },
                             { kind: 'feral', x: 3400, y: 135, delay: 60, vent: true }, { kind: 'feral', x: 2760, y: 205, delay: 60, vent: true },
                             { kind: 'crate', x: 3300, y: 205, delay: 0, contents: 'lunchpail' } ] },
    { camX: 3550, entries: [ { kind: 'heavy', x: R(3550, 420), y: 170, delay: 0 }, { kind: 'knife', x: R(3550, -40), y: 150, delay: 0, variant: 1 },
                             { kind: 'brawler', x: R(3550, 440), y: 200, delay: 60, variant: 1 }, { kind: 'brawler', x: R(3550, -60), y: 175, delay: 120 },
                             { kind: 'knife', x: R(3550, 460), y: 185, delay: 240, variant: 2 }, { kind: 'heavy', x: R(3550, 480), y: 160, delay: 300, variant: 1 },
                             { kind: 'crate', x: 3800, y: 205, delay: 0, contents: 'gear' } ] },
  ],
  bossDoorX: 4000,
};

export function sectionIndexAt(stage: StageData, x: number): number {
  let i = 0;
  for (let k = 0; k < stage.sections.length; k++) if (x >= stage.sections[k]!.startX) i = k;
  return i;
}

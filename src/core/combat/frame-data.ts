// src/core/combat/frame-data.ts
import type { HitLevel, Rect } from '../types';
import type { EntityKind } from '../sim/entity';

export interface MoveData {
  startup: number; active: number; recovery: number;
  hitbox: Rect; damage: number; level: HitLevel; pushback: number;
  /** Name of the move this one chains from (input buffered during startup+active+recovery of that move). */
  chainFrom?: string;
}
export interface ActorData {
  walkSpeed: { x: number; y: number };
  hp: number;
  hurtbox: Rect;
  jumpVz: number;
  moves: Record<string, MoveData>;
}

export const HERO_DATA: ActorData = {
  walkSpeed: { x: 1.5, y: 1 },
  hp: 100,
  hurtbox: { x: -10, y: 0, w: 20, h: 56 },
  jumpVz: 4.5,
  moves: {
    attack1: { startup: 3, active: 3, recovery: 8,  hitbox: { x: 8, y: 24, w: 26, h: 16 }, damage: 6,  level: 'light',  pushback: 2 },
    attack2: { startup: 3, active: 3, recovery: 9,  hitbox: { x: 8, y: 24, w: 28, h: 16 }, damage: 6,  level: 'light',  pushback: 2, chainFrom: 'attack1' },
    attack3: { startup: 5, active: 4, recovery: 14, hitbox: { x: 8, y: 20, w: 34, h: 24 }, damage: 10, level: 'launch', pushback: 3, chainFrom: 'attack2' },
  },
};

const registry: Partial<Record<EntityKind, ActorData>> = { hero: HERO_DATA };
export function registerActorData(kind: EntityKind, data: ActorData): void { registry[kind] = data; }
export function dataFor(kind: EntityKind): ActorData {
  const d = registry[kind];
  if (!d) throw new Error(`no actor data for ${kind}`);
  return d;
}
export const moveTotal = (m: MoveData): number => m.startup + m.active + m.recovery;

export function nextChain(kind: EntityKind, state: string): string | null {
  for (const [name, m] of Object.entries(dataFor(kind).moves)) if (m.chainFrom === state) return name;
  return null;
}

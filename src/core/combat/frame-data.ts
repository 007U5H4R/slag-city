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
  moves: {},
};

const registry: Partial<Record<EntityKind, ActorData>> = { hero: HERO_DATA };
export function registerActorData(kind: EntityKind, data: ActorData): void { registry[kind] = data; }
export function dataFor(kind: EntityKind): ActorData {
  const d = registry[kind];
  if (!d) throw new Error(`no actor data for ${kind}`);
  return d;
}
export const moveTotal = (m: MoveData): number => m.startup + m.active + m.recovery;

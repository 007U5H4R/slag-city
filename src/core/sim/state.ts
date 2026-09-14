// src/core/sim/state.ts
import type { HitLevel, InputFrame } from '../types';
import { EMPTY_INPUT } from '../types';
import type { Entity, EntityKind, PickupKind, WeaponKind } from './entity';
import { createEntity } from './entity';
import type { RngState } from './rng';
import { createRng } from './rng';
import type { StageData } from '../stage/stage1';

export const WALK_BAND = { minY: 128, maxY: 208 } as const;
export const HUD_BAND = 16;
export const SCREEN = { w: 384, h: 224 } as const;

export type SimEvent =
  | { type: 'hit'; attackerId: number; victimId: number; level: HitLevel; x: number; y: number; damage: number }
  | { type: 'sfx'; id: string }
  | { type: 'score'; amount: number; x: number; y: number }
  | { type: 'namecard'; kind: string }
  | { type: 'weaponBreak'; kind: WeaponKind; x: number; y: number }
  | { type: 'pickup'; kind: PickupKind | WeaponKind; x: number; y: number }
  | { type: 'lockRelease'; index: number }
  | { type: 'bossDoor' }
  | { type: 'heroDead' } | { type: 'bossDefeated' } | { type: 'bossPhase2' };

export interface WorldState {
  frame: number; rng: RngState; nextId: number;
  entities: Entity[]; heroId: number;
  camera: { x: number; lockX: number | null; lockIndex: number };
  hitstop: number; shake: { frames: number; px: number };
  score: number; events: SimEvent[]; seenNameCards: string[];
  stage: { sectionIndex: number; bossDefeated: boolean; heroDead: boolean; lockCleared: boolean[];
    stageData: StageData | null; lockFrame: number; bossDoorReached: boolean };
  stageWidth: number;
  prevInput: InputFrame;
}

export function createWorld(seed: number, stageWidth = SCREEN.w * 3, stage: StageData | null = null): WorldState {
  const state: WorldState = {
    frame: 0, rng: createRng(seed), nextId: 1,
    entities: [], heroId: 0,
    camera: { x: 0, lockX: null, lockIndex: 0 },
    hitstop: 0, shake: { frames: 0, px: 0 },
    score: 0, events: [], seenNameCards: [],
    stage: { sectionIndex: 0, bossDefeated: false, heroDead: false,
      lockCleared: stage ? stage.locks.map(() => false) : [],
      stageData: stage, lockFrame: -1, bossDoorReached: false },
    stageWidth: stage?.width ?? stageWidth,
    prevInput: { ...EMPTY_INPUT },
  };
  const hero = spawn(state, 'hero', 64, 168);
  hero.hp = 100; hero.maxHp = 100;
  state.heroId = hero.id;
  return state;
}

export function spawn(state: WorldState, kind: EntityKind, x: number, y: number): Entity {
  const e = createEntity(state.nextId++, kind, x, y);
  state.entities.push(e);
  return e;
}

export function heroOf(state: WorldState): Entity {
  const h = state.entities.find((e) => e.id === state.heroId);
  if (!h) throw new Error('hero missing');
  return h;
}

export function byId(state: WorldState, id: number | null): Entity | undefined {
  return id === null ? undefined : state.entities.find((e) => e.id === id);
}

export function emit(state: WorldState, ev: SimEvent): void { state.events.push(ev); }

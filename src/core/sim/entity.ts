// src/core/sim/entity.ts
import type { Facing, Vec3 } from '../types';

export type EntityKind = 'hero' | 'brawler' | 'knife' | 'heavy' | 'feral' | 'boss'
  | 'crate' | 'pickup' | 'weaponPickup' | 'projectile';
export type Faction = 'hero' | 'gang' | 'feral' | 'none';
export type PickupKind = 'lunchpail' | 'gear';
export type WeaponKind = 'cannon' | 'blade';

export interface Entity {
  id: number; kind: EntityKind;
  pos: Vec3; vel: Vec3; facing: Facing;
  state: string; stateFrame: number;
  hp: number; maxHp: number;
  hitstun: number; invulnFrames: number; flashFrames: number; armorFrames: number; cooldown: number;
  hitIds: number[]; chainQueued: boolean;
  variant: number; attackTicket: boolean; ticketCooldown: number; targetId: number | null;
  weapon: { kind: WeaponKind; heat: number } | null;
  pickupKind: PickupKind | null; weaponKind: WeaponKind | null;
  ownerFaction: Faction;
  grabbedId: number | null; phase: 1 | 2; speedMul: number; tint: boolean;
  lockIndex: number; weaponUsePending: boolean;
  dead: boolean; removeIn: number;
}

export function createEntity(id: number, kind: EntityKind, x: number, y: number): Entity {
  return {
    id, kind,
    pos: { x, y, z: 0 }, vel: { x: 0, y: 0, z: 0 }, facing: 1,
    state: 'idle', stateFrame: 0,
    hp: 1, maxHp: 1,
    hitstun: 0, invulnFrames: 0, flashFrames: 0, armorFrames: 0, cooldown: 0,
    hitIds: [], chainQueued: false,
    variant: 0, attackTicket: false, ticketCooldown: 0, targetId: null,
    weapon: null, pickupKind: null, weaponKind: null,
    ownerFaction: 'none',
    grabbedId: null, phase: 1, speedMul: 1, tint: false,
    lockIndex: -1, weaponUsePending: false,
    dead: false, removeIn: -1,
  };
}

export function faction(e: Entity): Faction {
  switch (e.kind) {
    case 'hero': return 'hero';
    case 'brawler': case 'knife': case 'heavy': case 'boss': return 'gang';
    case 'feral': return 'feral';
    case 'projectile': return e.ownerFaction;
    default: return 'none';
  }
}

/** Change state and reset per-state bookkeeping. */
export function setState(e: Entity, state: string): void {
  e.state = state; e.stateFrame = 0; e.hitIds = [];
}

export const isBody = (e: Entity): boolean =>
  e.kind === 'hero' || e.kind === 'brawler' || e.kind === 'knife' || e.kind === 'heavy' || e.kind === 'feral' || e.kind === 'boss';

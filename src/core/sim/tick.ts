// src/core/sim/tick.ts
import type { InputFrame } from '../types';
import type { Entity, EntityKind } from './entity';
import type { WorldState } from './state';
import { applyPhysics } from './physics';
import { updateCamera } from './camera';
import { updateHero } from '../entities/hero';
import { updateGang } from '../entities/gang';
import { updateCrate, updatePickup } from '../entities/items';
import { resolveHits } from '../combat/resolve';
import { assignAttackTickets } from '../ai/tickets';
import { nameCardSystem } from '../arcade/namecards';
import { lockSystem } from '../stage/locks';

export type EntityUpdater = (state: WorldState, e: Entity, input: InputFrame) => void;
export const ENTITY_UPDATERS: Partial<Record<EntityKind, EntityUpdater>> = { hero: updateHero, brawler: updateGang, knife: updateGang, heavy: updateGang, crate: updateCrate, pickup: updatePickup };
/** Systems that run after entity updates and before physics (hit resolution, AI tickets, hazards). */
export const POST_UPDATE_SYSTEMS: Array<(state: WorldState) => void> = [lockSystem, assignAttackTickets, resolveHits, nameCardSystem];

export function tick(state: WorldState, input: InputFrame): WorldState {
  state.events = [];
  state.frame++;
  if (state.shake.frames > 0) state.shake.frames--;
  if (state.hitstop > 0) {
    state.hitstop--;
    state.prevInput = { ...input };
    return state;
  }
  for (const e of state.entities) {
    if (e.hitstun > 0) e.hitstun--;
    if (e.invulnFrames > 0) e.invulnFrames--;
    if (e.flashFrames > 0) e.flashFrames--;
    if (e.armorFrames > 0) e.armorFrames--;
    if (e.cooldown > 0) e.cooldown--;
    if (e.ticketCooldown > 0) e.ticketCooldown--;
    if (e.removeIn > 0 && --e.removeIn === 0) e.dead = true;
    ENTITY_UPDATERS[e.kind]?.(state, e, input);
  }
  for (const sys of POST_UPDATE_SYSTEMS) sys(state);
  applyPhysics(state);
  updateCamera(state);
  state.entities = state.entities.filter((e) => !e.dead);
  state.prevInput = { ...input };
  return state;
}

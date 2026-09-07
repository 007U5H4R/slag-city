// src/core/ai/tickets.ts
import type { Entity, EntityKind } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { heroOf, WALK_BAND } from '../sim/state';

export const MAX_ATTACKERS = 2;
export const TICKET_COOLDOWN = 45;
export const RING_DISTANCE = 72;
const OUT_OF_ACTION = new Set(['hurt', 'knockdown', 'down', 'getup', 'dead', 'grabbed', 'thrown']);

export const isGangKind = (k: EntityKind): boolean => k === 'brawler' || k === 'knife' || k === 'heavy';

export function releaseTicket(e: Entity): void {
  if (!e.attackTicket) return;
  e.attackTicket = false;
  e.ticketCooldown = TICKET_COOLDOWN;
}

export function assignAttackTickets(state: WorldState): void {
  const hero = heroOf(state);
  const gangs = state.entities.filter((e) => isGangKind(e.kind) && !e.dead);
  for (const g of gangs) if (g.attackTicket && (OUT_OF_ACTION.has(g.state) || g.hp <= 0)) releaseTicket(g);
  let held = gangs.filter((g) => g.attackTicket).length;
  if (held >= MAX_ATTACKERS) return;
  const candidates = gangs
    .filter((g) => !g.attackTicket && g.ticketCooldown === 0 && !OUT_OF_ACTION.has(g.state))
    .sort((a, b) => (Math.abs(a.pos.x - hero.pos.x) - Math.abs(b.pos.x - hero.pos.x)) || (a.id - b.id));
  for (const g of candidates) { if (held >= MAX_ATTACKERS) break; g.attackTicket = true; held++; }
}

/** Deterministic hover point: same side of the hero as the enemy, RING_DISTANCE away, depth offset by id. */
export function ringPosition(state: WorldState, e: Entity): { x: number; y: number } {
  const hero = heroOf(state);
  const side = e.pos.x >= hero.pos.x ? 1 : -1;
  const lane = (e.id % 3) - 1; // -1, 0, 1
  const y = Math.max(WALK_BAND.minY, Math.min(WALK_BAND.maxY, hero.pos.y + lane * 24));
  return { x: hero.pos.x + side * RING_DISTANCE, y };
}

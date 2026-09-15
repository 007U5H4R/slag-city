// src/core/arcade/session.ts
import type { WorldState } from '../sim/state';
import { createWorld, heroOf, WALK_BAND } from '../sim/state';
import { setState } from '../sim/entity';
import { STAGE1 } from '../stage/stage1';

export const newGameWorld = (seed: number): WorldState => createWorld(seed, undefined, STAGE1);

export function reviveHero(state: WorldState): void {
  const h = heroOf(state);
  h.hp = h.maxHp; setState(h, 'idle'); h.invulnFrames = 90; h.weapon = null; h.grabbedId = null;
  h.hitstun = 0; h.vel = { x: 0, y: 0, z: 0 }; h.pos = { x: state.camera.x + 60, y: (WALK_BAND.minY + WALK_BAND.maxY) / 2, z: 0 };
  h.dead = false; h.removeIn = -1;
  state.stage.heroDead = false;
}

// src/core/entities/hero.ts
import type { InputFrame } from '../types';
import type { Entity } from '../sim/entity';
import { setState } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { HERO_DATA } from '../combat/frame-data';

/** True on the frame a button goes from up to down. */
export function pressed(state: WorldState, input: InputFrame, key: keyof InputFrame): boolean {
  return input[key] && !state.prevInput[key];
}

function readAxis(input: InputFrame): { dx: number; dy: number } {
  return { dx: (input.right ? 1 : 0) - (input.left ? 1 : 0), dy: (input.down ? 1 : 0) - (input.up ? 1 : 0) };
}

export function updateHero(state: WorldState, hero: Entity, input: InputFrame): void {
  hero.stateFrame++;
  const { dx, dy } = readAxis(input);
  switch (hero.state) {
    case 'idle':
    case 'walk': {
      hero.vel.x = dx * HERO_DATA.walkSpeed.x;
      hero.vel.y = dy * HERO_DATA.walkSpeed.y;
      if (dx !== 0) hero.facing = dx > 0 ? 1 : -1;
      const moving = dx !== 0 || dy !== 0;
      if (moving && hero.state !== 'walk') setState(hero, 'walk');
      if (!moving && hero.state !== 'idle') setState(hero, 'idle');
      if (pressed(state, input, 'jump')) { setState(hero, 'jump'); hero.vel.z = HERO_DATA.jumpVz; hero.vel.y = 0; }
      break;
    }
    case 'jump': {
      // velocity frozen at takeoff (classic arcade jump)
      if (hero.stateFrame > 1 && hero.pos.z === 0) {
        setState(hero, dx !== 0 || dy !== 0 ? 'walk' : 'idle');
      }
      break;
    }
    default:
      break;
  }
}

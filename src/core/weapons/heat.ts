// src/core/weapons/heat.ts
import type { Entity } from '../sim/entity';
import type { WorldState } from '../sim/state';
import { emit } from '../sim/state';

export const WEAPON_HEAT = { cannon: 6, blade: 8 } as const;

export function useWeapon(state: WorldState, hero: Entity): 'used' | 'broke' | 'none' {
  if (!hero.weapon) return 'none';
  hero.weapon.heat -= 1;
  if (hero.weapon.heat > 0) return 'used';
  emit(state, { type: 'weaponBreak', kind: hero.weapon.kind, x: hero.pos.x, y: hero.pos.y - 40 });
  emit(state, { type: 'sfx', id: 'weapon_break' });
  state.shake = { frames: 1, px: 1 };
  hero.weapon = null;
  return 'broke';
}

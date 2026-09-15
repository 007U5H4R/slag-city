// test/core/weapons/heat.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { useWeapon, WEAPON_HEAT } from '@core/weapons/heat';

describe('weapon heat', () => {
  it('cannon breaks on exactly the 6th use, blade on the 8th', () => {
    for (const kind of ['cannon', 'blade'] as const) {
      const w = createWorld(1); const h = heroOf(w);
      h.weapon = { kind, heat: WEAPON_HEAT[kind] };
      const results: string[] = [];
      for (let i = 0; i < WEAPON_HEAT[kind] + 1; i++) results.push(useWeapon(w, h));
      expect(results.filter((r) => r === 'used')).toHaveLength(WEAPON_HEAT[kind] - 1);
      expect(results[WEAPON_HEAT[kind] - 1]).toBe('broke');
      expect(results[WEAPON_HEAT[kind]]).toBe('none');
      expect(h.weapon).toBeNull();
      expect(w.events.filter((e) => e.type === 'weaponBreak')).toHaveLength(1);
      expect(w.shake).toEqual({ frames: 1, px: 1 });
    }
  });
});

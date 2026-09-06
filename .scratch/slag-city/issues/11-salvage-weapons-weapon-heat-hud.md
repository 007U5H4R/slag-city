# 11 — Salvage weapons + weapon-heat HUD

**What to build:** Standing over a dropped weapon and pressing Attack picks it up; the arm-cannon fires six shots then overheats and breaks in sparks, the blade-limb swings eight times then breaks; a knockdown drops whatever the hero holds; a bottom-left heat bar counts remaining uses and flashes on the last one.

**Blocked by:** 07, 09, 10

**Status:** ready-for-agent

- [ ] Hero weaponAttack state with distinct frame data for cannon (ranged projectile) and blade (melee)
- [ ] Heat counters: cannon breaks after shot 6, blade after hit 8; break spawns a spark effect and removes the weapon
- [ ] Knockdown drops the held weapon as a pickup; it can be re-picked with its remaining heat
- [ ] Weapon-heat bar appears only while holding a weapon, uses the reserved cyan→white slots, flashes red + 1-frame shake on the final use
- [ ] Vitest: breaks at exactly 6 / 8; drop-on-knockdown preserves remaining heat


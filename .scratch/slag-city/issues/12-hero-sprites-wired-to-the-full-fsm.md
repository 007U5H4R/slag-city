# 12 — Hero sprites wired to the full FSM

**What to build:** Every hero action from tickets 05, 07 and 11 plays on real generated frames instead of boxes, quantised to the master palette. **Human gate:** spends credits.

**Blocked by:** 04, 07

**Status:** ready-for-agent

- [ ] AutoSprite sheets for idle, jump, combo2, combo3, grab, throw, hurt, knockdown, getup, jump-attack, weapon-swing, cannon-fire, special (walk and attack1 reuse 03)
- [ ] All sheets through build-atlas against `palette.json`; frame origins aligned so the hero's feet do not slide between states
- [ ] Hitbox / hurtbox rects in the frame-data table re-checked against the real frames
- [ ] Every generation logged in `LICENSES.md`
- [ ] Owner play-tests and signs off the hero's look in motion


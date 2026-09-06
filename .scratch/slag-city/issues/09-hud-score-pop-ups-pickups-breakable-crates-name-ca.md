# 09 — HUD, score pop-ups, pickups + breakable crates, name-cards

**What to build:** The top strip shows health, a six-digit score and the credits counter on reserved-palette plates; hitting things pops score numbers; crates break open to drop a lunch pail (health) or scrap gears (points); the first appearance of each enemy type slams a name-card across the screen.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] HUD elements sit on whole-pixel, 8-px-grid positions in a 16-px top band and use only the reserved UI-chrome / HUD-state palette slots
- [ ] Health bar shifts green → amber → red by fill level; bar length is the primary cue
- [ ] Score pop-ups spawn at the hit point and rise for a fixed frame count
- [ ] Breakable crate entity; lunch pail restores health, scrap gear adds points; both are walk-over pickups
- [ ] Name-card: slides in at constant velocity over 6 frames, holds 24, exits over 4; fires once per enemy type per game
- [ ] Vitest: score arithmetic, health clamp, name-card once-per-type rule


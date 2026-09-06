# 14 — Stage 1 layout: three sections, scroll-locks, spawn tables, hazards, camera

**What to build:** The hero walks the full Foundry District: Foundry Gates → Conveyor Floor (belts push, molten channel knocks down, chain hoists) → Furnace Hall (telegraphed ladle pours, catwalks) → the boss door, with scroll-locked fights from data tables, and a competent run takes 6–8 minutes. Backgrounds beyond section 1 may be flat placeholders.

**Blocked by:** 08, 10, 11

**Status:** ready-for-agent

- [ ] Camera scrolls on x, locks at fight points, releases when the spawn table for that lock is cleared
- [ ] Spawn tables for all three sections match `Solution-PRD.md` §4 (counts / types per fight; first feral from a wall vent in section 2; two ferals at once in section 3)
- [ ] Conveyor belts push entities along x while inside their y-band; the molten channel knocks down anything touching it from any side
- [ ] Ladle pours show a visible tell for a fixed frame count before the damage frames
- [ ] Two timed runs by the owner land between 6 and 8 minutes to the boss door
- [ ] Vitest: scroll-lock release condition; belt push; channel knockdown


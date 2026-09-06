# 10 — Feral machine (neutral hazard) + arm-cannon drop

**What to build:** A feral devil-machine bursts from a wall vent and pounces on the nearest body — hero or gang — damaging whoever it lands on; both sides can kill it, and it drops an arm-cannon when it dies.

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] Targets the nearest body by distance with no faction preference; retargets when its target dies
- [ ] Pounce has telegraph frames and a hitbox that damages gang and hero alike
- [ ] Gang AI treats the feral as a threat (it can be knocked back / killed by gang attacks)
- [ ] On death spawns an arm-cannon pickup entity (consumed by 11)
- [ ] Vitest: nearest-body targeting is side-agnostic; gang damage kills it; drop spawns exactly once


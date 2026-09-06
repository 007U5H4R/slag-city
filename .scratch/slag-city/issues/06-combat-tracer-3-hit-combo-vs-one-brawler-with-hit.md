# 06 — Combat tracer: 3-hit combo vs one brawler, with hit-feel

**What to build:** The hero fights one brawler with a three-hit combo; hits land with hitstop, screen shake, a white flash and a launch on the third hit; the brawler is hurt, knocked down and gets up invulnerable. This is the first "does it feel like 1993?" read, on boxes.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Attack1→2→3 chain with an input buffer; timings and hitbox rects come from the frame-data table, not code
- [ ] Hit rule: hitbox/hurtbox overlap in x/z **and** |Δy| ≤ 8 px — unit-tested at the boundary
- [ ] Hitstop 3 / 5 / 8 frames (light / heavy / launch), 2-px shake on heavy, 2-frame white flash on the victim, pushback — all from one hit-feel config
- [ ] Brawler FSM: idle / approach / attack / hurt / knockdown / getup (invulnerable); it can hit the hero back
- [ ] Vitest: hit 3 launches; hitstop durations; getup invulnerability
- [ ] Debug overlay toggles hitbox / hurtbox rendering


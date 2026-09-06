# 08 — Gang trio + attacker-ticket AI

**What to build:** Three gang types fight the hero as a group — brawler, fast low-HP knife, and a heavy with super-armour on wind-up — and at most two ever attack at once while the rest circle at distance.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Knife and heavy FSMs added beside the brawler with distinct speed / HP / damage from data
- [ ] Heavy ignores hitstun during its wind-up frames but still takes damage
- [ ] Group AI hands out at most two attacker tickets; others hold a ring position and rotate in when a ticket frees
- [ ] Vitest: ≤2 attackers at any tick across a 5-enemy fight; ticket released on knockdown / death
- [ ] Palette-swap hook per gang instance is in place (used by 13)


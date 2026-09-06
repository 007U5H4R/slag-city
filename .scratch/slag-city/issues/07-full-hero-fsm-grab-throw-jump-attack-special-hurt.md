# 07 — Full hero FSM: grab→throw, jump attack, special, hurt / knockdown / getup

**What to build:** The hero has the complete 90s move-set: walking into a stunned enemy grabs, then throws; a jump attack; a health-cost crowd-clearing special; and the hero's own hurt → knockdown → invulnerable getup → dead path.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] Grab triggers automatically on walking into a stunned enemy; Attack throws, the thrown enemy knocks down others it hits
- [ ] Jump attack has its own frame data and hitbox
- [ ] Special costs health, hits all enemies in range, cannot be used at ≤ its cost
- [ ] Hero hurt / knockdown / getup mirror the enemy path; health 0 → dead state, which the shell can observe
- [ ] Vitest covers grab conditions, special health cost and the dead transition
- [ ] All states remain data-driven from the frame-data table


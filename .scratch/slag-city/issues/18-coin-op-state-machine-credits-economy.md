# 18 — Coin-op state machine + credits economy

**What to build:** The game behaves like a cabinet: it boots to an attract title, coin (5 / Select) adds a credit with a counter flash, Start consumes one and begins play, death shows a 10-second continue countdown that resumes in place on a coin, and running out goes to Game Over.

**Blocked by:** 09, 14

**Status:** ready-for-agent

- [ ] Screen states BOOT → ATTRACT → COIN → PLAY → CONTINUE → PLAY | GAME OVER implemented as an explicit machine outside the sim
- [ ] Unlimited coin inserts; Start requires ≥1 credit; one life per credit
- [ ] Continue overlay: dimmed frame, hero's knockdown pose, countdown digit, "INSERT COIN TO CONTINUE"; coin resumes at the current scroll-lock; 0 → Game Over
- [ ] "INSERT COIN" / "PRESS START" hard-blink at ~1.5 Hz with no fade
- [ ] Credits used this game are tracked for the 1CC flag
- [ ] Vitest: credit arithmetic, continue resume, game-over path


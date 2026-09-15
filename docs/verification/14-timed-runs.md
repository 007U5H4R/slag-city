# Ticket 14.4 — Step 3: timed runs (pacing gate)

Target: a competent run of Stage 1 (start → boss door) takes **6–8 minutes**. Tune **only** STAGE1
(enemy counts, spawn delays, lock positions) to land in range — **never** enemy stats. Each tuning change
re-runs `npm test` (the data test pins the PRD counts; if a change violates a count, the PRD wins and the
delay/position is what moves).

## Machine completability probe (not the real playtest — a lower bound)

An automated god-mode auto-player (walk to nearest enemy → burst-attack in range → advance; HP topped each
frame so it cannot die) was driven start → boss door via CDP @1024px to **prove the stage is completable
end-to-end** and give a length floor.

- ✅ **All 7 scroll-locks cleared** (`lockCleared: [true ×7]`), boss door reached (`bossDoorReached: true`,
  camera held at 3616). No softlock; ferals do not break wave-clearing.
- ⏱ **Completion: frame 7489 ≈ 2:05** (60 fps). This is a strong **lower bound** — the auto-player never
  dies, never retreats, and attacks optimally. A real player (deaths/retries, retreats, hurt/knockdown
  recovery, mistimed hits) runs materially longer.
- Zero console errors. End-state screenshot: `docs/verification/14-autoplay-end.png` (SCORE 026600).

**Read:** the god-mode floor (~2 min) sitting well under the 6–8 min target means real play may still land
short. The owner's real runs below decide it; if they come in under ~6 min, add counts/delays (not stats).

## Owner timed runs (⛔ to be filled by the owner)

| Run | Time (start → boss door) | Deaths | Where pacing sagged / spiked |
|-----|--------------------------|--------|------------------------------|
| 1   | _pending_                | _._    | _._                          |
| 2   | _pending_                | _._    | _._                          |

Then the orchestrator tunes STAGE1 and re-runs until two runs land in 6–8 min.

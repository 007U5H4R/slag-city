# 19 — Hi-scores (IndexedDB) + AAA entry + attract loop with replay

**What to build:** Game Over on a top-10 score opens a three-letter initials entry; the table persists in IndexedDB across reloads with a 1CC marker; the attract mode cycles title → a recorded gameplay replay → the hi-score table until a coin drops.

**Blocked by:** 18

**Status:** ready-for-agent

- [ ] Generic key-value store over IndexedDB (ported from the old project's `openDB` pattern) with an in-memory fallback when unavailable
- [ ] Row shape `{ initials, score, credits, stage, date: ISO-8601 }`; seeded default table; sorted top-10; credits = 1 shows the 1CC flag
- [ ] AAA entry: up/down cycles letters, Attack confirms and advances; the new row is highlighted in the score/pickup gold
- [ ] Attract replay is a committed input log played through the sim; it is also a replay-golden regression test
- [ ] ≈500 ms crossfade between attract segments; any coin interrupts immediately
- [ ] Vitest: ordering, top-10 cut, 1CC flag, store fallback


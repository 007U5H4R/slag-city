# 01 — Scaffold + core/adapter boundary + CI baseline

**What to build:** Running `npm run dev` opens a page showing a blank 384×224 canvas integer-scaled inside a dark room. Typecheck, lint, unit tests and build all pass locally and in CI on every push.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Phaser 3 + Vite + TypeScript project boots to a 384×224 canvas at the largest integer scale that fits the viewport, centred, re-computed on resize
- [ ] A lint rule forbids any Phaser import inside the pure-TS core; a deliberate violation fails lint
- [ ] Vitest runs a trivial core test in Node without Phaser
- [ ] CI workflow runs typecheck + lint + Vitest + build and is green
- [ ] Node/npm caches and any temp output are configured to live on the E Drive, not the internal disk


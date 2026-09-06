# 23 — Playwright smoke + full CI

**What to build:** An automated browser test proves the built game loads, scales to an integer, accepts a coin and start, shows the hero, and logs zero console errors — run in CI on every push against `vite preview`.

**Blocked by:** 19, 20

**Status:** ready-for-agent

- [ ] Playwright installed with browsers and temp on the E Drive
- [ ] Smoke: page loads → canvas dimensions are an integer multiple of 384×224 → press 5, Enter → hero sprite visible → no console errors
- [ ] CI job runs typecheck, lint, Vitest (incl. replay goldens), build, then the smoke
- [ ] Smoke is parameterised by base URL so 24 can reuse it against production


# Deploy readiness — SLAG CITY (ticket 24)

**⛔ GATE: the owner must authorise the GitHub push / deploy. Nothing here has been pushed or deployed.**
Prepared 2026-09-15 (owner AFK-delegated build; explicit instruction: "wait for my permission before deploying it to GitHub").

## State
- Repo is **local-only**, branch `build/stage-1`, **no git remote**, nothing pushed (owner chose local-only through ticket 24).
- Build is clean: `npm run check` GREEN (128 unit tests) + `npm run e2e` (Playwright smoke) passes locally.
- CI (`.github/workflows/ci.yml`) has `check` + `e2e` jobs but has **never run** (no remote/push yet).

## To deploy (once the owner authorises)
1. **Push:** add a GitHub remote, push `build/stage-1` (or merge to `main` per `finishing-a-development-branch`), confirm both CI jobs (check + e2e) go green.
2. **Host:** static Vite build. `npm run build` → `dist/`. Vercel (framework: Vite, output `dist`) or itch.io (zip `dist`, HTML5 game, fullscreen). No server/env/secrets needed (pure client + IndexedDB).
3. **OG / link preview (MANDATORY web-deliverable):** `index.html` carries OG + Twitter Card tags with a **`DEPLOY_ORIGIN` placeholder** — replace both `https://DEPLOY_ORIGIN/og.png` with the real https origin, then verify with **LinkedIn Post Inspector** + **opengraph.xyz**. `public/og.png` (1200×630) is committed.
4. **Post-deploy smoke:** open the deployed URL, confirm it boots to ATTRACT, coin→start→PLAY works, hero renders, console clean; optionally run `BASE_URL=<prod-url> npm run e2e:prod`.
5. **Mobile/responsive gate (mandatory):** the game requires desktop (≤768px shows the "desktop required" card by design — ticket 20) — verify the gate card at ~375px and the cabinet at ≥769px; no horizontal scroll.

## Title / trademark (blocking for a public release)
See `docs/legal/title-check.md` — **SLAG CITY** is the working title; the USPTO/EUIPO clearance is an open **owner gate**. Do not publish under a name with a live class-9/41 mark.

## Known gaps to weigh before a public launch (not blockers for an internal/preview deploy)
- **Audio (ticket 22):** not implemented — the game is silent (the coin-op machine already emits sfx cues; the AudioAdapter + licensed CC0 packs are pending; ⛔ owner licence gate).
- **Backgrounds (tickets 04/17):** sections still render the flat-tint Parallax placeholder (no real parallax art yet).
- **Sprite polish:** boss (remaining actions + phase-2 recolor), feral (non-core states), hero jump/grab/throw/special, and gang variant recolor atlases still fall back (hold-frame / stroke-tint). See LEDGER "Phase C+".
- **14.4 Step-3 timed-run playtest:** owner + stopwatch, still pending.

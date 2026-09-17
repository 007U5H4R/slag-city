# Mixpanel — SLAG CITY analytics & funnel

> **Status (2026-09-17):** Project **Slag-City** (id `4064493`) is on Mixpanel's **EU** data region, so the code sends to `https://api-eu.mixpanel.com` (US host silently drops EU-project events). The **"SLAG CITY — Player Funnel"** funnel (all 4 steps, Uniques, 1-day window) is already built and lives on the **SLAG CITY** board. Remaining owner step: set `VITE_MIXPANEL_TOKEN` in Vercel (below). A couple of `setup-seed-001` seed events exist from setup — ignore them or exclude that `distinct_id`; real traffic washes them out.

## What's instrumented (code)
`src/shell/analytics.ts` sends four events; they are the funnel steps. Each fires exactly once at its moment:

| # | Event name (verbatim) | Fires when | Where |
|---|-----------------------|-----------|-------|
| 1 | `Page Loaded`   | the page boots (landed) | `src/main.ts` |
| 2 | `Game Started`  | a fresh game begins (COIN → START; **not** a continue) | `GameScene` new-game branch |
| 3 | `Stage Cleared` | Kilvish (final boss) is defeated — carries `score` | `GameScene` bossDefeated (final) |
| 4 | `Name Recorded` | a name is saved to the hi-score board — carries `initials`, `score` | `GameScene` hi-score entry done |

Every event also carries the super-property `game: "slag-city"`.

Notes:
- **Anonymous only** — no PII. Mixpanel assigns an anonymous `distinct_id` (localStorage).
- **Do-Not-Track respected** — if the browser sends DNT, analytics stays off.
- **No token → no-op.** With no `VITE_MIXPANEL_TOKEN` the game runs identically and sends nothing.

## Turn it on (owner — one-time)
1. In Mixpanel → your project → **Settings → Project Settings**, copy the **Project Token**.
2. In Vercel → project `slag-city` → **Settings → Environment Variables**, add:
   - Name: `VITE_MIXPANEL_TOKEN`  ·  Value: `<the token>`  ·  Environments: **Production** (and Preview if you want).
3. Redeploy (any push to `main`, or "Redeploy" in Vercel). The token is read **at build time** — it is never in the repo.
4. Verify: open the live site, then Mixpanel → **Events** (live view) should show `Page Loaded` within ~30s.

## The funnel (build in Mixpanel — needs your dashboard)
I can't create the report without dashboard/API access to your account. Create it once:

**Mixpanel → Funnels → + New Funnel**, add these steps **in order**:
1. `Page Loaded`
2. `Game Started`
3. `Stage Cleared`
4. `Name Recorded`

- **Conversion window:** 1 day (a single arcade session is minutes; 1 day is comfortably generous).
- **Counting:** Uniques (unique users) — this answers "how many people landed → played → cleared → recorded."
- Save as **"SLAG CITY — Player Funnel."**

### The metric
On the saved funnel, the headline **overall conversion rate** (Page Loaded → Name Recorded) is the metric. Also useful, step-to-step:
- **Landed → Played** = `Game Started` / `Page Loaded` (did the page convince them to start?)
- **Played → Cleared** = `Stage Cleared` / `Game Started` (is the stage beatable / well-tuned?)
- **Cleared → Recorded** = `Name Recorded` / `Stage Cleared` (did winners engage with the board?)

Pin the funnel to a **Board** ("SLAG CITY") for an at-a-glance dashboard.

> Want me to create the funnel/board for you programmatically? Give me a Mixpanel **Service Account** (username + secret) and the **project id/region**, and I can script it via the Mixpanel API. Otherwise the steps above take ~2 minutes in the UI.

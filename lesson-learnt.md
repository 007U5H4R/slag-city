# Lessons learnt: Slag City

> Every lesson cites its source. Nothing here is inferred beyond those sources.
> Sources: Obsidian `Slag City/Progress.md` (cited as Progress.md:line), repo `HANDOFF.md`.

## Lessons

### L1 — Screen-fixed UI only lines up with the world at zoom 1
- **Situation:** UI drawn with `setScrollFactor(0)` clipped once the camera zoom was 2 or more. CDP inspection found the root cause. (Progress.md:44)
- **Decision/Outcome:** The UI layout was corrected for camera zoom. The bug only reproduced with a CDP recipe at a 1152x672 window (zoom 2). (Progress.md:44, Progress.md:50)
- **Lesson → Future Rule:** **Future Rule:** test Phaser UI at every zoom level the game ships with, and keep a CDP repro recipe for each one.

### L2 — Mixed sprite-sheet orientation flips the walk cycle
- **Situation:** The hero atlas mixed left- and right-facing cells, so the walk cycle flipped. (Progress.md:45)
- **Decision/Outcome:** The cells were normalised to one orientation with sharp `.flop()`. (Progress.md:45)
- **Lesson → Future Rule:** **Future Rule:** normalise atlas orientation when assets are imported, before animation code relies on it.

### L3 — Vercel ignores a push of a SHA it has already built
- **Situation:** A production deploy didn't happen, because Vercel skips a push whose SHA it has already built. (Progress.md:50)
- **Decision/Outcome:** Production needed a fresh commit or merge on main. (Progress.md:50)
- **Lesson → Future Rule:** **Future Rule:** after a production push, confirm that a new deployment was created. Don't assume one was.

### L4 — Unit tests passed, but the feature never fired in the browser
- **Situation:** Hold-to-skip passed its unit tests but never triggered in the browser, because Phaser smooths `delta`. (Progress.md:85)
- **Decision/Outcome:** The hold timer was moved to `performance.now()`. (Progress.md:85)
- **Lesson → Future Rule:** **Future Rule:** prove any time-based interaction in the real browser, not only in unit tests that use a synthetic clock.

### L5 — Analytics added about 0.5 MB to every load
- **Situation:** Mixpanel added about 0.5 MB to every page load. (Progress.md:85)
- **Decision/Outcome:** It became a lazy 125 KB chunk that loads only when a token is set. (Progress.md:85)
- **Lesson → Future Rule:** **Future Rule:** lazy-load third-party analytics and check the bundle size after adding any SDK.

### L6 — Touch detection pushed touchscreen laptops into mobile mode
- **Situation:** Touchscreen laptops were forced into the mobile mode. (Progress.md:85)
- **Decision/Outcome:** The device detection was fixed. (Progress.md:85)
- **Lesson → Future Rule:** **Future Rule:** don't treat touch support alone as a sign of a mobile device.

### L7 — A critique score can drop because the scope changed
- **Situation:** Design critique run 2 scored 22/40, against 31/40 for run 1. (Progress.md:86)
- **Decision/Outcome:** The drop came from a harsher scope, not from a regression. (Progress.md:86)
- **Lesson → Future Rule:** **Future Rule:** record the rubric and scope next to every critique score, so that runs can be compared.

### L8 — Game state after death had no floor
- **Situation:** QA saw that HP had no floor after `heroDead`. (Progress.md:23)
- **Decision/Outcome:** It was recorded as a QA observation. (Progress.md:23)
- **Lesson → Future Rule:** **Future Rule:** clamp state values at terminal states, and test the transitions after death.

### L9 — Keep the core pure and fix lint in source
- **Situation:** `eslint.config.js` is protected by a hook, and `src/core` must stay pure TypeScript. (HANDOFF.md:206, HANDOFF.md:211)
- **Decision/Outcome:** Lint issues are fixed in source. An eslint boundary rule enforces the purity of the core. (HANDOFF.md:206, HANDOFF.md:211)
- **Lesson → Future Rule:** **Future Rule:** enforce architecture boundaries with a lint rule, and never relax a protected lint config to get a build passing.

## Reusable Rules for Future Projects
- Check browser-time behaviour in the browser, not only with unit tests (L4).
- Confirm that a deploy actually happened. A push is not a deploy (L3).
- Budget the bundle cost of every third-party SDK (L5).

## Candidate Global CLAUDE.md Improvements
- "Prove it against reality" could name a specific case: an interaction driven by a timer or animation frame needs a browser check, because unit tests with a synthetic clock are not enough (L4).

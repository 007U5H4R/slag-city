# Ticket 14.4 — Stage 1 in the scene (CDP verification)

Headless Chrome + CDP @ **1024×640**, dev server `http://localhost:5173/`, driver
`/Volumes/E Drive/Dev/.scratch/slag-cdp-gate.mjs`. Input is injected at the source boundary by
overriding `GameScene.keyboard.read()` (equivalent to holding a key) because CDP `Input.dispatchKeyEvent`
does not reach Phaser's key objects under headless focus; the **sim, scroll-lock engine, spawn tables,
hazards and camera all run for real** — only the input source is stubbed.

Steps 1–2 of the plan (§14.4) are done and verified here. **Step 3 (⛔ two timed 6–8 min playthroughs
with a stopwatch) is an owner playtest** and is intentionally deferred — see the LEDGER "Ticket 14" note:
it should run *after* feral (ticket 10) exists, so pacing is tuned against the full roster, not a
feral-less stage.

## Evidence (every run: `CONSOLE_ERRORS=[]`)

| Screenshot | What it proves |
|------------|----------------|
| `14-stage-boot.png` | STAGE1 boots: `stageLoaded:true`, `stageWidth:4400`, `bossDoorX:4000`. Only the hero present at boot (no debug 5-enemy block). |
| `14-lock-engage.png` | **Live scroll-lock:** walking right reaches camX 320 → camera locks (`lockX:320`), lock-0's delayed spawn table fires (`kinds:[hero,brawler,crate,brawler]` = 2 brawlers @ delay 0/40 + the lunchpail crate), live combat (heroHp 60). Foundry-Gates dark-slate bg + parallax wall struts; hero + brawler render as sprites; HUD in Press Start 2P. |
| `14-section2-hazards.png` | **Section 2 (Conveyor Floor):** distinct blue-grey background (`sectionIndex:1`); the conveyor **belt** renders as a striped band; the **molten channel** renders as an orange glow strip. |
| `14-section3-ladle.png` | **Section 3 (Furnace Hall):** distinct molten-red background (`sectionIndex:2`); the **ladle** renders as its pour bracket + tell bar. |
| `14-boss-door.png` | **Boss-door stop:** hero pushed to x4080 but the camera holds at `3616` (= `bossDoorX 4000 − 384`), `bossDoorReached:true`. No boss yet (ticket 15). |

## Acceptance boxes (ticket 14 gate)

- [x] Stage 1 loads into the scene (replaces the debug 5-enemy block).
- [x] Three sections with visually distinct backgrounds; section index tracks the camera.
- [x] Scroll-locks engage live and spawn their delayed wave tables.
- [x] Hazards (belt / molten channel / ladle) render from STAGE1 data, frame-stepped by the sim.
- [x] Boss door stops the camera.
- [x] Zero console errors across boot, walk, combat, all three sections, and the boss door.
- [ ] **⛔ Two timed runs land in 6–8 min** — owner playtest, deferred until feral (ticket 10) exists.

## Vitest coverage (engine, from 14.1–14.3)

`npm run check` GREEN — 31 files / 95 tests, incl. lock release (`locks.test`), belt push + channel
knockdown + ladle pour timing (`hazards.test`), and the PRD section/hazard data (`stage1-data.test`).

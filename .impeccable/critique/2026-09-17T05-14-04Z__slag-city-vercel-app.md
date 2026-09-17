---
target: "https://slag-city.vercel.app (the product)"
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-17T05-14-04Z
slug: slag-city-vercel-app
---
Method: dual-agent (A: design-review · B: detector+evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Health/score/credit/boss-HP all clear; no stage-progress sense, weapon-heat bar never taught |
| 2 | Match System / Real World | 4 | Fluent coin-op idiom: INSERT COIN, CREDIT, CONTINUE, AAA, 1CC, STAGE CLEAR |
| 3 | User Control and Freedom | 2 | 8-slide lore wall + 4–6-line boss taunts, sim frozen, **no skip**; no pause |
| 4 | Consistency and Standards | 3 | Strong internal system; prompt copy drifts ("NAME" vs "INITIALS", 4 prompt variants) |
| 5 | Error Prevention | 3 | Viewport gate, texture-exists guards degrade gracefully, SERVICE screen |
| 6 | Recognition Rather Than Recall | 3 | CONTROLS panel on attract only — vanishes in PLAY; "SP"/SPECIAL/1CC unexplained |
| 7 | Flexibility and Efficiency | 3 | Keyboard + gamepad + touch, WASD/arrows, CRT/volume toggles; no difficulty/skip |
| 8 | Aesthetic and Minimalist Design | 4 | One focal element per screen, disciplined HUD, elegant restraint |
| 9 | Error Recovery | 3 | CONTINUE beat is well-designed; GAME OVER offers no path forward |
| 10 | Help and Documentation | 3 | Controls panel + inline hints; arcade-normal gaps |
| **Total** | | **31/40** | **Good** |

## Design Specificity Verdict

**Authored for this product — with one real identity fracture.**

**Design review:** This is not a category-interchangeable brawler. The occult-industrial foundry concept is committed at every layer — molten "SLAG CITY" marquee under a warm lamp-glow, furnace channels bleeding orange through the parallax, a sledgehammer hero, the masked devil-mech Kilvish, and disciplined palette reservation (near-black + brass for chrome, molten orange for the world, cyan held back *only* for the HUD, magenta reserved for boss phase-2). The "Last Signal / HARVEST / VAELOR" narrative is bespoke and coherent. **But** almost all in-canvas text renders in **Roboto Mono inside glowing cyan sci-fi frames** — which reads as *2015 indie-retro*, not *1993 Final Fight/Streets of Rage*. The **art** specificity is ~9/10; the **UI-chrome + type** specificity is ~6/10 — a well-made sci-fi HUD cosplaying a foundry cabinet. This directly contradicts the project's own `Design.md` §2.2 ("No modern web fonts; two bitmap/pixel faces").

**Deterministic scan:** The bundled detector ran on the only real DOM (`index.html`, `src/styles/room.css`) and returned **zero findings, exit 0, both files** — no false positives because nothing fired. Critically, this is *shallow* coverage: SLAG CITY is a `<canvas>` game, so the HUD, menus, dialogue, sprites, and every screen the review judges are painted in-canvas and are **invisible to a static markup scanner**. A clean detector validates the cabinet frame, not the game. The meaningful signal here is the design review, not the detector.

**Visual overlays:** none injected. For a canvas game the DOM overlay can only highlight the cabinet chrome, not the in-canvas UI that matters, so an overlay would mislead; evidence came from the CLI scan (clean) plus foreground-rendered screenshots. No user-visible overlay is available for this target — that's expected for a canvas product, not a degraded run.

## Overall Impression

This is a genuinely well-crafted arcade game with a strong, specific world and disciplined visual restraint — it earns its 31/40. The single biggest opportunity is **reconciling the shipped UI with its own signed design intent**: the game *says* 1993 bitmap cabinet but *renders* 2015 sci-fi mono, and that one unresolved decision is what separates "good indie brawler" from "indistinguishable from a real coin-op." After that, the highest-leverage fix is the **GAME OVER screen** — the most commercially important screen in any coin-op, and currently the least-designed one.

## What's Working

1. **The `ScifiFrame` system** — procedurally drawn cut-corner panels with layered cyan bloom (two faint wide passes → bright border → corner brackets → tick accents → nodes), reserved so chrome colors never bleed into world art. It's the best craft decision in the project: instant figure-ground separation, and every menu feels like one coherent machine.
2. **HUD engineering** — full-width teal strip; a segmented health bar where **length is the primary cue and color secondary** (genuinely colorblind-safe); a heavy 4px stroke + drop shadow so SCORE/CREDIT survive the busy furnace parallax; the boss bar mirrors the HUD and recolors to magenta in phase 2, so escalation is signaled by recolor, not a new asset. Both agents corroborate the HUD is the strongest-executed surface.
3. **The marquee + cabinet framing** — molten "SLAG CITY" lettering, warm marquee glow, brass bezel, vignette. The attract screen reads as a physical machine in a dark room. (Markup confirms the social layer matches this care: title, lang, viewport, full Open Graph + Twitter with an absolute 1200×630 HTTPS image.)

## Priority Issues

**[P1] GAME OVER is an emotional and commercial dead-end.**
- **Why it matters:** the re-coin moment is the entire economic engine of a coin-op. Currently GAME OVER is just red text in the standard teal box — no final score, no rank teaser, and **no INSERT COIN / PRESS START prompt** — so the player gets neither closure nor a reason to re-insert. It's also inconsistent with STAGE CLEAR, which *does* offer a next step.
- **Fix:** add the final-score line + a blinking INSERT COIN/PRESS START prompt, and route quickly into the hi-score table so the player sees where they'd rank. Turn the valley into the sales pitch.
- **Suggested command:** `/impeccable harden`

**[P1] The build silently contradicts its own signed design on typography.**
- **Why it matters:** `Design.md` §2.2 mandates bitmap/pixel fonts; the shipped game renders HUD, story, dialogue, hi-score table, and name entry in Roboto Mono (crisp, anti-aliased). Assessment B confirms `index.html` loads Roboto Mono via Google Fonts. This is the single biggest force pulling the game toward generic indie-retro and away from its stated benchmark — and spec-vs-implementation disagreeing is a governance problem, not just a taste one.
- **Fix:** pick a source of truth. Either commit the in-canvas gameplay HUD + name entry to a real bitmap face, or formally revise `Design.md` to adopt the modern-mono direction. Don't leave them contradicting.
- **Suggested command:** `/impeccable typeset` (then `/impeccable document` to re-sync DESIGN.md)

**[P2] Reading load fights arcade pacing and the "sell it in 15s" goal.**
- **Why it matters:** a fresh PLAY opens with 8 forced intro slides, and boss taunts run 4–6 lines — one ATTACK press per line, sim frozen, no skip (~13+ mandatory presses of lore before/between fights). Coin-op players don't read; this contradicts `Design.md`'s own "ATTRACT must sell the game in under 15 seconds" and its "arcade snap" motion language.
- **Fix:** add hold-ATTACK-to-skip (remember-seen so replays auto-shorten); consider trimming the intro to 3–4 slides while keeping the full arc for players who linger.
- **Suggested command:** `/impeccable distill`

**[P2] Every beat wears the same teal box, so the peaks don't feel like peaks.**
- **Why it matters:** CONTINUE, GAME OVER, STAGE CLEAR, name entry, story, and dialogue are visually near-identical — differing only in text color/copy. The emotional high (boss reveal, STAGE CLEAR) and the low (GAME OVER) read at the same visual temperature, flattening the whole journey into one register. The name-card "slam-in" the design promised isn't evident.
- **Fix:** let the frame carry emotion — GAME OVER in a cracked/red-edged frame, STAGE CLEAR with a gold frame + burst — and verify the boss-entrance name-card slam actually fires.
- **Suggested command:** `/impeccable delight`

**[P2/P3] Mobile controls: cryptic labels, low contrast, undersized COIN/START.**
- **Why it matters:** touch buttons read `ATK / JUMP / SP` — "SP" is unguessable; the D-pad is a translucent teal ring with faint arrows; all controls are semi-transparent over the bright furnace parallax and wash out for a one-handed player. Assessment B measured it precisely: D-pad (132px), Attack (78px), Jump (64px), Special (56px) all clear 44px, but **COIN/START pills are ~26px tall — below the 44px minimum**. (Safe-area insets and dvw/dvh aspect-fit are handled well.)
- **Fix:** spell SPECIAL or add a glyph; raise idle/pressed contrast; enlarge COIN/START to ≥44px; show a one-time touch legend on first mobile launch.
- **Suggested command:** `/impeccable adapt`

## Persona Red Flags

**Jordan (confused first-timer):** hit with an 8-slide lore wall before touching the hero; SPECIAL, the weapon-heat bar, `1CC`, and `SP` are never explained; the CONTROLS panel exists only on attract and vanishes once PLAY starts — nothing recallable mid-fight.

**Casey (distracted, one-handed mobile):** `SP` is meaningless; translucent controls wash out over the furnace background; **portrait mode shows only "Rotate to landscape" on pure black** — a first-time visitor can't even glimpse the game to get curious before being told to rotate; COIN/START are ~26px pills pinned top-right, far from the thumbs.

**Sam (accessibility / contrast / keyboard):** several text tokens fail contrast — the DIM body/prompt color `#8a7f6a` on near-black, inactive slide pips `#1b5a5e` on black (near-invisible), and red boss name `#ff3b6b` on dark teal (borderline). `user-scalable=no` disables pinch-zoom. Credits where due: the length-primary health bar is colorblind-safe, and keyboard/gamepad coverage is complete. No screen-reader affordance for gameplay — inherent to a canvas game, not a trivially fixable markup gap.

**Riley (stress / edge cases):** rapid ATTACK-mashing can blow through dialogue faster than it's readable (no visible per-line lockout); "ENTER YOUR NAME" (STAGE CLEAR) vs "ENTER YOUR INITIALS" (entry) mismatch; verify the name-less boss HP bar isn't double-labeled where a "KILVISH" name-card overlaps; the continue-countdown-hits-zero-as-a-coin-lands timing edge.

## Minor Observations

- **Missing favicon & theme-color** (Assessment B): `index.html` declares no `<link rel="icon">` / `apple-touch-icon` and no `theme-color` meta — small but real for a shareable web product.
- Standardize the advance-prompt copy (4 variants today) and the NAME/INITIALS wording.
- CONTROLS line 2 crams core combat keys and dev utilities (CRT, volume) at equal weight — separate primary controls from utilities.
- `setResolution(4)` makes UI text *too* crisp for a CRT cabinet — confirm the CRT phosphor-bleed pass actually touches HUD/menu text.
- The `19-table.png` hi-score capture shows an older bitmap look while current `HiScoreTable.ts` is Roboto Mono — confirm which ships (ties into the P1 type decision).
- Vignette, bezel, and marquee glow are nicely restrained — good taste there.

## Questions to Consider

1. If ATTRACT must sell the game in 15 seconds, why does a fresh PLAY open with an 8-slide lore wall before the player ever swings the hammer?
2. `Design.md` forbids modern web fonts; the shipped game is mostly Roboto Mono. **Which is the real design — the doc or the build?** Reconcile before anyone calls the stage "done."
3. GAME OVER is the most commercially important screen in a coin-op. Why is it the least-designed one?
4. Is the glowing-cyan frame actually 1993, or a 2010s sci-fi *impression* of 1993 (Final Fight/SoR menus were brass, stone, and hard bitmap)? Deliberate reinterpretation, or drift?

---
target: "https://slag-city.vercel.app (whole product, run 2)"
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-09-17T06-24-44Z
slug: slag-city-vercel-app
---
Method: dual-agent (A: design-review · B: detector+evidence), whole product, both barred from the previous snapshot. B reviewed HEAD 9b2e75d — before the f50b363 fixes; items it raised that are now fixed are marked ✅.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Hold-to-skip shows no progress for its 600 ms; C/volume give no feedback; START with 0 credits is silent; the only instruction on screen blinks off half the time |
| 2 | Match System / Real World | 2 | On a web page "INSERT COIN" reads as a paywall — nothing says it's key 5 and free; prompts say "PRESS ATTACK" (key is J, phone button says ATK); phones see a keyboard legend |
| 3 | User Control and Freedom | 1 | No player pause, no quit-to-title, no back-step in initials entry, boss dialogue unskippable, intro replays every fresh game |
| 4 | Consistency and Standards | 2 | Three type systems (hud8 bitmap, display16 on brass, Roboto Mono in cyan); "THE FOREMAN" name-card fires while the dialogue says GRIST; CONTINUE says INSERT COIN even with credits banked |
| 5 | Error Prevention | 3 | Strong: GAME OVER input floor, hold-skip arming, d-pad deadzone. Weak: third initial commits irrevocably |
| 6 | Recognition Rather Than Recall | 2 | Button map exists only on a ~5 s attract segment; what SPECIAL does is never stated |
| 7 | Flexibility and Efficiency | 2 | Skip/gamepad good; no alternate binds (Space captured and dead), no remap, arrows+JKL crosses hands |
| 8 | Aesthetic and Minimalist Design | 3 | Lean HUD, one job per screen; real collisions (CTA under the Controls panel, intro prompt on the frame border), logo three times on intro slide 1 |
| 9 | Error Recovery | 2 | SERVICE screen honest but was keyboard-only (✅ tap-to-retry shipped); font fallback silent |
| 10 | Help and Documentation | 2 | One legend, desktop-only content, shown before the player cares and gone when they do |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict — split: the world is authored, the UI chrome is interchangeable

**Design review:** The foundry world, the molten-chrome logo and the writing ("It was a supply chain — and Earth was only one link") could not be mistaken for another game. The `ScifiFrame` — cut corners, cyan glow, brackets, tick marks, Roboto Mono — is the stock sci-fi HUD kit, and the problem is not the neo-retro brief (accepted) but that one component is stamped unchanged onto eight screens: the controls legend, a dying warlord's confession, GAME OVER and the hi-score table all wear the same four ticks, and mood is carried only by a title colour swap. The frame never picks up anything from the world it frames — no heat, rust or molten orange — though the logo beside it is all three. The authored part and the kit never meet.

**Deterministic scan:** detector clean on `index.html` and `room.css` (exit 0, `[]`, no false positives to adjudicate) — and again that says little: it cannot see anything drawn in the canvas or injected at runtime. B's manual evidence carried the weight: WCAG ratios computed per colour, touch-target geometry, stacking order, text sizes.

**Visual overlays:** none — a DOM overlay cannot mark in-canvas UI. Expected for a canvas product.

## Overall Impression
The game underneath is carefully made — freeze discipline, input hygiene and HUD legibility are genuinely good — but the product around it under-serves a first-time web visitor: the one line that converts (INSERT COIN) is cropped by a panel and never says "press 5, it's free", the player cannot pause or leave, and mobile ships the least readable text on the platform that most needs it. Biggest opportunity: fix the front door (attract CTA) and give the player a pause panel that doubles as the help screen.

## What's Working
1. **Freeze discipline and input hygiene** — sim freezes for every reading beat; hold-skip arms only after a release seen on-screen and runs on wall-clock time; GAME OVER ignores mashed inputs for 45 frames. Invisible when right, infuriating when missing.
2. **HUD legibility by construction** — one full-width strip, length-first health bar, heavy stroke on 12 px readouts; reads instantly against the busiest background. B's numbers back it: SCORE 8.2–12.1:1, CREDIT 9.7–14.4:1.
3. **The script is paced, not just written** — hand-wrapped lines, HARVEST held for the last line of its slide, boss exchanges that lengthen with the stakes, red reserved for the entity and the signal.

## Priority Issues

**[P1] The primary call-to-action is physically hidden and semantically opaque.** INSERT COIN / PRESS START is an 8 px unplated bitmap line at y=184; the Controls frame spans y=102–182 plus glow and visibly crops it in today's `01-attract.png`/`02-coin.png`. It never says `5` and never says free. This is the product's entire conversion step. *Fix:* drop the CRT/VOLUME row from the attract legend, put COIN/START first, move the prompt to y≈204 on a dark plate in the UI font at 11–12 px, reword to "PRESS 5 — INSERT COIN (FREE PLAY)"; on touch "TAP COIN". *Command:* `/impeccable layout` + `/impeccable clarify`

**[P1] No pause, no exit, no in-game help.** Only involuntary pauses exist (hidden tab, unplugged pad, and now portrait). Boss dialogue can't be skipped; the button map is unreachable once play starts. *Fix:* bind P/Esc, gamepad Start in PLAY and a small mobile `II` pill to the existing `pause()`; render pause as a ScifiFrame containing the controls legend — closes heuristics 3, 6 and 10 with one panel. Persist a `seenStory` flag to collapse the intro and allow dialogue skip on later runs. *Command:* `/impeccable harden`

**[P1] Mobile is a port of the layout, not of the experience.** (a) framebuffer is k=1 then CSS-stretched, so 8–9 px Roboto Mono is rasterised tiny and blown up — B: 8 px text is 13.4 CSS px at 812×375 and 11.4 at 568×320; (b) the legend on a phone lists keyboard keys, prompts say ATTACK beside a button labelled ATK; (c) controls sit on the playfield while ~85 px pillarbox bands sit empty — the d-pad covers the hero's spawn, and B derives the coin row overlapping the CREDIT readout and boss bar at 667×375, with the dialogue prompt under the ATK button; (d) ✅ CRT on mobile — fixed in cae3289; (e) rotate card is an unbranded dead end; (f) `#touch` is aria-hidden but holds live buttons. *Fix:* render mobile at k=2–4 and let CSS downscale; branch Controls + prompts on the mobile flag; anchor controls into the pillarbox bands; show COIN/START only on ATTRACT/COIN/CONTINUE/GAME OVER; logo on the rotate card. *Command:* `/impeccable adapt`

**[P2] The cabinet costs a full scale step on laptops.** Chrome is 224 px tall, so ×3 needs innerHeight ≥ 896; a 1440×900 or 1366×768 laptop gets ×2 (B: under 672 px of viewport it's ×1 — 8 px text at 8 CSS px). Without the marquee and panel the same window fits a step larger. What the player gets in exchange is a flat gradient and an empty strip. *Fix:* compute k with and without marquee+panel and drop them when that gains a step; add F for fullscreen. *Command:* `/impeccable layout`

**[P2] Seams, stale copy and small honesty defects.** Intro prompt at y=204 sits on the frame border at y=208 (visible in `03`/`04`); "THE FOREMAN" name-card vs GRIST/SLAGJAW/KILVISH; CONTINUE ignores banked credits; boss bar is nameless and uses the hero's colours; speaker label is literally `HERO`; a story "chapter" ends on STAGE CLEAR!; the desktop gate still says "this cabinet doesn't run on phones"; meta/OG copy still says "1993-style". B adds: BossDialogue prompt `#8a7f6a` is 4.18:1 (fails 4.5), inactive pips 2.7–3.4:1 and state is colour-only, green vs amber health differ by 1.05 in luminance (length carries it, by design), weight 400 is requested but only 500/700 are loaded, no `prefers-reduced-motion` anywhere, no manifest/apple-touch-icon behind the web-app-capable metas, `#room[hidden]` is defeated by `display:grid`. *Command:* `/impeccable polish`

## Persona Red Flags
**Jordan (first-timer):** reads a half-hidden INSERT COIN, has no coin, clicks the canvas — nothing; Space is captured and dead; Enter is silent at 0 credits; must parse line 3 of a legend to find `5`. At CONTINUE a 10 s clock says INSERT COIN with no hint it's free.
**Casey (one-handed mobile):** two-thumb layout, no pause — any interruption is a death (portrait now pauses ✅); story advances only via ATK at far bottom-right, tapping the text does nothing; COIN/START are the furthest reach on the device and they're what the CONTINUE clock demands.
**Sam (accessibility):** zoom disabled; canvas has no accessible name; aria-hidden wraps focusable buttons that ignore Enter/Space; the only instructions blink at 1.5 Hz; no reduced-motion/flash option for the scene-cut flash, screen shake or laser flicker; no remapping.
**Riley (stress):** 769–1151 px widths leave a 384 px canvas in a 1000 px window; initials entry has no hold-repeat (Z is 25 presses), no back and no timeout; narrowing a desktop window across the gate hides the room but the sim keeps running; if Roboto Mono is blocked the hand-wrapped 234 px story column may clip.

## Minor Observations
- CREDIT 0 stays lit all run in the most prominent non-score slot — dim it until a coin event.
- Laser curtains are cyan, the one world element that shares the UI's reserved colour.
- Teal constants are copy-pasted across Hud, BossHealthBar, scifi-frame, StoryIntro, ChapterOneOutro — a design system held together by duplication.
- The coin SFX doubles as the slide-advance sound.
- The hero is mid-brown on mid-brown ground; a 1 px rim light would do more for figure/ground than any HUD change.
- Stale comment in index.html about a DEPLOY_ORIGIN placeholder; og:url and image alt missing.

## Questions to Consider
1. If the cyan frame is the identity, why does it ignore the world it frames — what would a ScifiFrame look like after a week in a foundry?
2. The coin is free and infinite. Is the ritual still doing emotional work, or is it cosplay that costs you first-timers? What if credits were finite, so CONTINUE meant something?
3. The script is the best asset — why is it read in a 234 px column beside a portrait that never changes across 8 slides?
4. Would the game be better with no cabinet and a canvas one step larger?
5. The ending says the hunt has just begun, then asks for three initials. What should someone feel last, and which screen owns that?

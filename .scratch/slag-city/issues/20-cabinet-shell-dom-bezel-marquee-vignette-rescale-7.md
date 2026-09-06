# 20 — Cabinet shell DOM: bezel, marquee, vignette, rescale, ≤768 card, SERVICE, failure handling

**What to build:** The canvas sits inside an illustrated cabinet in a dark room with a lit marquee and vignette; the window can be resized and the game always stays integer-scaled and centred; a phone-width viewport gets a static "desktop required" card; asset failures land on an arcade SERVICE screen with a retry key. A placeholder marquee is fine until 21.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Layer order: dark room → bezel → marquee (warm CSS glow) → canvas → vignette
- [ ] Integer scale recomputed on resize; never fractional; canvas stays centred
- [ ] ≤768 px: cabinet hidden, card shown (`min(90vw, 420px)` wide), no horizontal scroll down to 320 px; re-evaluated on resize / orientation change
- [ ] SERVICE screen names the failed asset id, offers a retry key, logs the id to console
- [ ] Audio-unlock failure stays silent and retries on the next gesture; first keypress unlocks audio
- [ ] Verified at ~375 px, ~768 px and desktop widths in a real browser


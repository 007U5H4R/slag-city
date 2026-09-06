# 02 — CRT PostFX pipeline + toggle key

**What to build:** The canvas is rendered through a CRT pass — subtle scanlines, slight barrel curvature, soft phosphor bleed between neighbouring pixels — and a single key turns it off instantly, falling back to crisp integer-scaled pixels.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A test pattern (checkerboard + text) is visibly softened with the pass on and pixel-crisp with it off
- [ ] Toggle state persists in localStorage and is read defensively on boot
- [ ] Toggling does not change canvas size, scale or position
- [ ] When WebGL is unavailable the game falls back to the Canvas renderer with the pass off and a one-line notice


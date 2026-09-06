# 03 — Art tracer (M0): hero reference → AutoSprite walk + attack → atlas → in-engine

**What to build:** A generated hero walks and swings a sledgehammer on the 384×224 canvas under the CRT pass. This kills the riskiest assumption — AI frame-to-frame consistency — and measures AutoSprite's real cost and provider before any other art is commissioned. **Human gate:** owner's Higgsfield credit ceiling set; owner accepts the on-screen quality.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Hero reference generated with the `Design.md` character prompt template; chosen candidate and its prompt logged in `LICENSES.md`
- [ ] AutoSprite `walk` (6 frames) and `attack` (3–4 frames) sheets generated from that reference
- [ ] A build-atlas tool crops/trims, downscales the hero to ~64 px tall, quantises to a provisional palette with no dither, and emits a Phaser atlas
- [ ] The hero plays walk and attack loops in-engine; frames do not visibly "swim" at 384×224
- [ ] AutoSprite cost per run and the backing provider are recorded; the run is rejected if the provider is Kling-backed
- [ ] Sources and outputs are committed; `LICENSES.md` exists with the manifest columns from `Solution-PRD.md`


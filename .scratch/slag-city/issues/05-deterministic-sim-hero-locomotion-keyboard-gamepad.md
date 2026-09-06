# 05 — Deterministic sim + hero locomotion + keyboard & gamepad

**What to build:** A placeholder-box hero walks, changes depth and jumps on the belt plane at a fixed 60 Hz, driven by keyboard or gamepad, and the same input log always produces the same world state.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Fixed-step loop with a capped accumulator; sim pauses while the tab is hidden
- [ ] Hero idle / walk / jump driven by an `InputFrame` from a frame-data table, with `y` clamped to the walkable band and draw order by `y`
- [ ] Keyboard: arrows/WASD move, J/K/L = Attack/Jump/Special, Enter = Start, 5 = Coin
- [ ] Gamepad: d-pad/stick, West/South/East = Attack/Jump/Special, Start, Select = Coin; disconnect pauses with "CONTROLLER DISCONNECTED", reconnect or keypress resumes
- [ ] Vitest determinism test: replaying a recorded input log yields an identical state hash
- [ ] Seeded RNG is the only randomness source in core


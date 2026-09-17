// src/core/arcade/hold-skip.ts
// Hold-to-skip timing for the long reading screens (story intro, chapter-one outro). Pure so it can be tested:
// - Time-based (ms), NOT per-render-frame, so a 144 Hz display doesn't skip in a quarter of the intended hold.
// - A hold only counts once it BEGINS while the screen is open: the button must be seen released while active
//   before it arms, so the press that opened the screen (or dismissed the previous dialogue) can't skip it.
// - Fires exactly once, on the step that crosses the threshold.
export const SKIP_HOLD_MS = 600;
const MAX_STEP_MS = 100; // clamp a long frame (tab restore, hitch) so one spike can't satisfy the hold; 100 keeps a 10 fps device honest

export interface HoldSkip { armed: boolean; heldMs: number }
export const createHoldSkip = (): HoldSkip => ({ armed: false, heldMs: 0 });

export function stepHoldSkip(s: HoldSkip, active: boolean, down: boolean, dtMs: number): { state: HoldSkip; fire: boolean } {
  if (!active) return { state: createHoldSkip(), fire: false };
  if (!down) return { state: { armed: true, heldMs: 0 }, fire: false };
  if (!s.armed) return { state: s, fire: false }; // held since before the screen opened — must release first
  const heldMs = s.heldMs + Math.min(Math.max(dtMs, 0), MAX_STEP_MS);
  return { state: { armed: true, heldMs }, fire: s.heldMs < SKIP_HOLD_MS && heldMs >= SKIP_HOLD_MS };
}

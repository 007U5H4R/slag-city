// test/core/arcade/hold-skip.test.ts
// Scars for two shipped bugs in hold-to-skip: (1) it counted render frames, so a 144 Hz display skipped the
// intro in ~0.25s; (2) a hold that began BEFORE the screen opened (e.g. the press that dismissed Kilvish's
// last line) skipped the whole chapter-one outro unread.
import { describe, it, expect } from 'vitest';
import { createHoldSkip, stepHoldSkip, SKIP_HOLD_MS } from '@core/arcade/hold-skip';

// Hold the button for `ms` at a given refresh rate; returns how many times it fired and the final state.
const holdFor = (start: ReturnType<typeof createHoldSkip>, ms: number, hz: number) => {
  let s = start, fires = 0;
  const dt = 1000 / hz;
  for (let t = 0; t < ms; t += dt) { const r = stepHoldSkip(s, true, true, dt); s = r.state; if (r.fire) fires++; }
  return { s, fires };
};
const armed = () => stepHoldSkip(createHoldSkip(), true, false, 16).state; // screen open, button seen released

describe('hold-to-skip', () => {
  it('takes the same real time at 30, 60 and 144 Hz (not frame-counted)', () => {
    for (const hz of [30, 60, 144]) {
      expect(holdFor(armed(), SKIP_HOLD_MS - 80, hz).fires, `${hz}Hz short hold`).toBe(0);
      expect(holdFor(armed(), SKIP_HOLD_MS + 80, hz).fires, `${hz}Hz full hold`).toBe(1);
    }
  });
  it('ignores a hold that began before the screen opened, until the button is released', () => {
    // button already down on the first active frame → never arms, however long it is held
    expect(holdFor(createHoldSkip(), SKIP_HOLD_MS * 3, 60).fires).toBe(0);
    // release once, then a fresh hold works
    let s = holdFor(createHoldSkip(), 200, 60).s;
    s = stepHoldSkip(s, true, false, 16).state;
    expect(holdFor(s, SKIP_HOLD_MS + 80, 60).fires).toBe(1);
  });
  it('fires exactly once per hold, a tap never fires, and leaving the screen resets it', () => {
    expect(holdFor(armed(), SKIP_HOLD_MS * 4, 60).fires).toBe(1);
    expect(holdFor(armed(), 150, 60).fires).toBe(0);
    const mid = holdFor(armed(), 400, 60).s;
    expect(stepHoldSkip(mid, false, true, 16).state).toEqual(createHoldSkip());
  });
  it('one long hitch frame cannot satisfy the hold on its own', () => {
    expect(stepHoldSkip(armed(), true, true, 5000).fire).toBe(false);
  });
});

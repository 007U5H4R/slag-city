// test/core/arcade/screen-machine.test.ts
import { describe, it, expect } from 'vitest';
import { createArcade, reduceArcade, CONTINUE_FRAMES, GAME_OVER_FRAMES, blinkOn, BLINK_PERIOD, is1CC } from '@core/arcade/screen-machine';

const ticks = (a: ReturnType<typeof createArcade>, n: number) => { for (let i = 0; i < n; i++) a = reduceArcade(a, { type: 'tick' }); return a; };

describe('coin-op machine', () => {
  it('boots to ATTRACT; coins add credits (unlimited) and move to COIN with a 2-frame flash', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    expect(a.screen).toBe('ATTRACT');
    for (let i = 0; i < 99; i++) a = reduceArcade(a, { type: 'coin' });
    expect(a.credits).toBe(99); expect(a.screen).toBe('COIN'); expect(a.creditFlash).toBe(2);
    a = ticks(a, 2); expect(a.creditFlash).toBe(0);
  });
  it('Start needs a credit, consumes exactly one, and counts credits used', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'start' }); expect(a.screen).toBe('ATTRACT');
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'coin' });
    a = reduceArcade(a, { type: 'start' });
    expect(a.screen).toBe('PLAY'); expect(a.credits).toBe(1); expect(a.usedThisGame).toBe(1);
  });
  it('death → CONTINUE for 600 frames; a coin resumes PLAY and increments credits used; timeout → GAME OVER', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'start' });
    a = reduceArcade(a, { type: 'heroDead' });
    expect(a.screen).toBe('CONTINUE'); expect(a.continueFrames).toBe(CONTINUE_FRAMES);
    a = ticks(a, 300);
    a = reduceArcade(a, { type: 'coin' });
    expect(a.screen).toBe('PLAY'); expect(a.usedThisGame).toBe(2); expect(a.credits).toBe(0);
    a = reduceArcade(a, { type: 'heroDead' });
    a = ticks(a, CONTINUE_FRAMES);
    expect(a.screen).toBe('GAME_OVER');
    a = ticks(a, GAME_OVER_FRAMES);
    expect(a.screen).toBe('HISCORE_ENTRY');      // ticket 19 decides entry vs. straight to attract; the machine always offers entry
    a = reduceArcade(a, { type: 'entryDone' });
    expect(a.screen).toBe('ATTRACT'); expect(a.usedThisGame).toBe(0);
  });
  it('a coin during CONTINUE with credits already banked still consumes one per continue', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    for (let i = 0; i < 3; i++) a = reduceArcade(a, { type: 'coin' });
    a = reduceArcade(a, { type: 'start' }); a = reduceArcade(a, { type: 'heroDead' });
    a = reduceArcade(a, { type: 'start' });   // Start also continues when a credit is banked
    expect(a.screen).toBe('PLAY'); expect(a.credits).toBe(1); expect(a.usedThisGame).toBe(2);
  });
  it('boss defeat ends the game into GAME_OVER (stage clear) and 1CC is credits used === 1', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'start' });
    a = reduceArcade(a, { type: 'bossDefeated' });
    expect(a.screen).toBe('GAME_OVER'); expect(is1CC(a.usedThisGame)).toBe(true);
  });
  it('at GAME OVER, START jumps to the ranking early and a COIN banks a credit for a fresh game', () => {
    let a = reduceArcade(createArcade(), { type: 'boot' });
    a = reduceArcade(a, { type: 'coin' }); a = reduceArcade(a, { type: 'start' });
    a = reduceArcade(a, { type: 'heroDead' }); a = ticks(a, CONTINUE_FRAMES);
    expect(a.screen).toBe('GAME_OVER');
    // START skips the 3s wait straight to the ranking
    const started = reduceArcade(a, { type: 'start' });
    expect(started.screen).toBe('HISCORE_ENTRY');
    // COIN at GAME OVER banks a credit and also advances to the ranking; entryDone then lands on COIN, game-ready
    let coined = reduceArcade(a, { type: 'coin' });
    expect(coined.screen).toBe('HISCORE_ENTRY'); expect(coined.credits).toBe(1);
    coined = reduceArcade(coined, { type: 'entryDone' });
    expect(coined.screen).toBe('COIN'); expect(coined.credits).toBe(1);
  });
  it('blink is a hard 50% duty cycle at ~1.5 Hz', () => {
    expect(BLINK_PERIOD).toBe(40);
    expect(blinkOn(0)).toBe(true); expect(blinkOn(19)).toBe(true); expect(blinkOn(20)).toBe(false); expect(blinkOn(39)).toBe(false); expect(blinkOn(40)).toBe(true);
  });
});

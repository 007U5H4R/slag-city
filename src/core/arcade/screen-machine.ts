// src/core/arcade/screen-machine.ts
import { canStart, consume, insertCoin } from './credits';

export type Screen = 'BOOT' | 'ATTRACT' | 'COIN' | 'PLAY' | 'CONTINUE' | 'GAME_OVER' | 'HISCORE_ENTRY';
export interface ArcadeState { screen: Screen; credits: number; usedThisGame: number; continueFrames: number; creditFlash: number; screenFrame: number; finalScore: number; stageReached: number }
export type ArcadeEvent = { type: 'boot' } | { type: 'coin' } | { type: 'start' } | { type: 'heroDead' } | { type: 'bossDefeated' } | { type: 'tick' } | { type: 'gameOverDone' } | { type: 'entryDone' } | { type: 'score'; score: number };

export const CONTINUE_FRAMES = 600;
export const GAME_OVER_FRAMES = 180;
// GAME OVER ignores START/COIN-to-advance for its first moments, so inputs still being mashed from CONTINUE
// can't dismiss the FINAL SCORE card the instant it appears. (A coin is still banked during the floor.)
export const GAME_OVER_MIN_FRAMES = 45;
export const BLINK_PERIOD = 40;
export const blinkOn = (frame: number): boolean => frame % BLINK_PERIOD < BLINK_PERIOD / 2;
export const is1CC = (usedThisGame: number): boolean => usedThisGame === 1;

export function createArcade(): ArcadeState {
  return { screen: 'BOOT', credits: 0, usedThisGame: 0, continueFrames: 0, creditFlash: 0, screenFrame: 0, finalScore: 0, stageReached: 1 };
}
const to = (a: ArcadeState, screen: Screen, patch: Partial<ArcadeState> = {}): ArcadeState => ({ ...a, ...patch, screen, screenFrame: 0 });

export function reduceArcade(a: ArcadeState, ev: ArcadeEvent): ArcadeState {
  switch (ev.type) {
    case 'boot': return to(a, 'ATTRACT');
    case 'coin': {
      const credits = insertCoin(a.credits);
      if (a.screen === 'ATTRACT' || a.screen === 'COIN') return to({ ...a, credits, creditFlash: 2 }, 'COIN');
      if (a.screen === 'CONTINUE') return to(a, 'PLAY', { credits: consume(credits), usedThisGame: a.usedThisGame + 1, creditFlash: 2, continueFrames: 0 });
      // GAME OVER is the re-coin sales pitch: bank the credit and jump to the ranking; entryDone then lands on
      // COIN with the credit ready for a fresh game (skips the 3s auto-advance wait).
      if (a.screen === 'GAME_OVER' && a.screenFrame >= GAME_OVER_MIN_FRAMES) return to({ ...a, credits, creditFlash: 2 }, 'HISCORE_ENTRY');
      return { ...a, credits, creditFlash: 2 };
    }
    case 'start':
      if ((a.screen === 'COIN' || a.screen === 'ATTRACT') && canStart(a.credits)) return to(a, 'PLAY', { credits: consume(a.credits), usedThisGame: 1, finalScore: 0, stageReached: 1 });
      if (a.screen === 'CONTINUE' && canStart(a.credits)) return to(a, 'PLAY', { credits: consume(a.credits), usedThisGame: a.usedThisGame + 1, continueFrames: 0 });
      if (a.screen === 'GAME_OVER' && a.screenFrame >= GAME_OVER_MIN_FRAMES) return to(a, 'HISCORE_ENTRY'); // PRESS START skips the wait straight to the ranking
      return a;
    case 'heroDead': return a.screen === 'PLAY' ? to(a, 'CONTINUE', { continueFrames: CONTINUE_FRAMES }) : a;
    case 'bossDefeated': return a.screen === 'PLAY' ? to(a, 'GAME_OVER') : a;
    case 'score': return { ...a, finalScore: ev.score };
    case 'tick': {
      const n = { ...a, screenFrame: a.screenFrame + 1, creditFlash: Math.max(0, a.creditFlash - 1) };
      if (n.screen === 'CONTINUE') { n.continueFrames -= 1; if (n.continueFrames <= 0) return to(n, 'GAME_OVER'); }
      if (n.screen === 'GAME_OVER' && n.screenFrame >= GAME_OVER_FRAMES) return to(n, 'HISCORE_ENTRY');
      return n;
    }
    case 'gameOverDone': return to(a, 'HISCORE_ENTRY');
    case 'entryDone': return to(a, a.credits > 0 ? 'COIN' : 'ATTRACT', { usedThisGame: 0 });
  }
}

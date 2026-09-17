// src/shell/analytics.ts
// Thin, safe wrapper around Mixpanel for the product funnel the owner defined:
//   Page Loaded → Game Started → Stage Cleared → Name Recorded
// (landed the page → played → cleared the stage → recorded their name on the board).
//
// - Enabled only when VITE_MIXPANEL_TOKEN is set at build time; otherwise every call is a no-op, so the game
//   runs identically with no analytics (safe to ship before the token exists — set it in Vercel env when ready).
// - Anonymous only (no PII); honours Do-Not-Track. Never throws into the game — analytics must not break play.
// Lives in the shell (network/env side-effect); the Phaser adapter calls track() at the funnel moments.
import mixpanel from 'mixpanel-browser';

// Event names ARE the funnel steps — keep these strings stable; the Mixpanel funnel/report references them.
export const EVENTS = {
  PAGE_LOADED: 'Page Loaded',
  GAME_STARTED: 'Game Started',
  STAGE_CLEARED: 'Stage Cleared',
  NAME_RECORDED: 'Name Recorded',
} as const;
export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

let enabled = false;

function doNotTrack(): boolean {
  try {
    const dnt = navigator.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack;
    return dnt === '1' || dnt === 'yes';
  } catch { return false; }
}

// Call once at boot. No token or DNT → stays disabled (all track() calls no-op).
export function initAnalytics(): void {
  const token = import.meta.env.VITE_MIXPANEL_TOKEN;
  if (!token || doNotTrack()) return;
  try {
    mixpanel.init(token, { persistence: 'localStorage', track_pageview: false, ignore_dnt: false });
    mixpanel.register({ game: 'slag-city' }); // super-property on every event, so reports can scope to this game
    enabled = true;
  } catch { enabled = false; }
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (!enabled) return;
  try { mixpanel.track(event, props); } catch { /* never let analytics break the game */ }
}

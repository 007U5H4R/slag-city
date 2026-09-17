// src/shell/analytics.ts
// Thin, safe wrapper around Mixpanel for the product funnel the owner defined:
//   Page Loaded → Game Started → Stage Cleared → Name Recorded
// (landed the page → played → cleared the stage → recorded their name on the board).
//
// - Enabled only when VITE_MIXPANEL_TOKEN is set at build time; otherwise every call is a no-op, so the game
//   runs identically with no analytics (safe to ship before the token exists — set it in Vercel env when ready).
// - Anonymous: no account, email, name or device identifiers are sent. The only player-typed value is the 3-letter
//   arcade initials on Name Recorded (whitelisted A–Z/0–9 — not personal data, but it IS user input; keep it that way).
//   Honours Do-Not-Track. Never throws into the game — analytics must not break play.
// - The SDK is loaded lazily and WITHOUT Mixpanel's session recorder (the `-core` loader): the default entry drags
//   rrweb into the startup bundle (~0.5 MB) even when analytics is off. Nothing is fetched unless a token is set.
// Lives in the shell (network/env side-effect); the Phaser adapter calls track() at the funnel moments.
// The slice of the Mixpanel API this file uses (the -core loader's .d.ts doesn't type its default export).
interface MixpanelLike {
  init(token: string, config: Record<string, unknown>): void;
  register(props: Record<string, unknown>): void;
  track(event: string, props?: Record<string, unknown>): void;
}

// Event names ARE the funnel steps — keep these strings stable; the Mixpanel funnel/report references them.
export const EVENTS = {
  PAGE_LOADED: 'Page Loaded',
  GAME_STARTED: 'Game Started',
  STAGE_CLEARED: 'Stage Cleared',
  NAME_RECORDED: 'Name Recorded',
} as const;
export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

// The Slag City project lives in Mixpanel's EU data region, so events MUST go to the EU ingestion host — the
// default US host silently drops them for an EU project (that bug shipped once; analytics.test.ts pins this).
export const MIXPANEL_API_HOST = 'https://api-eu.mixpanel.com';

type State = 'off' | 'loading' | 'ready';
let state: State = 'off';
let mp: MixpanelLike | null = null;
let queue: Array<[AnalyticsEvent, Record<string, unknown> | undefined]> = []; // events fired while the SDK loads
let warned = false;
const warnOnce = (what: string, err: unknown): void => { if (!warned) { warned = true; console.warn(`[analytics] ${what} — analytics disabled`, err); } };

function doNotTrack(): boolean {
  try {
    const dnt = navigator.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack;
    return dnt === '1' || dnt === 'yes';
  } catch { return false; }
}

// Call once at boot. No token or DNT → stays off and the SDK is never downloaded. Resolves when ready (or off).
export async function initAnalytics(): Promise<void> {
  const token = import.meta.env.VITE_MIXPANEL_TOKEN;
  if (!token || doNotTrack() || state !== 'off') return;
  state = 'loading';
  try {
    const mod = await import('mixpanel-browser/src/loaders/loader-module-core') as unknown as { default: MixpanelLike };
    mod.default.init(token, { api_host: MIXPANEL_API_HOST, persistence: 'localStorage', track_pageview: false, ignore_dnt: false });
    mod.default.register({ game: 'slag-city' }); // super-property on every event, so reports can scope to this game
    mp = mod.default; state = 'ready';
    const pending = queue; queue = [];
    for (const [event, props] of pending) track(event, props);
  } catch (err) { state = 'off'; queue = []; warnOnce('failed to load/initialise Mixpanel', err); }
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>): void {
  if (state === 'loading') { queue.push([event, props]); return; }
  if (state !== 'ready' || !mp) return;
  try { mp.track(event, props); } catch (err) { warnOnce('track() threw', err); } // never let analytics break the game
}

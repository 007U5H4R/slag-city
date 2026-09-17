// test/shell/analytics.test.ts
// Scars: (1) events were once sent to Mixpanel's default US host and silently dropped for our EU project;
// (2) the SDK now loads lazily, so events fired during the load (Page Loaded fires on the very next line after
// init) must be queued and flushed in order — and with no token nothing may be loaded or sent at all.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sdk = { init: vi.fn(), register: vi.fn(), track: vi.fn() };
vi.mock('mixpanel-browser/src/loaders/loader-module-core', () => ({ default: sdk }));

beforeEach(() => { vi.resetModules(); vi.unstubAllEnvs(); for (const f of Object.values(sdk)) f.mockClear(); });

describe('analytics wrapper', () => {
  it('with no token: never initialises and drops events', async () => {
    vi.stubEnv('VITE_MIXPANEL_TOKEN', '');
    const a = await import('@shell/analytics');
    await a.initAnalytics(); a.track(a.EVENTS.PAGE_LOADED);
    expect(sdk.init).not.toHaveBeenCalled(); expect(sdk.track).not.toHaveBeenCalled();
  });
  it('initialises against the EU ingestion host and tags every event with the game', async () => {
    vi.stubEnv('VITE_MIXPANEL_TOKEN', 'tok');
    const a = await import('@shell/analytics');
    await a.initAnalytics();
    expect(sdk.init).toHaveBeenCalledWith('tok', expect.objectContaining({ api_host: 'https://api-eu.mixpanel.com', track_pageview: false }));
    expect(sdk.register).toHaveBeenCalledWith({ game: 'slag-city' });
  });
  it('queues events fired while the SDK loads and flushes them in order', async () => {
    vi.stubEnv('VITE_MIXPANEL_TOKEN', 'tok');
    const a = await import('@shell/analytics');
    const ready = a.initAnalytics();                 // not awaited — exactly how main.ts calls it
    a.track(a.EVENTS.PAGE_LOADED); a.track(a.EVENTS.GAME_STARTED);
    expect(sdk.track).not.toHaveBeenCalled();
    await ready;
    expect(sdk.track.mock.calls.map((c) => c[0])).toEqual(['Page Loaded', 'Game Started']);
    a.track(a.EVENTS.STAGE_CLEARED, { score: 9 });
    expect(sdk.track).toHaveBeenLastCalledWith('Stage Cleared', { score: 9 });
  });
});

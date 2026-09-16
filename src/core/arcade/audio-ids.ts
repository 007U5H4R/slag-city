// src/core/arcade/audio-ids.ts
// The complete set of sound ids. Sim code emits `{ type: 'sfx', id }` events (the audio-ids test asserts it
// never emits one outside this list); coin/start/continue_tick/game_over/hiscore_confirm are adapter-side
// (the coin-op machine + entry, not the sim). MUSIC_IDS are the per-screen tracks. The AudioAdapter maps
// every id to a synthesised retro blip / chiptune (ticket 22 ships procedural audio; licensed samples can
// later back the same ids without touching callers).
export const SFX_IDS = [
  'coin', 'start', 'hit_light', 'hit_heavy', 'hit_launch', 'knockdown', 'pickup', 'weapon_pickup',
  'weapon_drop', 'weapon_break', 'namecard', 'continue_tick', 'game_over', 'hiscore_confirm', 'crate',
  'grab', 'throw', 'special', 'cannon', 'glob', 'sizzle', 'lock', 'lock_release', 'feral_emerge',
  'boss_tear', 'boss_phase2', 'boss_death', 'ladle',
] as const;
export type SfxId = typeof SFX_IDS[number];

export const MUSIC_IDS = ['title', 'stage', 'boss'] as const;
export type MusicId = typeof MUSIC_IDS[number];

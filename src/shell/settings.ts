// src/shell/settings.ts
export interface Settings { crt: boolean; volume: number; seenStory: boolean }
const DEFAULTS: Settings = { crt: true, volume: 0.8, seenStory: false };
const PREFIX = 'slagcity.';

let storageProvider: () => Storage = () => localStorage;
/** Test seam: swap the Storage provider. */
export function _bindStorage(p: () => Storage): void { storageProvider = p; }

const validators: { [K in keyof Settings]: (v: unknown) => v is Settings[K] } = {
  crt: (v): v is boolean => typeof v === 'boolean',
  seenStory: (v): v is boolean => typeof v === 'boolean',
  volume: (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1,
};

export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  try {
    const raw = storageProvider().getItem(PREFIX + key);
    if (raw === null) return DEFAULTS[key];
    const parsed: unknown = JSON.parse(raw);
    return validators[key](parsed) ? (parsed as Settings[K]) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  try { storageProvider().setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage unavailable: session-only */ }
}

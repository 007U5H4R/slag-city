// test/shell/settings.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getSetting, setSetting, _bindStorage } from '@shell/settings';

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('settings', () => {
  let store: MemStorage;
  beforeEach(() => { store = new MemStorage(); _bindStorage(() => store); });

  it('returns defaults when nothing is stored', () => {
    expect(getSetting('crt')).toBe(true);
    expect(getSetting('volume')).toBe(0.8);
    expect(getSetting('seenStory')).toBe(false);
  });
  it('round-trips values', () => {
    setSetting('crt', false); setSetting('volume', 0.25);
    expect(getSetting('crt')).toBe(false);
    expect(getSetting('volume')).toBe(0.25);
  });
  it('ignores garbage and out-of-range values', () => {
    store.setItem('slagcity.crt', 'banana');
    store.setItem('slagcity.volume', '"7"');
    expect(getSetting('crt')).toBe(true);
    expect(getSetting('volume')).toBe(0.8);
  });
  it('survives a storage that throws', () => {
    _bindStorage(() => { throw new Error('SecurityError'); });
    expect(getSetting('crt')).toBe(true);
    expect(() => setSetting('crt', false)).not.toThrow();
  });
});

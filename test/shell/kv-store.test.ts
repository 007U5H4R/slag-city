import { describe, it, expect } from 'vitest';
import { openKv, memoryKv } from '@shell/kv-store';
describe('kv-store', () => {
  it('falls back to memory when indexedDB is unavailable and round-trips values', async () => {
    const kv = await openKv();
    expect(await kv.get('x')).toBeNull();
    await kv.put('x', { a: 1 });
    expect(await kv.get<{ a: number }>('x')).toEqual({ a: 1 });
  });
  it('memory stores are isolated per instance', async () => {
    const a = memoryKv(), b = memoryKv();
    await a.put('k', 1);
    expect(await b.get('k')).toBeNull();
  });
});

// src/shell/hiscore-store.ts
// Persisted hi-score table over the ticket-19.1 kv (IndexedDB, memory fallback). The kv is opened once at
// boot (`main.ts` → `openHiScores()`); loads/saves that arrive before that (or in tests) open it lazily.
// Every path is silent on failure — a broken store degrades to the seeded DEFAULT_TABLE, never an error.
import { openKv, HISCORES_KEY } from './kv-store';
import type { KvStore } from './kv-store';
import { sanitiseTable } from '@core/arcade/hiscores';
import type { HiScoreRow } from '@core/arcade/hiscores';

let store: KvStore | null = null;
let opening: Promise<KvStore> | null = null;

async function kv(): Promise<KvStore> {
  if (store) return store;
  if (!opening) opening = openKv().then((k) => (store = k));
  return opening;
}

/** Open the kv once at boot so the first table read is warm. Safe to call more than once. */
export async function openHiScores(): Promise<void> { await kv(); }

/** Always resolves to a valid table — a missing/garbage row set falls back to the seeded default. */
export async function loadTable(): Promise<HiScoreRow[]> {
  try { return sanitiseTable(await (await kv()).get(HISCORES_KEY)); }
  catch { return sanitiseTable(null); }
}

export async function saveTable(rows: HiScoreRow[]): Promise<void> {
  try { await (await kv()).put(HISCORES_KEY, rows); } catch { /* persistence is best-effort */ }
}

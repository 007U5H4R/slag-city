// src/shell/kv-store.ts
export interface KvStore { get<T>(key: string): Promise<T | null>; put<T>(key: string, value: T): Promise<void> }
export const HISCORES_KEY = 'hiscores';

export function memoryKv(): KvStore {
  const m = new Map<string, unknown>();
  return { get: async <T,>(k: string) => (m.has(k) ? (m.get(k) as T) : null), put: async (k, v) => { m.set(k, v); } };
}

function openDB(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(new Error(`IndexedDB open failed: ${request.error}`));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName); // out-of-line keys
    };
  });
}

export async function openKv(dbName = 'slagcity', storeName = 'kv'): Promise<KvStore> {
  if (typeof indexedDB === 'undefined') return memoryKv();
  let db: IDBDatabase;
  try { db = await openDB(dbName, storeName); } catch { return memoryKv(); }
  return {
    get: <T,>(key: string) => new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readonly'); const req = tx.objectStore(storeName).get(key);
      req.onerror = () => reject(new Error(`kv get failed: ${req.error}`)); req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    }),
    put: <T,>(key: string, value: T) => new Promise<void>((resolve, reject) => {
      const tx = db.transaction([storeName], 'readwrite'); tx.objectStore(storeName).put(value, key);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error(`kv put failed: ${tx.error}`));
    }),
  };
}

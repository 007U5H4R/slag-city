// src/core/arcade/initials.ts
export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ .';
export interface EntryState { letters: [number, number, number]; pos: 0 | 1 | 2; done: boolean }

export function createEntry(): EntryState {
  return { letters: [0, 0, 0], pos: 0, done: false };
}

export function reduceEntry(s: EntryState, a: 'up' | 'down' | 'confirm'): EntryState {
  if (s.done) return s;
  const letters: [number, number, number] = [...s.letters];
  if (a === 'confirm') {
    if (s.pos < 2) return { letters, pos: (s.pos + 1) as 0 | 1 | 2, done: false };
    return { letters, pos: s.pos, done: true };
  }
  const step = a === 'up' ? 1 : LETTERS.length - 1;
  letters[s.pos] = (letters[s.pos] + step) % LETTERS.length;
  return { letters, pos: s.pos, done: false };
}

export const entryText = (s: EntryState): string => s.letters.map((i) => LETTERS[i]).join('');

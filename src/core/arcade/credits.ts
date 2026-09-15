// src/core/arcade/credits.ts
export const insertCoin = (credits: number): number => credits + 1;   // unlimited inserts — free demo
export const canStart = (credits: number): boolean => credits >= 1;
export const consume = (credits: number): number => Math.max(0, credits - 1);

// src/core/types.ts
export interface InputFrame {
  left: boolean; right: boolean; up: boolean; down: boolean;
  attack: boolean; jump: boolean; special: boolean;
  start: boolean; coin: boolean;
}
export const EMPTY_INPUT: Readonly<InputFrame> = Object.freeze({
  left: false, right: false, up: false, down: false,
  attack: false, jump: false, special: false, start: false, coin: false,
});
export type Facing = 1 | -1;
export interface Vec3 { x: number; y: number; z: number }
/** Local rect: x forward from the feet (flipped by facing), y = height above feet (up-positive). */
export interface Rect { x: number; y: number; w: number; h: number }
export type HitLevel = 'light' | 'heavy' | 'launch';

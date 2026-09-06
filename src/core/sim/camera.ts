// src/core/sim/camera.ts
import type { WorldState } from './state';
import { heroOf, SCREEN } from './state';

export const CAMERA_FOLLOW_X = 160;
export const HERO_SCREEN_MARGIN = 8;

export function updateCamera(state: WorldState): void {
  const hero = heroOf(state);
  const maxX = Math.max(0, state.stageWidth - SCREEN.w);
  const target = state.camera.lockX ?? Math.min(hero.pos.x - CAMERA_FOLLOW_X, maxX);
  if (state.camera.lockX === null) state.camera.x = Math.max(state.camera.x, target);
  else state.camera.x = Math.min(state.camera.lockX, maxX);
  const left = state.camera.x + HERO_SCREEN_MARGIN;
  const right = state.camera.x + SCREEN.w - HERO_SCREEN_MARGIN;
  hero.pos.x = Math.max(left, Math.min(right, hero.pos.x));
}

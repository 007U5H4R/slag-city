// src/core/stage/locks.ts
import type { WorldState } from '../sim/state';
import { emit, SCREEN } from '../sim/state';
import { spawnEntry } from './spawn';
import { isBody } from '../sim/entity';
import { spawnBoss, BOSS_WAVES } from '../entities/boss';

// Scroll-lock engine: as the camera reaches each lock's camX it stops, spawns the lock's delayed spawn
// table, and releases (camera free again) once every body from that lock is down. After the last lock,
// reaching the boss door emits a one-shot `bossDoor` and holds the camera there for the boss (ticket 15).
export function lockSystem(state: WorldState): void {
  const stage = state.stage.stageData;
  if (!stage) return;
  const i = state.camera.lockIndex;
  if (state.camera.lockX === null) {
    if (i < stage.locks.length && state.camera.x >= stage.locks[i]!.camX) {
      state.camera.lockX = stage.locks[i]!.camX; state.camera.x = stage.locks[i]!.camX; state.stage.lockFrame = 0;
      emit(state, { type: 'sfx', id: 'lock' });
    } else if (i >= stage.locks.length && !state.stage.bossDoorReached && state.camera.x >= stage.bossDoorX - SCREEN.w) {
      state.stage.bossDoorReached = true; state.camera.lockX = stage.bossDoorX - SCREEN.w; state.camera.x = state.camera.lockX;
      emit(state, { type: 'bossDoor' });
      spawnBoss(state, state.camera.x + 300, 176, BOSS_WAVES[0]); // wave 0 = first enforcer; the adapter spawns waves 1+ after each defeat exchange
    }
    // DEVIATION (owner-ratifiable — plan-internal contradiction): the plan returned unconditionally here,
    // deferring a lock's `delay: 0` spawns to the frame AFTER it engages — but locks.test asserts the
    // delay-0 enemy exists the instant the camera locks. Return only if still unlocked; a just-engaged
    // lock (lockFrame === 0) falls through to spawn its delay-0 entries this same frame. The boss-door
    // branch also sets lockX, but `bossDoorReached` short-circuits the spawn block just below.
    if (state.camera.lockX === null) return;
  }
  if (state.stage.bossDoorReached) { if (state.stage.bossDefeated) state.camera.lockX = null; return; }            // the boss (ticket 15) releases this lock on defeat
  const lock = stage.locks[i]!;
  for (const entry of lock.entries) if (entry.delay === state.stage.lockFrame) spawnEntry(state, entry, i);
  state.stage.lockFrame++;
  const maxDelay = Math.max(...lock.entries.map((e) => e.delay));
  const remaining = state.entities.some((e) => e.lockIndex === i && isBody(e) && !e.dead && e.state !== 'dead');
  if (state.stage.lockFrame > maxDelay && !remaining) {
    state.stage.lockCleared[i] = true; state.camera.lockX = null; state.camera.lockIndex = i + 1; state.stage.lockFrame = -1;
    emit(state, { type: 'lockRelease', index: i }); emit(state, { type: 'sfx', id: 'lock_release' });
  }
}

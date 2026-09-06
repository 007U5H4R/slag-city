// test/core/sim/camera.test.ts
import { describe, it, expect } from 'vitest';
import { createWorld, heroOf } from '@core/sim/state';
import { updateCamera, CAMERA_FOLLOW_X } from '@core/sim/camera';

describe('camera follow', () => {
  it('keeps the hero at the follow point once past it and never scrolls back', () => {
    const w = createWorld(1); const h = heroOf(w);
    h.pos.x = 300; updateCamera(w);
    expect(w.camera.x).toBe(300 - CAMERA_FOLLOW_X);
    h.pos.x = 100; updateCamera(w);
    expect(w.camera.x).toBe(300 - CAMERA_FOLLOW_X);
  });
  it('clamps to the stage width', () => {
    const w = createWorld(1, 1000); const h = heroOf(w);
    h.pos.x = 5000; updateCamera(w);
    expect(w.camera.x).toBe(1000 - 384);
  });
  it('keeps the hero inside the visible screen', () => {
    const w = createWorld(1); const h = heroOf(w);
    w.camera.x = 200; h.pos.x = 100; updateCamera(w);
    expect(h.pos.x).toBe(200 + 8);
  });
});

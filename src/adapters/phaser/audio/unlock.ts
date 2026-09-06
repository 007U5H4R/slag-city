// src/adapters/phaser/audio/unlock.ts
import type Phaser from 'phaser';

export function installAudioUnlock(game: Phaser.Game): void {
  const tryUnlock = (): void => {
    try {
      const sound = game.sound as Phaser.Sound.WebAudioSoundManager;
      const ctx = sound.context;
      // Stop once audio is usable. NoAudio/HTML5 report `!locked`; WebAudio never clears `locked`
      // even after a successful unlock, so treat a running context as unlocked — otherwise this
      // keydown listener never detaches and re-calls unlock() on every keypress.
      if (!sound.locked || (ctx && ctx.state === 'running')) { window.removeEventListener('keydown', tryUnlock); return; }
      sound.unlock();
      if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => { /* retry on next gesture */ });
    } catch { /* silent: retry on the next gesture */ }
  };
  window.addEventListener('keydown', tryUnlock);
}

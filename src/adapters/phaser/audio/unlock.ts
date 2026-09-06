// src/adapters/phaser/audio/unlock.ts
import type Phaser from 'phaser';

export function installAudioUnlock(game: Phaser.Game): void {
  const tryUnlock = (): void => {
    try {
      if (!game.sound.locked) { window.removeEventListener('keydown', tryUnlock); return; }
      game.sound.unlock();
      const ctx = (game.sound as Phaser.Sound.WebAudioSoundManager).context;
      if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => { /* retry on next gesture */ });
    } catch { /* silent: retry on the next gesture */ }
  };
  window.addEventListener('keydown', tryUnlock);
}

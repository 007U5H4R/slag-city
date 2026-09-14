// src/adapters/phaser/scenes/BootScene.ts
import Phaser from 'phaser';
import { showService } from '@shell/service-screen';

export interface AssetEntry { key: string; type: 'image' | 'atlas' | 'audio'; url: string; atlasJson?: string }

export class BootScene extends Phaser.Scene {
  /** Later tickets push entries here (atlases in 03/12/13/16, backgrounds in 04/17, fonts in 09, audio in 22). */
  static readonly MANIFEST: AssetEntry[] = [
    { key: 'hud8', type: 'image', url: '/assets/fonts/hud8.png' },
    { key: 'display16', type: 'image', url: '/assets/fonts/display16.png' },
    { key: 'hero', type: 'atlas', url: '/assets/atlases/hero.png', atlasJson: '/assets/atlases/hero.json' },
    { key: 'brawler', type: 'atlas', url: '/assets/atlases/brawler.png', atlasJson: '/assets/atlases/brawler.json' },
    { key: 'knife', type: 'atlas', url: '/assets/atlases/knife.png', atlasJson: '/assets/atlases/knife.json' },
    { key: 'heavy', type: 'atlas', url: '/assets/atlases/heavy.png', atlasJson: '/assets/atlases/heavy.json' },
  ];
  constructor() { super('boot'); }

  preload(): void {
    for (const a of BootScene.MANIFEST) this.enqueue(a);
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('failasset')) {
      this.load.image('dev-missing', '/assets/does-not-exist.png');
    }
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error(`[asset] failed: ${file.key} (${file.src})`);
      this.failed.push(file.key);
    });
  }

  private failed: string[] = [];

  create(): void {
    this.collectProcessFailures();
    if (this.failed.length > 0) {
      const id = this.failed[0] as string;
      showService(id, () => { this.failed = []; this.scene.restart(); });
      return;
    }
    this.scene.start('game');
  }

  /**
   * A file that loads but fails to decode (e.g. a host returning 200 + HTML for a missing asset — Vite
   * dev's SPA fallback, and some production SPA hosts) fires no `FILE_LOAD_ERROR` and is not counted in
   * `totalFailed`. Detect those by absence from the cache after the load queue has finished.
   */
  private collectProcessFailures(): void {
    const expected: AssetEntry[] = [...BootScene.MANIFEST];
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('failasset')) {
      expected.push({ key: 'dev-missing', type: 'image', url: '/assets/does-not-exist.png' });
    }
    for (const a of expected) {
      if (!this.assetPresent(a) && !this.failed.includes(a.key)) this.failed.push(a.key);
    }
  }

  private assetPresent(a: AssetEntry): boolean {
    return a.type === 'audio' ? this.cache.audio.exists(a.key) : this.textures.exists(a.key);
  }

  private enqueue(a: AssetEntry): void {
    if (a.type === 'image') this.load.image(a.key, a.url);
    else if (a.type === 'atlas') this.load.atlas(a.key, a.url, a.atlasJson);
    else this.load.audio(a.key, a.url);
  }
}

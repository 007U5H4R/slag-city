// src/adapters/phaser/scenes/BootScene.ts
import Phaser from 'phaser';
import { showService } from '@shell/service-screen';

export interface AssetEntry { key: string; type: 'image' | 'atlas' | 'audio'; url: string; atlasJson?: string }

export class BootScene extends Phaser.Scene {
  /** Later tickets push entries here (atlases in 03/12/13/16, backgrounds in 04/17, fonts in 09, audio in 22). */
  static readonly MANIFEST: AssetEntry[] = [];
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
    if (this.failed.length > 0) {
      const id = this.failed[0] as string;
      showService(id, () => { this.failed = []; this.scene.restart(); });
      return;
    }
    this.scene.start('game');
  }

  private enqueue(a: AssetEntry): void {
    if (a.type === 'image') this.load.image(a.key, a.url);
    else if (a.type === 'atlas') this.load.atlas(a.key, a.url, a.atlasJson);
    else this.load.audio(a.key, a.url);
  }
}

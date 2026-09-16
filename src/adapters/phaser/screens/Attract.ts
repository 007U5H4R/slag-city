// src/adapters/phaser/screens/Attract.ts
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { blinkOn } from '@core/arcade/screen-machine';
import type { ArcadeState } from '@core/arcade/screen-machine';
import { attractSegmentAt, ATTRACT } from '@core/arcade/attract';
import type { AttractSegment } from '@core/arcade/attract';
import { createWorld } from '@core/sim/state';
import type { WorldState } from '@core/sim/state';
import { STAGE1 } from '@core/stage/stage1';
import { tick } from '@core/sim/tick';
import { decodeInput } from '@core/input-codec';

interface ReplayFile { seed: number; inputs: number[]; hash: string }

// Attract loop for ATTRACT + COIN: title card -> recorded demo replay -> hi-score table, on its own frame
// clock (independent of the machine's screenFrame so inserting a coin never restarts the loop). It owns the
// demo world and ticks it deterministically from `attract-demo.json`; GameScene reads `segment`/`demoWorld`
// to render whichever world is current, and draws the hi-score table itself during the `table` segment.
// A full-screen black `plate` dips 0->1->0 at each segment boundary (the one soft transition Design §4 allows).
export class Attract {
  private title: Phaser.GameObjects.BitmapText;
  private marquee?: Phaser.GameObjects.Image;
  private insertCoin: Phaser.GameObjects.BitmapText;
  private pressStart: Phaser.GameObjects.BitmapText;
  private plate: Phaser.GameObjects.Rectangle;
  private active = false;

  private replay: ReplayFile | null = null;
  private frame = 0;
  segment: AttractSegment = 'title';
  demoWorld: WorldState | null = null;
  private demoCursor = 0;
  private prevSegment: AttractSegment | null = null;

  constructor(scene: Phaser.Scene) {
    if (scene.textures.exists('marquee')) {
      this.marquee = scene.add.image(BASE_W / 2, BASE_H / 3, 'marquee').setOrigin(0.5).setDepth(3000).setVisible(false);
    }
    this.title = scene.add.bitmapText(BASE_W / 2, BASE_H / 3, 'display16', 'SLAG CITY').setOrigin(0.5).setDepth(3000).setVisible(false);
    this.insertCoin = scene.add.bitmapText(BASE_W / 2, BASE_H - 40, 'hud8', 'INSERT COIN').setOrigin(0.5).setDepth(3001).setVisible(false);
    this.pressStart = scene.add.bitmapText(BASE_W / 2, BASE_H - 40, 'hud8', 'PRESS START').setOrigin(0.5).setDepth(3001).setVisible(false);
    this.plate = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0).setDepth(3300).setVisible(false);
    const r = scene.cache.json.get('attract-demo') as ReplayFile | undefined;
    if (r && Array.isArray(r.inputs) && typeof r.seed === 'number') this.replay = r;
  }

  private demoFrames(): number { return this.replay ? this.replay.inputs.length : 0; }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.frame = 0; this.demoCursor = 0; this.prevSegment = null; this.demoWorld = null; this.segment = 'title';
    this.marquee?.setVisible(false); this.title.setVisible(false);
    this.insertCoin.setVisible(false); this.pressStart.setVisible(false); this.plate.setVisible(false);
  }

  step(arcade: ArcadeState, n: number): void {
    if (!this.active) return;
    this.frame += n;
    const seg = attractSegmentAt(this.frame, this.demoFrames());
    this.segment = seg.segment;

    // Demo world: recreate on each entry into the `demo` segment (identical every loop), tick it forward to
    // the segment frame with the recorded inputs. Missing replay -> demoFrames()===0 -> the segment is skipped.
    if (seg.segment === 'demo' && this.replay) {
      if (this.prevSegment !== 'demo') { this.demoWorld = createWorld(this.replay.seed, undefined, STAGE1); this.demoCursor = 0; }
      const w = this.demoWorld!;
      const inputs = this.replay.inputs;
      while (this.demoCursor < seg.frameInSegment && this.demoCursor < inputs.length) {
        tick(w, decodeInput(inputs[this.demoCursor]!));
        this.demoCursor++;
      }
    } else {
      this.demoWorld = null;
    }
    this.prevSegment = seg.segment;

    // Title card only during the title segment; the table segment is drawn by GameScene (HiScoreTable).
    const showTitle = seg.segment === 'title';
    if (this.marquee) this.marquee.setVisible(showTitle); else this.title.setVisible(showTitle);

    // Coin prompt: over the title, and behind PRESS START whenever a coin is banked (COIN screen).
    const showPrompt = showTitle || arcade.screen === 'COIN';
    const on = blinkOn(arcade.screenFrame);
    const needCredit = arcade.credits === 0;
    this.insertCoin.setVisible(showPrompt && on && needCredit);
    this.pressStart.setVisible(showPrompt && on && !needCredit);

    // Crossfade plate: fade in over the first crossfadeFrames of a segment, out over the last.
    this.plate.setVisible(true).setFillStyle(0x000000, this.plateAlpha(seg));
  }

  private plateAlpha(seg: { segment: AttractSegment; frameInSegment: number }): number {
    const cf = ATTRACT.crossfadeFrames;
    const len = seg.segment === 'title' ? ATTRACT.titleFrames : seg.segment === 'table' ? ATTRACT.tableFrames : this.demoFrames();
    const f = seg.frameInSegment;
    if (f < cf) return 1 - f / cf;              // fade from black at segment start
    if (f >= len - cf) return (f - (len - cf)) / cf; // fade to black at segment end
    return 0;
  }
}

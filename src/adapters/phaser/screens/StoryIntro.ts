// src/adapters/phaser/screens/StoryIntro.ts
// Story intro shown once when a fresh game begins, before the sim starts. Emotional revenge arc: robotic
// aliens ("the machines" / "the steel legion") exterminated Earth and the hero's family; he is one of the
// last survivors, turning his forge hammer on the machines. Purely adapter-side: GameScene freezes the
// world on the first PLAY frame, plays these slides, and releases the sim when the last slide is dismissed.
// Advanced by the ATTACK button, one slide at a time. Contra-style hero portrait pinned to the left, the
// sci-fi dialogue box on the right.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';
import { blinkOn } from '@core/arcade/screen-machine';

const BRASS = '#d7a94a', TEXT = '#d8cbb0', DIM = '#8a7f6a', CY = 0x2fd4d4, CY_HI = 0x8ff7f2;

// Layout: hero portrait panel on the left, dialogue box on the right.
const PORT = { x: 14, y: 30, w: 104, h: 164 };            // portrait frame
const BOX = { x: 126, y: 16, w: 234, h: 192 };            // dialogue box (ScifiFrame)
const TCX = BOX.x + BOX.w / 2;                            // text column centre
const CYB = BOX.y + BOX.h / 2;                            // box vertical centre

// Each slide: an optional big title + body lines (hand-wrapped so the narrow right column never clips).
interface Slide { title?: string; body: string[] }
const SLIDES: Slide[] = [
  { title: 'SLAG CITY', body: ['The machines fell', 'from the sky.'] },
  { body: ['They called it', 'first contact.', '', 'It was extermination.'] },
  { body: ['KILVISH,', 'their steel overlord,', 'burned the world', 'to slag.', '', 'Your wife. Your children.', 'Gone in one night.'] },
  { body: ['You crawled from', 'the rubble — one of', 'the last souls alive.'] },
  { body: ['His enforcers guard', 'the road to his throne.', '', 'Break them all', 'to reach him.'] },
  { body: ['They left you', 'your two hands', 'and a red-hot hammer.', '', 'That was', 'their last mistake.'] },
  { title: 'FIND KILVISH', body: ['Make them all burn.'] },
];

export class StoryIntro {
  private dim: Phaser.GameObjects.Rectangle;
  private frame: ScifiFrame;
  private rule: Phaser.GameObjects.Graphics;
  private portrait?: Phaser.GameObjects.Image;
  private title: Phaser.GameObjects.Text;
  private marquee?: Phaser.GameObjects.Image;
  private body: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private active = false;
  readonly count = SLIDES.length;

  constructor(scene: Phaser.Scene) {
    const D = 3200;
    // deep-noir full-screen dim (darker than the frame's own dim, which we suppress)
    this.dim = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x03060a, 0.9)
      .setDepth(D).setVisible(false);
    // sci-fi dialogue box on the right (angled corners, teal glow)
    this.frame = new ScifiFrame(scene, D);
    this.frame.draw(BOX.x, BOX.y, BOX.w, BOX.h);
    this.rule = scene.add.graphics().setDepth(D + 1).setVisible(false);
    // Contra-style hero portrait, pinned left, fit to the portrait frame height
    if (scene.textures.exists('hero-portrait')) {
      this.portrait = scene.add.image(PORT.x + PORT.w / 2, PORT.y + PORT.h / 2, 'hero-portrait')
        .setOrigin(0.5).setDepth(D + 2).setVisible(false);
      this.portrait.setScale((PORT.h - 8) / this.portrait.height);
    }
    this.title = scene.add.text(TCX, 0, '', { fontFamily: UI_FONT, fontSize: '15px', fontStyle: '700', color: BRASS, align: 'center' })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
    if (scene.textures.exists('marquee-logo')) {
      this.marquee = scene.add.image(TCX, 0, 'marquee-logo').setOrigin(0.5).setDepth(D + 2).setVisible(false);
      this.marquee.setScale((BOX.w - 44) / this.marquee.width);
    }
    this.body = scene.add.text(TCX, 0, '', { fontFamily: UI_FONT, fontSize: '9px', fontStyle: '400', color: TEXT, align: 'center', lineSpacing: 4 })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(TCX, BASE_H - 20, '', { fontFamily: UI_FONT, fontSize: '8px', fontStyle: '700', color: DIM, align: 'center' })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
  }

  private layout(i: number): void {
    const s = SLIDES[i]!;
    const hasTitle = !!s.title;
    // The game-title slide shows the metallic marquee logo in place of the bitmap title text.
    const useMarquee = hasTitle && !!this.marquee && s.title === SLIDES[0]!.title;
    this.title.setText(s.title ?? '').setVisible(hasTitle && !useMarquee);
    this.marquee?.setVisible(useMarquee);
    this.body.setText(s.body.join('\n'));
    // vertically centre the title+body block as a group inside the box
    const bodyH = this.body.height;
    const headH = useMarquee ? this.marquee!.displayHeight : this.title.height;
    const titleH = hasTitle ? headH + 10 : 0;
    const top = CYB - (titleH + bodyH) / 2;
    if (hasTitle) {
      const titleY = top + headH / 2;
      this.title.setY(titleY);
      this.marquee?.setY(titleY);
      this.body.setY(top + titleH + bodyH / 2);
    }
    else this.body.setY(CYB);
    // portrait frame + slide pips
    const g = this.rule; g.clear();
    g.fillStyle(0x02090c, 0.55).fillRect(PORT.x, PORT.y, PORT.w, PORT.h);        // dark backing behind the art
    g.lineStyle(6, CY, 0.10).strokeRect(PORT.x, PORT.y, PORT.w, PORT.h);         // glow bloom
    g.lineStyle(2, CY, 0.9).strokeRect(PORT.x, PORT.y, PORT.w, PORT.h);          // teal border
    g.lineStyle(2, CY_HI, 1);                                                    // bright corner brackets
    g.lineBetween(PORT.x, PORT.y, PORT.x + 12, PORT.y); g.lineBetween(PORT.x, PORT.y, PORT.x, PORT.y + 12);
    g.lineBetween(PORT.x + PORT.w - 12, PORT.y + PORT.h, PORT.x + PORT.w, PORT.y + PORT.h);
    g.lineBetween(PORT.x + PORT.w, PORT.y + PORT.h - 12, PORT.x + PORT.w, PORT.y + PORT.h);
    // slide pips under the box
    const n = SLIDES.length, px = TCX - (n * 8) / 2;
    for (let k = 0; k < n; k++) g.fillStyle(k === i ? CY : 0x1b5a5e, 1).fillRect(px + k * 8, BASE_H - 12, 5, 2);
  }

  setSlide(i: number): void { if (this.active) this.layout(Math.max(0, Math.min(SLIDES.length - 1, i))); }

  show(slide: number): void {
    this.active = true;
    this.frame.show(false); // suppress the frame's own dim — StoryIntro.dim supplies the deeper noir dim
    for (const o of [this.dim, this.rule, this.body, this.prompt]) o.setVisible(true);
    this.portrait?.setVisible(true);
    this.layout(slide);
  }

  // Blink the advance prompt; text depends on whether this is the final slide.
  step(frame: number, slide: number): void {
    if (!this.active) return;
    const last = slide >= SLIDES.length - 1;
    this.prompt.setText(blinkOn(frame) ? (last ? 'PRESS ATTACK TO BEGIN' : 'PRESS ATTACK  ▸') : '');
  }

  hide(): void {
    if (!this.active) return;
    this.active = false;
    this.frame.hide();
    for (const o of [this.dim, this.rule, this.title, this.body, this.prompt]) o.setVisible(false);
    this.marquee?.setVisible(false);
    this.portrait?.setVisible(false);
  }
}

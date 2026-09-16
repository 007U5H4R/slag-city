// src/adapters/phaser/screens/StoryIntro.ts
// Noir story intro (Max Payne-style narrative slides) shown once when a fresh game begins, before the sim
// starts. Purely adapter-side: GameScene freezes the world on the first PLAY frame, plays these slides, and
// releases the sim when the last slide is dismissed. Advanced by the ATTACK button, one slide at a time.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { UI_FONT } from '../views/ui-font';
import { blinkOn } from '@core/arcade/screen-machine';

const BRASS = '#d7a94a', TEXT = '#d8cbb0', DIM = '#8a7f6a', CY = 0x2fd4d4;

// Each slide: an optional big title + body lines (hand-wrapped so the layout is exact at 384px and never clips).
interface Slide { title?: string; body: string[] }
const SLIDES: Slide[] = [
  { title: 'SLAG CITY', body: ['The furnaces never cool.', 'Neither does the debt.'] },
  { body: ['They call it progress —', 'molten steel by day,', 'people gone missing by night.', '', 'The FOREMAN owns the mills,', 'the streets, and every soul on them.'] },
  { body: ['They took your crew.', 'Broke your hands on the line.', 'Left you for scrap', 'in the cooling pits.'] },
  { body: ['But scrap gets reforged.', '', 'You pull your hammer from the ash', 'and start walking', 'toward the tower.'] },
  { title: 'ONE MAN. ONE HAMMER.', body: ['One way out.'] },
];

export class StoryIntro {
  private dim: Phaser.GameObjects.Rectangle;
  private rule: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private marquee?: Phaser.GameObjects.Image;
  private body: Phaser.GameObjects.Text;
  private prompt: Phaser.GameObjects.Text;
  private active = false;
  readonly count = SLIDES.length;

  constructor(scene: Phaser.Scene) {
    const D = 3200;
    this.dim = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x03060a, 0.9)
      .setDepth(D).setVisible(false);
    this.rule = scene.add.graphics().setDepth(D + 1).setVisible(false);
    this.title = scene.add.text(BASE_W / 2, 0, '', { fontFamily: UI_FONT, fontSize: '18px', fontStyle: '700', color: BRASS, align: 'center' })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
    if (scene.textures.exists('marquee')) {
      this.marquee = scene.add.image(BASE_W / 2, 0, 'marquee').setOrigin(0.5).setDepth(D + 2).setVisible(false);
      const s = (BASE_W * 0.6) / this.marquee.width;
      this.marquee.setScale(s);
    }
    this.body = scene.add.text(BASE_W / 2, 0, '', { fontFamily: UI_FONT, fontSize: '10px', fontStyle: '400', color: TEXT, align: 'center', lineSpacing: 5 })
      .setOrigin(0.5, 0.5).setDepth(D + 2).setResolution(4).setVisible(false);
    this.prompt = scene.add.text(BASE_W / 2, BASE_H - 22, '', { fontFamily: UI_FONT, fontSize: '8px', fontStyle: '700', color: DIM, align: 'center' })
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
    // vertically centre the title+body block as a group
    const bodyH = this.body.height;
    const titleH = hasTitle ? this.title.height + 10 : 0;
    const top = (BASE_H - (titleH + bodyH)) / 2 - 6;
    if (hasTitle) {
      const titleY = top + this.title.height / 2;
      this.title.setY(titleY);
      this.marquee?.setY(titleY);
      this.body.setY(top + titleH + bodyH / 2);
    }
    else this.body.setY(BASE_H / 2 - 6);
    // thin cyan rules framing the panel
    const g = this.rule; g.clear();
    g.fillStyle(CY, 0.85).fillRect(BASE_W / 2 - 70, 30, 140, 1);
    g.fillStyle(CY, 0.5).fillRect(BASE_W / 2 - 40, BASE_H - 34, 80, 1);
    // slide pips
    const n = SLIDES.length, px = BASE_W / 2 - (n * 8) / 2;
    for (let k = 0; k < n; k++) g.fillStyle(k === i ? CY : 0x1b5a5e, 1).fillRect(px + k * 8, BASE_H - 12, 5, 2);
  }

  setSlide(i: number): void { if (this.active) this.layout(Math.max(0, Math.min(SLIDES.length - 1, i))); }

  show(slide: number): void {
    this.active = true;
    for (const o of [this.dim, this.rule, this.body, this.prompt]) o.setVisible(true);
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
    for (const o of [this.dim, this.rule, this.title, this.body, this.prompt]) o.setVisible(false);
    this.marquee?.setVisible(false);
  }
}

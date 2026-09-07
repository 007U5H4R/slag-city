import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting, setSetting } from '@shell/settings';
import { createWorld, WALK_BAND, heroOf } from '@core/sim/state';
import type { WorldState } from '@core/sim/state';
import { ENEMY_NAMES } from '@core/arcade/hud';
import { spawnCrate } from '@core/entities/items';
import { tick } from '@core/sim/tick';
import { createFixedStep, advanceFixedStep, resetFixedStep } from '@core/sim/loop';
import { KeyboardSource } from '../input/keyboard';
import { GamepadSource } from '../input/gamepad';
import { composeInput } from '../input/compose';
import { EntityViews } from '../views/EntityView';
import { DebugOverlay } from '../views/DebugOverlay';
import { Hud } from '../views/Hud';
import { ScorePops } from '../views/ScorePop';
import { NameCardView } from '../views/NameCard';
import { spawnGang } from '@core/entities/gang';
import { enableCrt, crtInstance } from '../crt/CrtPipeline';
import { installFonts } from '../views/fonts';

export class GameScene extends Phaser.Scene {
  world!: WorldState;
  paused = false;
  pauseReason: string | null = null;
  private crtOn = true;
  private fixed = createFixedStep();
  private keyboard!: KeyboardSource;
  private gamepad!: GamepadSource;
  private views!: EntityViews;
  private debug!: DebugOverlay;
  private hud!: Hud;
  private pops!: ScorePops;
  private nameCard!: NameCardView;
  private creditFlash = 0;
  private pauseText!: Phaser.GameObjects.BitmapText;

  constructor() { super('game'); }

  create(): void {
    installFonts(this);
    this.cameras.main.setBackgroundColor('#000000');
    this.applyZoom((this.registry.get('scale') as number | undefined) ?? 1);
    this.game.events.on('rescale', (k: number) => this.applyZoom(k));

    this.crtOn = getSetting('crt');
    enableCrt(this, this.crtOn);
    this.input.keyboard?.on('keydown-C', () => this.setCrt(!this.crtOn));
    if (new URLSearchParams(location.search).has('pattern')) this.scene.launch('pattern');

    this.world = createWorld(1);
    const g = this.add.graphics();
    g.lineStyle(1, 0x333333, 1);
    g.strokeRect(0, WALK_BAND.minY, BASE_W, WALK_BAND.maxY - WALK_BAND.minY);
    this.views = new EntityViews(this, this.add.layer());
    this.debug = new DebugOverlay(this);
    this.hud = new Hud(this);
    this.pops = new ScorePops(this);
    this.nameCard = new NameCardView(this);
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-H', () => this.debug.toggle());
    spawnCrate(this.world, 200, 190, 'lunchpail');
    spawnCrate(this.world, 240, 150, 'gear');
    spawnGang(this.world, 'brawler', 300, 176, 0);
    spawnGang(this.world, 'knife', 340, 150, 1);
    spawnGang(this.world, 'heavy', 360, 200, 2);
    spawnGang(this.world, 'brawler', 380, 168, 1);
    spawnGang(this.world, 'knife', 250, 190, 0);

    this.keyboard = new KeyboardSource(this);
    this.gamepad = new GamepadSource();
    this.gamepad.onDisconnect(() => this.pause('CONTROLLER DISCONNECTED'));
    this.gamepad.onConnect(() => this.resume());
    this.input.keyboard?.on('keydown', () => { if (this.pauseReason === 'CONTROLLER DISCONNECTED') this.resume(); });

    this.pauseText = this.add.bitmapText(BASE_W / 2, BASE_H / 2, 'display16', '')
      .setOrigin(0.5).setDepth(1000).setVisible(false);
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.pause('PAUSED'));
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => { if (this.pauseReason === 'PAUSED') this.resume(); });
  }

  setCrt(on: boolean): void {
    this.crtOn = on;
    enableCrt(this, on);
    if (this.scene.isActive('pattern')) enableCrt(this.scene.get('pattern'), on);
    setSetting('crt', on);
  }

  pause(reason: string): void { this.paused = true; this.pauseReason = reason; this.pauseText.setText(reason).setVisible(true); }
  resume(): void { this.paused = false; this.pauseReason = null; this.pauseText.setVisible(false); resetFixedStep(this.fixed); }

  override update(_time: number, delta: number): void {
    if (this.paused) return;
    const input = composeInput([this.keyboard, this.gamepad]);
    const steps = advanceFixedStep(this.fixed, delta, () => {
      tick(this.world, input);
      for (const ev of this.world.events) {
        if (ev.type === 'score') this.pops.spawn(ev.amount, ev.x, ev.y);
        else if (ev.type === 'namecard') this.nameCard.show(ENEMY_NAMES[ev.kind] ?? ev.kind.toUpperCase());
      }
    });
    this.views.sync(this.world);
    this.pops.step(steps, this.world.camera.x);
    this.nameCard.step(steps);
    const hero = heroOf(this.world);
    this.hud.render({ hp: hero.hp, maxHp: hero.maxHp, score: this.world.score, credits: 0, weapon: null, creditFlash: this.creditFlash });
    this.debug.draw(this.world);
    const s = this.world.shake;
    const off = s.frames > 0 ? (s.frames % 2 === 0 ? s.px : -s.px) : 0;
    this.cameras.main.centerOn(BASE_W / 2 + off, BASE_H / 2);
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
    crtInstance(this)?.setScale(k);
  }
}

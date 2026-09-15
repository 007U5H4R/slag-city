import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting, setSetting } from '@shell/settings';
import { WALK_BAND, heroOf } from '@core/sim/state';
import type { WorldState, SimEvent } from '@core/sim/state';
import { ENEMY_NAMES } from '@core/arcade/hud';
import { tick } from '@core/sim/tick';
import { STAGE1 } from '@core/stage/stage1';
import { spawnFeral } from '@core/entities/feral';
import { spawnBoss } from '@core/entities/boss';
import { createFixedStep, advanceFixedStep, resetFixedStep } from '@core/sim/loop';
import { KeyboardSource } from '../input/keyboard';
import { GamepadSource } from '../input/gamepad';
import { composeInput } from '../input/compose';
import { EntityViews } from '../views/EntityView';
import { DebugOverlay } from '../views/DebugOverlay';
import { Hud } from '../views/Hud';
import { ScorePops } from '../views/ScorePop';
import { NameCardView } from '../views/NameCard';
import { Parallax } from '../views/Parallax';
import { HazardView } from '../views/HazardView';
import { Sparks } from '../views/Sparks';
import { WEAPON_HEAT } from '@core/weapons/heat';
import { enableCrt, crtInstance } from '../crt/CrtPipeline';
import { installFonts } from '../views/fonts';
import { createArcade, reduceArcade } from '@core/arcade/screen-machine';
import type { ArcadeState } from '@core/arcade/screen-machine';
import { newGameWorld, reviveHero } from '@core/arcade/session';
import { EMPTY_INPUT } from '@core/types';
import type { InputFrame } from '@core/types';
import { Attract } from '../screens/Attract';
import { Continue } from '../screens/Continue';
import { GameOver } from '../screens/GameOver';

export class GameScene extends Phaser.Scene {
  world!: WorldState;
  paused = false;
  pauseReason: string | null = null;
  private crtOn = true;
  private fixed = createFixedStep();
  private keyboard!: KeyboardSource;
  private gamepad!: GamepadSource;
  private views!: EntityViews;
  private parallax!: Parallax;
  private hazards!: HazardView;
  private debug!: DebugOverlay;
  private hud!: Hud;
  private pops!: ScorePops;
  private nameCard!: NameCardView;
  private sparks!: Sparks;
  private pauseText!: Phaser.GameObjects.BitmapText;
  // Coin-op machine (ticket 18): screens + credit/continue state drive what the scene shows and whether the sim ticks.
  arcade!: ArcadeState;
  private prevInput: InputFrame = { ...EMPTY_INPUT };
  private attract!: Attract;
  private continueScreen!: Continue;
  private gameOver!: GameOver;

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

    this.world = newGameWorld(1);            // a world to show behind the attract title
    this.arcade = reduceArcade(createArcade(), { type: 'boot' });
    this.parallax = new Parallax(this);
    this.hazards = new HazardView(this, STAGE1.sections.flatMap((s) => s.hazards));
    const g = this.add.graphics();
    g.lineStyle(1, 0x333333, 1);
    g.strokeRect(0, WALK_BAND.minY, BASE_W, WALK_BAND.maxY - WALK_BAND.minY);
    this.views = new EntityViews(this, this.add.layer());
    this.debug = new DebugOverlay(this);
    this.hud = new Hud(this);
    this.pops = new ScorePops(this);
    this.nameCard = new NameCardView(this);
    this.sparks = new Sparks(this);
    this.attract = new Attract(this);
    this.continueScreen = new Continue(this);
    this.gameOver = new GameOver(this);
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-H', () => this.debug.toggle());
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-F', () => spawnFeral(this.world, this.world.camera.x + 360, 150));
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-B', () => spawnBoss(this.world, this.world.camera.x + 300, 176));

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
    const coin = input.coin && !this.prevInput.coin;
    const start = input.start && !this.prevInput.start;
    this.prevInput = input;
    // Coin/start edges reach the machine before the sim sees the frame.
    if (coin) { this.arcade = reduceArcade(this.arcade, { type: 'coin' }); this.sfx('coin'); }
    if (start) {
      const before = this.arcade.screen;
      this.arcade = reduceArcade(this.arcade, { type: 'start' });
      if (this.arcade.screen === 'PLAY' && before !== 'PLAY') {
        if (before === 'CONTINUE') reviveHero(this.world); else this.world = newGameWorld(Date.now() >>> 0);
        this.sfx('start');
      }
    }
    if (coin && this.arcade.screen === 'PLAY' && this.world.stage.heroDead) reviveHero(this.world); // coin-continue
    const steps = advanceFixedStep(this.fixed, delta, () => {
      this.arcade = reduceArcade(this.arcade, { type: 'tick' });
      if (this.arcade.screen !== 'PLAY') return;
      tick(this.world, input);
      this.arcade = reduceArcade(this.arcade, { type: 'score', score: this.world.score });
      for (const ev of this.world.events) {
        if (ev.type === 'heroDead') this.arcade = reduceArcade(this.arcade, { type: 'heroDead' });
        else if (ev.type === 'bossDefeated') { this.arcade = reduceArcade(this.arcade, { type: 'bossDefeated' }); if (import.meta.env.DEV) console.log('[GameScene] STAGE CLEAR — the Foreman defeated'); }
        else this.routeEvent(ev);
      }
    });
    this.renderScreens(steps);
  }

  // Cosmetic sim events (score pops, name-cards, weapon-break sparks); death/defeat are handled by the machine above.
  private routeEvent(ev: SimEvent): void {
    if (ev.type === 'score') this.pops.spawn(ev.amount, ev.x, ev.y);
    else if (ev.type === 'namecard') this.nameCard.show(ENEMY_NAMES[ev.kind] ?? ev.kind.toUpperCase());
    else if (ev.type === 'weaponBreak') this.sparks.burst(ev.x, ev.y);
  }

  // Audio lands in a later ticket; the machine already emits the cues so sound can hook in without touching this flow.
  private sfx(_name: string): void { /* no-op until the audio pass */ }

  private renderScreens(steps: number): void {
    this.parallax.sync(this.world.camera.x, this.world.stage.sectionIndex);
    this.hazards.draw(this.world);
    this.views.sync(this.world);
    this.pops.step(steps, this.world.camera.x);
    this.nameCard.step(steps);
    this.sparks.step(steps, this.world.camera.x);
    this.debug.draw(this.world);

    const scr = this.arcade.screen;
    const inGame = scr === 'PLAY' || scr === 'CONTINUE';
    this.hud.setVisible(inGame);
    if (inGame) {
      const hero = heroOf(this.world);
      this.hud.render({ hp: hero.hp, maxHp: hero.maxHp, score: this.world.score, credits: this.arcade.credits, weapon: hero.weapon ? { kind: hero.weapon.kind, heat: hero.weapon.heat, max: WEAPON_HEAT[hero.weapon.kind] } : null, creditFlash: this.arcade.creditFlash });
    }

    if (scr === 'ATTRACT' || scr === 'COIN') this.attract.show(); else this.attract.hide();
    this.attract.step(this.arcade, steps);
    if (scr === 'CONTINUE') this.continueScreen.show(); else this.continueScreen.hide();
    this.continueScreen.step(this.arcade, steps);
    this.gameOver.stageClear = this.world.stage.bossDefeated;
    if (scr === 'GAME_OVER') this.gameOver.show(); else this.gameOver.hide();
    this.gameOver.step(this.arcade, steps);

    // HISCORE_ENTRY is a pass-through until ticket 19 registers an entry component.
    if (scr === 'HISCORE_ENTRY') this.arcade = reduceArcade(this.arcade, { type: 'entryDone' });

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

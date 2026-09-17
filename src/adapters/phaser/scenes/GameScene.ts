import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { getSetting, setSetting } from '@shell/settings';
import { WALK_BAND, heroOf } from '@core/sim/state';
import type { WorldState, SimEvent } from '@core/sim/state';
import { ENEMY_NAMES } from '@core/arcade/hud';
import { tick } from '@core/sim/tick';
import { STAGE1 } from '@core/stage/stage1';
import { spawnFeral } from '@core/entities/feral';
import { spawnBoss, BOSS_WAVES } from '@core/entities/boss';
import { createFixedStep, advanceFixedStep, resetFixedStep } from '@core/sim/loop';
import { KeyboardSource } from '../input/keyboard';
import { GamepadSource } from '../input/gamepad';
import { composeInput } from '../input/compose';
import { EntityViews } from '../views/EntityView';
import { ensureItemTextures } from '../views/item-textures';
import { DebugOverlay } from '../views/DebugOverlay';
import { Hud } from '../views/Hud';
import { ScorePops } from '../views/ScorePop';
import { NameCardView } from '../views/NameCard';
import { Parallax } from '../views/Parallax';
import { HazardView } from '../views/HazardView';
import { Sparks } from '../views/Sparks';
import { LaserCurtain } from '../views/LaserCurtain';
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
import { HiScoreTable } from '../screens/HiScoreTable';
import { HiScoreEntry } from '../screens/HiScoreEntry';
import { Controls } from '../screens/Controls';
import { StoryIntro } from '../screens/StoryIntro';
import { BossDialogue, BOSS_SCRIPTS } from '../screens/BossDialogue';
import { BossHealthBar } from '../views/BossHealthBar';
import { encodeInput } from '@core/input-codec';
import { hashState } from '@core/sim/hash';
import { ATTRACT } from '@core/arcade/attract';
import { DEFAULT_TABLE, insertScore, qualifies } from '@core/arcade/hiscores';
import type { HiScoreRow } from '@core/arcade/hiscores';
import { createEntry, reduceEntry, entryText } from '@core/arcade/initials';
import type { EntryState } from '@core/arcade/initials';
import { loadTable, saveTable } from '@shell/hiscore-store';
import { AudioAdapter } from '../audio/AudioAdapter';

export class GameScene extends Phaser.Scene {
  world!: WorldState;
  paused = false;
  pauseReason: string | null = null;
  private crtOn = true;
  private fixed = createFixedStep();
  private keyboard!: KeyboardSource;
  private gamepad!: GamepadSource;
  views!: EntityViews;
  private parallax!: Parallax;
  private hazards!: HazardView;
  private lasers!: LaserCurtain;
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
  private hiTable!: HiScoreTable;
  private hiEntry!: HiScoreEntry;
  private controls!: Controls;
  private story!: StoryIntro;
  private bossTalk!: BossDialogue;
  private bossBar!: BossHealthBar;
  private bossTalkKind: 'prefight' | 'defeat' | null = null;
  private bossWave = 0;                  // which gauntlet wave (0,1 = enforcers; last = Kilvish)
  private bossActive = false;            // an encounter is underway (fires the wave-0 taunt once)
  private pendingNextWave = false;       // a sub-boss defeat is awaiting its dialogue → then spawn the next wave
  private pendingBossDefeat = false;     // the final boss defeat is awaiting its dialogue → then STAGE CLEAR
  // Noir story intro (adapter-only): shown once before a fresh game's sim starts; ATTACK advances one slide.
  private storyActive = false;
  private storySlide = 0;
  private audio!: AudioAdapter;
  private prevScreen = '';
  // Hi-scores (ticket 19.4): the live table, loaded from the kv at boot and re-saved on a qualifying entry.
  private table: HiScoreRow[] = DEFAULT_TABLE;
  // HISCORE_ENTRY sub-phase (adapter-only; the machine just parks on HISCORE_ENTRY): enter initials, then show
  // the table for ATTRACT.tableFrames, then dispatch `entryDone`. Non-qualifying scores skip straight to `table`.
  private entryPhase: 'idle' | 'entry' | 'table' = 'idle';
  private entry: EntryState | null = null;
  private entryHighlight: number | null = null;
  private entryTableTimer = 0;
  // Which world the shared views last rendered — switching (attract demo <-> play) resets the view cache.
  private lastWorld: WorldState | null = null;
  // Lava-stage scene cut (adapter-only): a full-screen black plate flashed once, the first time the play world
  // reaches the boss pit, so the pit reveals as a hard cut instead of a continuous scroll. `cutWorld` re-arms
  // the one-shot per fresh game (a new world instance resets `cutDone`).
  private sceneCut!: Phaser.GameObjects.Rectangle;
  private cutWorld: WorldState | null = null;
  private cutDone = false;
  // DEV attract-demo recorder (ticket 19.3): seed of the current PLAY world + the encoded input log.
  private worldSeed = 1;
  private recording: number[] | null = null;

  constructor() { super('game'); }

  create(): void {
    installFonts(this);
    ensureItemTextures(this); // procedural weapon/projectile textures (dropped weapons, laser bolt, glob)
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
    this.lasers = new LaserCurtain(this);
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
    this.hiTable = new HiScoreTable(this);
    this.hiEntry = new HiScoreEntry(this);
    this.controls = new Controls(this);
    this.story = new StoryIntro(this);
    this.bossTalk = new BossDialogue(this);
    this.bossBar = new BossHealthBar(this);
    this.audio = new AudioAdapter(this, getSetting('volume'));
    void loadTable().then((t) => { this.table = t; });
    // Volume: '-'/'=' step 0.1, persisted (Design §; matches the ticket-22 AudioAdapter contract).
    this.input.keyboard?.on('keydown-MINUS', () => this.adjustVolume(-0.1));
    this.input.keyboard?.on('keydown-PLUS', () => this.adjustVolume(0.1));
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-H', () => this.debug.toggle());
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-F', () => spawnFeral(this.world, this.world.camera.x + 360, 150));
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-B', () => spawnBoss(this.world, this.world.camera.x + 300, 176, BOSS_WAVES[0])); // wave 0 = first enforcer (matches the real boss-door spawn + drives the gauntlet)
    if (import.meta.env.DEV) this.input.keyboard?.on('keydown-R', () => this.toggleRecording());

    this.keyboard = new KeyboardSource(this);
    this.gamepad = new GamepadSource();
    this.gamepad.onDisconnect(() => this.pause('CONTROLLER DISCONNECTED'));
    this.gamepad.onConnect(() => this.resume());
    this.input.keyboard?.on('keydown', () => { if (this.pauseReason === 'CONTROLLER DISCONNECTED') this.resume(); });

    this.pauseText = this.add.bitmapText(BASE_W / 2, BASE_H / 2, 'display16', '')
      .setOrigin(0.5).setDepth(1000).setVisible(false);
    // Black plate for the lava-stage scene cut — above everything so the flash reads as a full hard cut.
    this.sceneCut = this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0)
      .setDepth(5000).setVisible(false);
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.pause('PAUSED'));
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => { if (this.pauseReason === 'PAUSED') this.resume(); });
  }

  setCrt(on: boolean): void {
    this.crtOn = on;
    enableCrt(this, on);
    if (this.scene.isActive('pattern')) enableCrt(this.scene.get('pattern'), on);
    setSetting('crt', on);
  }

  pause(reason: string): void { this.paused = true; this.pauseReason = reason; this.pauseText.setText(reason).setVisible(true); this.audio?.mute(true); }
  resume(): void { this.paused = false; this.pauseReason = null; this.pauseText.setVisible(false); resetFixedStep(this.fixed); this.audio?.mute(false); }

  override update(_time: number, delta: number): void {
    if (this.paused) return;
    const input = composeInput([this.keyboard, this.gamepad]);
    const coin = input.coin && !this.prevInput.coin;
    const start = input.start && !this.prevInput.start;
    // Edge-triggered initials-entry controls (HISCORE_ENTRY): up/down cycle the active letter, attack confirms.
    const up = input.up && !this.prevInput.up;
    const down = input.down && !this.prevInput.down;
    const confirm = input.attack && !this.prevInput.attack;
    this.prevInput = input;
    // Coin/start edges reach the machine before the sim sees the frame.
    if (coin) { this.arcade = reduceArcade(this.arcade, { type: 'coin' }); this.sfx('coin'); }
    if (start) {
      const before = this.arcade.screen;
      this.arcade = reduceArcade(this.arcade, { type: 'start' });
      if (this.arcade.screen === 'PLAY' && before !== 'PLAY') {
        if (before === 'CONTINUE') reviveHero(this.world);
        else { this.worldSeed = Date.now() >>> 0; this.world = newGameWorld(this.worldSeed); this.storyActive = true; this.storySlide = 0; this.story.show(0); this.bossTalk.hide(); this.bossTalkKind = null; this.bossWave = 0; this.bossActive = false; this.pendingNextWave = false; this.pendingBossDefeat = false; } // fresh game → play the noir intro first, re-arm the boss gauntlet
        this.sfx('start');
      }
    }
    if (coin && this.arcade.screen === 'PLAY' && this.world.stage.heroDead) reviveHero(this.world); // coin-continue
    // Noir intro: ATTACK advances a slide; past the last one the sim is released and gameplay begins.
    if (this.storyActive && confirm) {
      this.storySlide += 1;
      if (this.storySlide >= this.story.count) { this.storyActive = false; this.story.hide(); }
      else { this.story.setSlide(this.storySlide); this.sfx('coin'); }
    }
    // Boss gauntlet (enforcers → Kilvish): freeze the fight for a pre-fight taunt the first frame the boss appears.
    if (!this.storyActive && this.arcade.screen === 'PLAY' && !this.bossActive
        && this.world.entities.some((e) => e.kind === 'boss')) {
      this.bossActive = true; this.bossWave = 0;
      this.bossTalkKind = 'prefight'; this.bossTalk.start(BOSS_SCRIPTS[this.bossWave]!.pre); this.sfx('coin');
    }
    // ATTACK advances the exchange. Finishing a defeat exchange either spawns the next wave (sub-boss) or
    // releases the deferred STAGE CLEAR (final boss); finishing a taunt just resumes the fight.
    if (this.bossTalk.active && confirm) {
      if (!this.bossTalk.advance()) this.sfx('coin');
      else if (this.bossTalkKind === 'defeat') {
        if (this.pendingNextWave) {
          this.pendingNextWave = false; this.bossWave += 1;
          for (let i = this.world.entities.length - 1; i >= 0; i--) if (this.world.entities[i]!.kind === 'boss') this.world.entities.splice(i, 1); // clear the fallen enforcer
          spawnBoss(this.world, this.world.camera.x + 300, 176, BOSS_WAVES[this.bossWave]);
          this.bossTalkKind = 'prefight'; this.bossTalk.start(BOSS_SCRIPTS[this.bossWave]!.pre); this.sfx('coin');
        } else if (this.pendingBossDefeat) {
          this.pendingBossDefeat = false; this.arcade = reduceArcade(this.arcade, { type: 'bossDefeated' });
          this.bossTalkKind = null; this.bossActive = false;
        }
      } else this.bossTalkKind = null; // taunt done → FIGHT
    }
    const steps = advanceFixedStep(this.fixed, delta, () => {
      this.arcade = reduceArcade(this.arcade, { type: 'tick' });
      if (this.arcade.screen !== 'PLAY') return;
      if (this.storyActive || this.bossTalk.active) return; // freeze the world while the intro / boss dialogue plays
      tick(this.world, input);
      if (this.recording) this.recording.push(encodeInput(input)); // DEV attract-demo capture (19.3)
      this.arcade = reduceArcade(this.arcade, { type: 'score', score: this.world.score });
      for (const ev of this.world.events) {
        if (ev.type === 'heroDead') this.arcade = reduceArcade(this.arcade, { type: 'heroDead' });
        else if (ev.type === 'bossDefeated') {
          // Play this wave's dying exchange (freeze). A sub-boss defeat spawns the next wave on dismiss;
          // the final boss (Kilvish) holds STAGE CLEAR until dismiss (core already set stage.bossDefeated).
          const wave = Math.min(this.bossWave, BOSS_SCRIPTS.length - 1);
          const isFinal = this.bossWave >= BOSS_WAVES.length - 1;
          this.bossTalkKind = 'defeat';
          if (isFinal) this.pendingBossDefeat = true; else this.pendingNextWave = true;
          this.bossTalk.start(BOSS_SCRIPTS[wave]!.defeat);
          if (import.meta.env.DEV) console.log(`[GameScene] ${BOSS_SCRIPTS[wave]!.name} defeated (wave ${this.bossWave}${isFinal ? ', final — STAGE CLEAR' : ''})`);
        }
        else this.routeEvent(ev);
      }
    });
    this.updateHiScoreEntry({ up, down, confirm }, steps);
    this.renderScreens(steps);
  }

  // Drives the HISCORE_ENTRY sub-phase: decide entry-vs-skip once, run the initials reducer on input edges,
  // persist a qualifying score, then hold the table for ATTRACT.tableFrames before releasing the machine.
  private updateHiScoreEntry(edges: { up: boolean; down: boolean; confirm: boolean }, steps: number): void {
    if (this.arcade.screen !== 'HISCORE_ENTRY') { this.entryPhase = 'idle'; this.entry = null; return; }
    if (this.entryPhase === 'idle') {
      // A boss clear always earns a name on the board (congrats); otherwise only a qualifying score does.
      if (this.world.stage.bossDefeated || qualifies(this.table, this.arcade.finalScore)) { this.entryPhase = 'entry'; this.entry = createEntry(); this.entryHighlight = null; }
      else { this.entryPhase = 'table'; this.entryHighlight = null; this.entryTableTimer = ATTRACT.tableFrames; }
    }
    if (this.entryPhase === 'entry' && this.entry) {
      if (edges.up) this.entry = reduceEntry(this.entry, 'up');
      if (edges.down) this.entry = reduceEntry(this.entry, 'down');
      if (edges.confirm) this.entry = reduceEntry(this.entry, 'confirm');
      if (this.entry.done) {
        const row: HiScoreRow = { initials: entryText(this.entry), score: this.arcade.finalScore, credits: Math.max(1, this.arcade.usedThisGame), stage: this.arcade.stageReached, date: new Date().toISOString() };
        const { table, index } = insertScore(this.table, row);
        this.table = table; this.entryHighlight = index;
        void saveTable(table);
        this.sfx('hiscore_confirm');
        this.entryPhase = 'table'; this.entryTableTimer = ATTRACT.tableFrames;
      }
    } else if (this.entryPhase === 'table') {
      this.entryTableTimer -= steps;
      if (this.entryTableTimer <= 0) { this.arcade = reduceArcade(this.arcade, { type: 'entryDone' }); this.entryPhase = 'idle'; this.entry = null; }
    }
  }

  // Cosmetic sim events (score pops, name-cards, weapon-break sparks); death/defeat are handled by the machine above.
  private routeEvent(ev: SimEvent): void {
    if (ev.type === 'score') this.pops.spawn(ev.amount, ev.x, ev.y);
    else if (ev.type === 'namecard') this.nameCard.show(ENEMY_NAMES[ev.kind] ?? ev.kind.toUpperCase());
    else if (ev.type === 'weaponBreak') this.sparks.burst(ev.x, ev.y);
    else if (ev.type === 'sfx') this.audio.sfx(ev.id);
  }

  // Adapter-side cues (coin/start/hiscore_confirm/game_over) route through the procedural AudioAdapter (ticket 22).
  private sfx(name: string): void { this.audio?.sfx(name); }

  private adjustVolume(delta: number): void {
    const v = Math.max(0, Math.min(1, this.audio.getVolume() + delta));
    this.audio.setVolume(v);
    setSetting('volume', v);
  }

  // DEV attract-demo recorder (ticket 19.3): arm before pressing Start so capture begins at world frame 0.
  // On stop, JSON.stringify({ seed, inputs, hash }) lands on window.__replay for the engineer to save to
  // public/assets/replays/attract-demo.json (shipped) + test/replays/attract-demo.json (golden).
  private toggleRecording(): void {
    if (this.recording) {
      const json = JSON.stringify({ seed: this.worldSeed, inputs: this.recording, hash: hashState(this.world) });
      (window as unknown as { __replay?: string }).__replay = json;
      console.log(`[GameScene] attract demo recorded: ${this.recording.length} frames, seed ${this.worldSeed}`);
      this.recording = null;
    } else {
      this.recording = [];
      console.log('[GameScene] attract demo recording armed — press Start to capture from frame 0');
    }
  }

  private renderScreens(steps: number): void {
    const scr = this.arcade.screen;
    const attractActive = scr === 'ATTRACT' || scr === 'COIN';

    // Hard cut into the lava/boss-pit stage: fire once, the first frame the play world reaches the boss door,
    // so the camera snap + parallax swap to the pit happen hidden behind a black flash instead of scrolling in.
    if (this.world !== this.cutWorld) { this.cutWorld = this.world; this.cutDone = false; }
    if (!this.cutDone && this.world.stage.bossDoorReached && (scr === 'PLAY' || scr === 'CONTINUE')) {
      this.cutDone = true;
      this.playLavaSceneCut();
    }

    // Attract owns its own loop + demo world; step it first so `segment`/`demoWorld` are current for the render.
    if (attractActive) this.attract.show(); else this.attract.hide();
    this.attract.step(this.arcade, steps);
    // Controls panel on the attract title card so players can see the button map.
    if (attractActive && this.attract.segment === 'title') this.controls.show(); else this.controls.hide();

    // Render whichever world is current: the attract demo during its segment, otherwise the play world.
    const world = (attractActive && this.attract.segment === 'demo' && this.attract.demoWorld) ? this.attract.demoWorld : this.world;
    if (world !== this.lastWorld) { this.views.reset(); this.lastWorld = world; }

    this.parallax.sync(world.camera.x, world.stage.sectionIndex, world.stage.bossDoorReached);
    this.hazards.draw(world);
    this.lasers.draw(world.camera.x, world.frame);
    this.views.sync(world);
    this.pops.step(steps, world.camera.x);
    this.nameCard.step(steps);
    this.sparks.step(steps, world.camera.x);
    this.debug.draw(world);

    this.story.step(this.arcade.screenFrame, this.storySlide); // noir intro prompt blink (no-op when inactive)
    this.bossTalk.step(this.arcade.screenFrame);                // boss dialogue prompt blink (no-op when inactive)
    const inGame = (scr === 'PLAY' || scr === 'CONTINUE') && !this.storyActive;
    this.hud.setVisible(inGame);
    if (inGame) {
      const hero = heroOf(this.world);
      this.hud.render({ hp: hero.hp, maxHp: hero.maxHp, score: this.world.score, credits: this.arcade.credits, weapon: hero.weapon ? { kind: hero.weapon.kind, heat: hero.weapon.heat, max: WEAPON_HEAT[hero.weapon.kind] } : null, creditFlash: this.arcade.creditFlash });
    }
    // Boss health bar: shown while a live boss is on screen during play; name from the current gauntlet wave.
    const boss = inGame ? this.world.entities.find((e) => e.kind === 'boss' && e.state !== 'dead' && e.state !== 'dying') : undefined;
    this.bossBar.setVisible(!!boss);
    if (boss) this.bossBar.render({ name: BOSS_SCRIPTS[Math.min(this.bossWave, BOSS_SCRIPTS.length - 1)]!.name, hp: boss.hp, maxHp: boss.maxHp, phase2: !!boss.tint });

    if (scr === 'CONTINUE') this.continueScreen.show(); else this.continueScreen.hide();
    this.continueScreen.step(this.arcade, steps);
    this.gameOver.stageClear = this.world.stage.bossDefeated;
    if (scr === 'GAME_OVER') this.gameOver.show(); else this.gameOver.hide();
    this.gameOver.step(this.arcade, steps);

    // Hi-score entry (ticket 19.4): blinking initials during the HISCORE_ENTRY entry phase.
    if (scr === 'HISCORE_ENTRY' && this.entryPhase === 'entry' && this.entry) {
      this.hiEntry.setState(this.entry, this.arcade.screenFrame, this.arcade.finalScore); this.hiEntry.show();
    } else this.hiEntry.hide();
    this.hiEntry.step(steps);

    // Hi-score table: the attract `table` segment (no highlight) and the HISCORE_ENTRY table phase (new row gold).
    if (attractActive && this.attract.segment === 'table') { this.hiTable.setTable(this.table, null); this.hiTable.show(); }
    else if (scr === 'HISCORE_ENTRY' && this.entryPhase === 'table') { this.hiTable.setTable(this.table, this.entryHighlight); this.hiTable.show(); }
    else this.hiTable.hide();
    this.hiTable.step(steps);

    // Music per screen (hard switch; the adapter no-ops when unchanged). game_over cue once on entering GAME_OVER.
    if (scr === 'ATTRACT' || scr === 'COIN' || this.storyActive) this.audio.music('title');
    else if (scr === 'PLAY' || scr === 'CONTINUE') this.audio.music(this.world.stage.bossDoorReached ? 'boss' : 'stage');
    else this.audio.music(null);
    if (scr === 'GAME_OVER' && this.prevScreen !== 'GAME_OVER') this.audio.sfx('game_over');
    this.prevScreen = scr;

    const s = world.shake;
    const off = s.frames > 0 ? (s.frames % 2 === 0 ? s.px : -s.px) : 0;
    this.cameras.main.centerOn(BASE_W / 2 + off, BASE_H / 2);
  }

  // One-shot fade-to-black-and-back that masks the boss-pit transition (~330ms total): quick fade in, brief
  // hold while the camera/parallax settle on the lava section underneath, then reveal.
  private playLavaSceneCut(): void {
    this.sceneCut.setAlpha(0).setVisible(true);
    this.tweens.chain({
      targets: this.sceneCut,
      tweens: [
        { alpha: 1, duration: 120, ease: 'Quad.easeIn' },
        { alpha: 1, duration: 70 },
        { alpha: 0, duration: 140, ease: 'Quad.easeOut' },
      ],
      onComplete: () => this.sceneCut.setVisible(false),
    });
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
    crtInstance(this)?.setScale(k);
  }
}

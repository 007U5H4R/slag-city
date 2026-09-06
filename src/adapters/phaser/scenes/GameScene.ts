import Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { createWorld, WALK_BAND } from '@core/sim/state';
import type { WorldState } from '@core/sim/state';
import { tick } from '@core/sim/tick';
import { createFixedStep, advanceFixedStep, resetFixedStep } from '@core/sim/loop';
import { KeyboardSource } from '../input/keyboard';
import { GamepadSource } from '../input/gamepad';
import { composeInput } from '../input/compose';
import { EntityViews } from '../views/EntityView';

export class GameScene extends Phaser.Scene {
  world!: WorldState;
  paused = false;
  pauseReason: string | null = null;
  private fixed = createFixedStep();
  private keyboard!: KeyboardSource;
  private gamepad!: GamepadSource;
  private views!: EntityViews;
  private pauseText!: Phaser.GameObjects.Text;

  constructor() { super('game'); }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');
    this.applyZoom((this.registry.get('scale') as number | undefined) ?? 1);
    this.game.events.on('rescale', (k: number) => this.applyZoom(k));

    this.world = createWorld(1);
    const g = this.add.graphics();
    g.lineStyle(1, 0x333333, 1);
    g.strokeRect(0, WALK_BAND.minY, BASE_W, WALK_BAND.maxY - WALK_BAND.minY);
    this.views = new EntityViews(this, this.add.layer());

    this.keyboard = new KeyboardSource(this);
    this.gamepad = new GamepadSource();
    this.gamepad.onDisconnect(() => this.pause('CONTROLLER DISCONNECTED'));
    this.gamepad.onConnect(() => this.resume());
    this.input.keyboard?.on('keydown', () => { if (this.pauseReason === 'CONTROLLER DISCONNECTED') this.resume(); });

    this.pauseText = this.add.text(BASE_W / 2, BASE_H / 2, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5).setDepth(1000).setVisible(false);
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.pause('PAUSED'));
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => { if (this.pauseReason === 'PAUSED') this.resume(); });
  }

  pause(reason: string): void { this.paused = true; this.pauseReason = reason; this.pauseText.setText(reason).setVisible(true); }
  resume(): void { this.paused = false; this.pauseReason = null; this.pauseText.setVisible(false); resetFixedStep(this.fixed); }

  override update(_time: number, delta: number): void {
    if (this.paused) return;
    const input = composeInput([this.keyboard, this.gamepad]);
    advanceFixedStep(this.fixed, delta, () => tick(this.world, input));
    this.views.sync(this.world);
  }

  private applyZoom(k: number): void {
    const cam = this.cameras.main;
    cam.setZoom(k);
    cam.centerOn(BASE_W / 2, BASE_H / 2);
  }
}

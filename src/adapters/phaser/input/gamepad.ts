// src/adapters/phaser/input/gamepad.ts
import type { InputFrame } from '@core/types';
import { EMPTY_INPUT } from '@core/types';
import type { InputSource } from './keyboard';

const DEADZONE = 0.5;
// W3C standard mapping indices
const BTN = { south: 0, east: 1, west: 2, select: 8, start: 9, dUp: 12, dDown: 13, dLeft: 14, dRight: 15 } as const;

export class GamepadSource implements InputSource {
  connected = false;
  hadGamepad = false;
  private disconnectCbs: Array<() => void> = [];
  private connectCbs: Array<() => void> = [];

  constructor() {
    window.addEventListener('gamepadconnected', () => { this.connected = true; this.hadGamepad = true; this.connectCbs.forEach((f) => f()); });
    window.addEventListener('gamepaddisconnected', () => { this.connected = this.first() !== null; if (!this.connected) this.disconnectCbs.forEach((f) => f()); });
  }
  onDisconnect(cb: () => void): void { this.disconnectCbs.push(cb); }
  onConnect(cb: () => void): void { this.connectCbs.push(cb); }

  private first(): Gamepad | null {
    for (const g of navigator.getGamepads?.() ?? []) if (g && g.connected) return g;
    return null;
  }

  read(): InputFrame {
    const g = this.first();
    if (!g) return { ...EMPTY_INPUT };
    this.connected = true; this.hadGamepad = true;
    const b = (i: number) => g.buttons[i]?.pressed === true;
    const ax = g.axes[0] ?? 0, ay = g.axes[1] ?? 0;
    return {
      left: b(BTN.dLeft) || ax < -DEADZONE, right: b(BTN.dRight) || ax > DEADZONE,
      up: b(BTN.dUp) || ay < -DEADZONE, down: b(BTN.dDown) || ay > DEADZONE,
      attack: b(BTN.west), jump: b(BTN.south), special: b(BTN.east),
      start: b(BTN.start), coin: b(BTN.select),
    };
  }
}

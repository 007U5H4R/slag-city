// src/adapters/phaser/views/device-copy.ts
// One place for "which button do I press?" wording. Prompts used to name an abstract action ("PRESS ATTACK",
// "INSERT COIN") that a first-time web visitor can't act on: the key is J, the coin is key 5 and free, and a
// phone has neither — its buttons are labelled ATK / COIN / START. Every prompt reads its words from here.
import type Phaser from 'phaser';

export interface DeviceCopy {
  mobile: boolean;
  coin: string;        // how to add a credit
  start: string;       // how to start / confirm at the machine level
  attack: string;      // the advance/confirm button inside the game
  free: string;        // reassurance that a coin costs nothing
}

export function deviceCopy(scene: Phaser.Scene): DeviceCopy {
  const mobile = scene.registry.get('mobile') === true; // set by main.ts before the game scene is created
  return mobile
    ? { mobile, coin: 'TAP COIN', start: 'TAP START', attack: 'TAP ATK', free: 'FREE PLAY' }
    : { mobile, coin: 'PRESS 5 — INSERT COIN', start: 'PRESS ENTER — START', attack: 'PRESS J', free: 'FREE PLAY' };
}

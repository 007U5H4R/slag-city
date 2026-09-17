// src/adapters/phaser/views/fit-text.ts
// Panel text must never draw outside its panel. Copy changes (device-specific prompts, longer wording) have
// overflowed a frame twice; rather than rely on eyeballing each string, any text set into a fixed-width panel goes
// through this: it lays out at natural size and only scales DOWN when the string is wider than the space it has.
import type Phaser from 'phaser';

export function setFitted(text: Phaser.GameObjects.Text, value: string, maxWidth: number): Phaser.GameObjects.Text {
  text.setScale(1).setText(value);
  if (text.width > maxWidth && text.width > 0) text.setScale(maxWidth / text.width);
  return text;
}

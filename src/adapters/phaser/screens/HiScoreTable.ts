// src/adapters/phaser/screens/HiScoreTable.ts
// Hi-score board: `HI-SCORES` title over 10 fixed-width rows `RANK  INITIALS  SCORE` with a gold `1CC` marker
// on 1-credit runs. Shown both by the attract loop (`table` segment, no highlight) and after entry
// (HISCORE_ENTRY table phase, the just-inserted row tinted gold). Plain view class per the 18.3 convention.
import type Phaser from 'phaser';
import { BASE_W, BASE_H } from '@shell/scale';
import { formatScore } from '@core/arcade/hud';
import { rowIs1CC } from '@core/arcade/hiscores';
import type { HiScoreRow } from '@core/arcade/hiscores';
import { HUD_COLOURS } from '../views/hud-colours';

const ROW0_Y = 48;
const ROW_H = 16;
const ROW_X = 96;   // left edge of the RANK/INITIALS/SCORE block (fixed 8-px cells)
const CCC_X = 264;  // 1CC column

export class HiScoreTable {
  private dim: Phaser.GameObjects.Rectangle;
  private title: Phaser.GameObjects.BitmapText;
  private rows: Phaser.GameObjects.BitmapText[] = [];
  private ccc: Phaser.GameObjects.BitmapText[] = [];
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.dim = scene.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, HUD_COLOURS.plate, 0.88)
      .setDepth(3200).setScrollFactor(0).setVisible(false);
    this.title = scene.add.bitmapText(BASE_W / 2, 22, 'display16', 'HI-SCORES')
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setTint(HUD_COLOURS.brass).setVisible(false);
    for (let i = 0; i < 10; i++) {
      this.rows.push(scene.add.bitmapText(ROW_X, ROW0_Y + i * ROW_H, 'hud8', '')
        .setDepth(3201).setScrollFactor(0).setVisible(false));
      this.ccc.push(scene.add.bitmapText(CCC_X, ROW0_Y + i * ROW_H, 'hud8', '')
        .setDepth(3201).setScrollFactor(0).setTint(HUD_COLOURS.gold).setVisible(false));
    }
  }

  setTable(table: HiScoreRow[], highlight: number | null): void {
    for (let i = 0; i < 10; i++) {
      const r = table[i];
      if (!r) { this.rows[i]!.setText(''); this.ccc[i]!.setText(''); continue; }
      const rank = String(i + 1).padStart(2, ' ');
      this.rows[i]!.setText(`${rank}  ${r.initials}  ${formatScore(r.score)}`)
        .setTint(i === highlight ? HUD_COLOURS.gold : HUD_COLOURS.text);
      this.ccc[i]!.setText(rowIs1CC(r) ? '1CC' : '');
    }
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.dim.setVisible(false); this.title.setVisible(false);
    for (const t of this.rows) t.setVisible(false);
    for (const t of this.ccc) t.setVisible(false);
  }

  step(_n: number): void {
    if (!this.active) return;
    this.dim.setVisible(true); this.title.setVisible(true);
    for (const t of this.rows) t.setVisible(true);
    for (const t of this.ccc) t.setVisible(t.text.length > 0);
  }
}

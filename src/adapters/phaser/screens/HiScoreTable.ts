// src/adapters/phaser/screens/HiScoreTable.ts
// Hi-score board in the MODERN UI font (Roboto Mono — monospaced so RANK/INITIALS/SCORE columns still line
// up). `HI-SCORES` title over 10 rows with a gold `1CC` marker on 1-credit runs; the just-inserted row gold.
// Shown by the attract loop (`table` segment, no highlight) and the HISCORE_ENTRY table phase (new row gold).
import type Phaser from 'phaser';
import { BASE_W } from '@shell/scale';
import { formatScore } from '@core/arcade/hud';
import { rowIs1CC } from '@core/arcade/hiscores';
import type { HiScoreRow } from '@core/arcade/hiscores';
import { UI_FONT } from '../views/ui-font';
import { ScifiFrame } from '../views/scifi-frame';

const ROW0_Y = 48;
const ROW_H = 15;
const ROW_X = 104;   // left edge of the RANK/INITIALS/SCORE block
const CCC_X = 256;   // 1CC column
const TEXT = '#e8dcc0', GOLD = '#f0c040', BRASS = '#b08d3c';

export class HiScoreTable {
  private frame: ScifiFrame;
  private title: Phaser.GameObjects.Text;
  private rows: Phaser.GameObjects.Text[] = [];
  private ccc: Phaser.GameObjects.Text[] = [];
  private active = false;

  constructor(scene: Phaser.Scene) {
    this.frame = new ScifiFrame(scene, 3198);
    this.frame.draw(20, 10, 344, 202);
    this.title = scene.add.text(BASE_W / 2, 20, 'HI-SCORES', { fontFamily: UI_FONT, fontSize: '18px', fontStyle: '700', color: BRASS })
      .setOrigin(0.5, 0.5).setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false);
    for (let i = 0; i < 10; i++) {
      this.rows.push(scene.add.text(ROW_X, ROW0_Y + i * ROW_H, '', { fontFamily: UI_FONT, fontSize: '12px', fontStyle: '500', color: TEXT })
        .setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false));
      this.ccc.push(scene.add.text(CCC_X, ROW0_Y + i * ROW_H, '', { fontFamily: UI_FONT, fontSize: '12px', fontStyle: '700', color: GOLD })
        .setDepth(3201).setScrollFactor(0).setResolution(4).setVisible(false));
    }
  }

  setTable(table: HiScoreRow[], highlight: number | null): void {
    for (let i = 0; i < 10; i++) {
      const r = table[i];
      if (!r) { this.rows[i]!.setText(''); this.ccc[i]!.setText(''); continue; }
      const rank = String(i + 1).padStart(2, ' ');
      this.rows[i]!.setText(`${rank}   ${r.initials}   ${formatScore(r.score)}`).setColor(i === highlight ? GOLD : TEXT);
      this.ccc[i]!.setText(rowIs1CC(r) ? '1CC' : '');
    }
  }

  show(): void { this.active = true; }
  hide(): void {
    this.active = false;
    this.frame.hide(); this.title.setVisible(false);
    for (const t of this.rows) t.setVisible(false);
    for (const t of this.ccc) t.setVisible(false);
  }

  step(_n: number): void {
    if (!this.active) return;
    this.frame.show(); this.title.setVisible(true);
    for (const t of this.rows) t.setVisible(true);
    for (const t of this.ccc) t.setVisible(t.text.length > 0);
  }
}

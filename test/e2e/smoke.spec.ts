import { test, expect } from '@playwright/test';

test('boots, integer-scales, takes a coin and start, shows the hero, no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  const canvas = page.locator('#screen canvas');
  await expect(canvas).toBeVisible();
  const dims = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height, cw: c.getBoundingClientRect().width, ch: c.getBoundingClientRect().height }));
  expect(dims.w % 384).toBe(0); expect(dims.h % 224).toBe(0);
  expect(dims.cw / 384).toBe(dims.ch / 224);
  expect(Number.isInteger(Math.round(dims.cw) / 384)).toBe(true);
  await page.waitForFunction(() => (window as unknown as { __slag: { screen(): string } }).__slag.screen() === 'ATTRACT', null, { timeout: 15_000 });
  await page.keyboard.press('5');
  await page.waitForFunction(() => (window as unknown as { __slag: { screen(): string } }).__slag.screen() === 'COIN');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => (window as unknown as { __slag: { heroVisible(): boolean } }).__slag.heroVisible(), null, { timeout: 5_000 });
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

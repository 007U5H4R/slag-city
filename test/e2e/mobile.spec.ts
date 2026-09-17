import { test, expect } from '@playwright/test';

// Mobile smoke: on a touch device in landscape the game boots straight into touch mode (no desktop gate),
// the canvas fills the screen, and COIN + START driven through the on-screen buttons reach PLAY — proving the
// TouchSource → composeInput → arcade-machine path works end to end. Guards the mobile build against regressions.
test.use({ viewport: { width: 812, height: 375 }, hasTouch: true, isMobile: true });

test('mobile: touch mode, screen-filling canvas, coin+start via touch reaches PLAY, no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');

  await expect(page.locator('body')).toHaveClass(/mobile/);   // mobile layout picked
  await expect(page.locator('#touch')).toBeVisible();         // touch overlay shown (landscape)
  await expect(page.locator('#gate')).toBeHidden();           // desktop "keyboard required" gate NOT shown

  // Canvas fits the ~375px-tall landscape screen (aspect-locked to 384:224).
  const canvas = page.locator('#screen canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box, 'canvas has a layout box').toBeTruthy();
  expect(box!.height).toBeGreaterThan(300);

  // Hold a touch button long enough to be sampled by the 60fps input loop (a bare tap can fall between frames).
  const hold = async (sel: string, ms = 240): Promise<void> => {
    await page.evaluate((s) => document.querySelector(s)!.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true })), sel);
    await page.waitForTimeout(ms);
    await page.evaluate((s) => document.querySelector(s)!.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true })), sel);
  };

  await page.waitForFunction(() => (window as unknown as { __slag?: { screen(): string } }).__slag?.screen() !== 'BOOT', null, { timeout: 15000 });
  await hold('#b-coin');
  await hold('#b-start');
  await page.waitForFunction(() => (window as unknown as { __slag?: { screen(): string } }).__slag?.screen() === 'PLAY', null, { timeout: 15000 });

  expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
});

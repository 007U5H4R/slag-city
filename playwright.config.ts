import { defineConfig } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';
const local = !process.env.BASE_URL;

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  // On CI the E-Drive path does not exist; keep artifacts in-repo there.
  outputDir: process.env.CI ? 'test-results' : '/Volumes/E Drive/Dev/.scratch/slag-city-e2e/test-results',
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL, viewport: { width: 1600, height: 900 }, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: local ? { command: 'npm run preview', url: baseURL, reuseExistingServer: true, timeout: 60_000 } : undefined,
});

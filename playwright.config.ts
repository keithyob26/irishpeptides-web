import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://irishpeptides-web.vercel.app',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { storageState: undefined } },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: './e2e/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});

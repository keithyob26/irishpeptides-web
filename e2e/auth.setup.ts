import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

setup('authenticate', async ({ page }) => {
  fs.mkdirSync(path.join(__dirname, '.auth'), { recursive: true });
  await page.goto('/');
  await page.waitForTimeout(1500);
  const pw = page.locator('input[type="password"]').first();
  if (await pw.isVisible({ timeout: 3000 }).catch(() => false)) {
    await pw.fill(process.env.JARVIS_PASSWORD || '');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
  }
  await page.context().storageState({ path: path.join(__dirname, '.auth/user.json') });
});

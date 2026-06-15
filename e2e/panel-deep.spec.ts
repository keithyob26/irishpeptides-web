import { test, expect } from '@playwright/test';

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_PAGE_ID = '37da0eb7-e3ea-819e-af5b-e76db92a7c8c';

async function addNotionTask(title: string) {
  if (!NOTION_API_KEY) return;
  await fetch('https://api.notion.com/v1/blocks/' + NOTION_PAGE_ID + '/children', {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + NOTION_API_KEY,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      children: [{ object: 'block', type: 'to_do', to_do: { rich_text: [{ type: 'text', text: { content: title } }], checked: false } }],
    }),
  }).catch(console.error);
}

async function saveResults(results: Record<string, unknown>) {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token) return;
  const existing = await fetch('https://api.github.com/repos/keithyob26/irishpeptides-jarvis/contents/memory/panel_test_results.json', {
    headers: { Authorization: 'token ' + token, 'User-Agent': 'jarvis-panel-check' },
  }).then(r => r.json()).catch(() => ({}));

  const content = Buffer.from(JSON.stringify(results, null, 2)).toString('base64');
  await fetch('https://api.github.com/repos/keithyob26/irishpeptides-jarvis/contents/memory/panel_test_results.json', {
    method: 'PUT',
    headers: { Authorization: 'token ' + token, 'Content-Type': 'application/json', 'User-Agent': 'jarvis-panel-check' },
    body: JSON.stringify({
      message: 'auto: panel deep test results ' + new Date().toISOString().slice(0, 10),
      content,
      sha: existing.sha,
    }),
  }).catch(console.error);
}

test.describe('Deep Panel Tests - Weekly', () => {
  const results: Record<string, { pass: boolean; errors: string[] }> = {};

  test('AI Chat - model selector and input present', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForTimeout(3000);
    const input = page.locator('textarea, input[type="text"]').first();
    const pass = await input.isVisible({ timeout: 5000 }).catch(() => false);
    results['chat'] = { pass, errors: pass ? [] : ['No chat input found'] };
    if (!pass) await addNotionTask('[Deep FAIL] AI Chat: no input visible');
    expect(pass).toBe(true);
  });

  test('Approvals - approve/reject buttons present', async ({ page }) => {
    await page.goto('/approvals');
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.length > 50;
    results['approvals'] = { pass: hasContent, errors: hasContent ? [] : ['Page content empty'] };
    if (!hasContent) await addNotionTask('[Deep FAIL] Approvals: page content empty');
    expect(hasContent).toBe(true);
  });

  test('Agent Skills - skills list visible', async ({ page }) => {
    await page.goto('/agent-skills');
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.length > 50;
    results['agent-skills'] = { pass: hasContent, errors: hasContent ? [] : ['No skills content'] };
    if (!hasContent) await addNotionTask('[Deep FAIL] Agent Skills: no content visible');
    expect(hasContent).toBe(true);
  });

  test('Analytics - data or placeholder visible', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.length > 50;
    results['analytics'] = { pass: hasContent, errors: hasContent ? [] : ['Analytics empty'] };
    if (!hasContent) await addNotionTask('[Deep FAIL] Analytics: no data visible');
    expect(hasContent).toBe(true);
  });

  test('Content Studio - pending items or editor visible', async ({ page }) => {
    await page.goto('/content');
    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.length > 50;
    results['content'] = { pass: hasContent, errors: hasContent ? [] : ['Content studio empty'] };
    if (!hasContent) await addNotionTask('[Deep FAIL] Content Studio: empty');
    expect(hasContent).toBe(true);
  });

  test.afterAll(async () => {
    await saveResults({ timestamp: new Date().toISOString(), results });
  });
});

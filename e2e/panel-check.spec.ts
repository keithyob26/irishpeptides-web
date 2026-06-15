import { test, expect, Page } from '@playwright/test';

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_PAGE_ID = '37da0eb7-e3ea-819e-af5b-e76db92a7c8c';

const PANELS = [
  { path: '/', name: 'Home' },
  { path: '/chat', name: 'AI Chat' },
  { path: '/content', name: 'Content Studio' },
  { path: '/calendar', name: 'Content Calendar' },
  { path: '/optimizer', name: 'Optimizer' },
  { path: '/competitor', name: 'Competitors' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/revenue', name: 'Revenue' },
  { path: '/subscribers', name: 'Subscribers' },
  { path: '/social', name: 'Social Hub' },
  { path: '/agents', name: 'Agent Network' },
  { path: '/agent-skills', name: 'Agent Skills' },
  { path: '/approvals', name: 'Approvals' },
  { path: '/notion', name: 'Notion' },
  { path: '/health', name: 'System Health' },
  { path: '/site', name: 'Site Control' },
  { path: '/cowork', name: 'Cowork' },
  { path: '/brain', name: 'Brain' },
  { path: '/memory', name: 'Memory' },
  { path: '/self-build', name: 'Self Build' },
  { path: '/settings', name: 'Settings' },
];

async function addNotionTask(panelName: string, error: string) {
  if (!NOTION_API_KEY) return;
  try {
    const res = await fetch('https://api.notion.com/v1/blocks/' + NOTION_PAGE_ID + '/children', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + NOTION_API_KEY,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        children: [{
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ type: 'text', text: { content: `[Panel Check FAIL] ${panelName}: ${error.slice(0, 200)}` } }],
            checked: false,
          },
        }],
      }),
    });
    if (!res.ok) console.error('Notion add failed:', await res.text());
  } catch (e) {
    console.error('Notion error:', e);
  }
}

for (const panel of PANELS) {
  test(`[${panel.name}] panel loads without errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    const response = await page.goto(panel.path, { waitUntil: 'domcontentloaded' });

    const status = response?.status() ?? 200;
    if (status >= 500) {
      await addNotionTask(panel.name, `HTTP ${status}`);
      expect(status, `${panel.name} returned ${status}`).toBeLessThan(500);
    }

    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (bodyText.trim().length < 10) {
      const msg = 'Page appears blank';
      await addNotionTask(panel.name, msg);
      expect(bodyText.trim().length, msg).toBeGreaterThan(10);
    }

    const hasSidebar = await page.locator('nav, aside, [data-sidebar]').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasSidebar) {
      const msg = 'Sidebar not visible';
      await addNotionTask(panel.name, msg);
      expect(hasSidebar, msg).toBe(true);
    }

    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('hydration') &&
      !e.includes('Warning:') &&
      !e.includes('favicon')
    );
    if (criticalErrors.length > 0) {
      await addNotionTask(panel.name, `Console errors: ${criticalErrors[0]}`);
      expect(criticalErrors, 'Console errors found').toHaveLength(0);
    }
  });
}

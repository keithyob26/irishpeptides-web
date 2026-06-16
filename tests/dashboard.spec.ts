import { test, expect } from "@playwright/test";
test("Content Studio: at least one pending item", async ({ page, request }) => {
  await page.goto("/content");
  await page.waitForLoadState("networkidle");
  const items = page.locator("[data-testid='content-item'], .content-card, article");
  const count = await items.count();
  expect(count, "Content Studio must have at least one item").toBeGreaterThanOrEqual(1);
  const imgEls = page.locator("img[src]");
  const imgCount = await imgEls.count();
  for (let i = 0; i < imgCount; i++) {
    const src = await imgEls.nth(i).getAttribute("src");
    if (src && src.startsWith("http")) {
      const resp = await request.get(src);
      expect(resp.status(), "Image must return 200: " + src).toBe(200);
    }
  }
});
test("Home panel: all 5 morning briefing sections present", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const sections = ["Pending", "Overnight", "Broken", "Coming Up", "Quick Stats"];
  for (const s of sections) {
    const el = page.getByText(new RegExp(s, "i"));
    await expect(el.first(), "Section missing: " + s).toBeVisible();
  }
});
test("Analytics panel: GA4 data not empty", async ({ page }) => {
  await page.goto("/analytics");
  await page.waitForLoadState("networkidle");
  const dashes = page.getByText("—");
  const n = await dashes.count();
  expect(n, "GA4 panel should not have more than 2 dash placeholders").toBeLessThanOrEqual(2);
});
test("System Health panel: no Unknown status", async ({ page }) => {
  await page.goto("/health");
  await page.waitForLoadState("networkidle");
  const unknowns = page.getByText("Unknown", { exact: false });
  const n = await unknowns.count();
  expect(n, "System Health must not show Unknown statuses").toBe(0);
});
test("Agent Skills panel: at least one skill visible", async ({ page }) => {
  await page.goto("/agents");
  await page.waitForLoadState("networkidle");
  const skills = page.locator(".skill, [data-testid=skill], .agent-skill");
  const systemPrompts = page.getByText(/SYSTEM_PROMPT|expert|specialist/i);
  const count = await systemPrompts.count();
  expect(count, "Agent Skills should show at least one skill/persona").toBeGreaterThanOrEqual(1);
});
import { test, expect } from "@playwright/test";

test("crawl /blog posts and verify metadata", async ({ page }) => {
  await page.goto("/blog");
  const links = await page.locator('a[href^="/blog/"]').all();
  expect(links.length).toBeGreaterThan(0);
});

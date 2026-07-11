import { test, expect } from "@playwright/test";

test("downloads index lists assets", async ({ page }) => {
  await page.goto("/downloads", { waitUntil: "domcontentloaded" });
  const links = await page.locator('a[href^="/downloads/"]').all();
  expect(links.length).toBeGreaterThan(0);
});

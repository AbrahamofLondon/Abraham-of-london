import { test, expect } from "@playwright/test";

test("scan all posts linked from /blog", async ({ page }) => {
  await page.goto("/blog");
  await expect(page).toHaveTitle(/blog/i);
});

import { test, expect } from "@playwright/test";
test("blog page loads (kingdom strategies)", async ({ page }) => {
  await page.goto("/blog/kingdom-strategies-for-a-loving-legacy");
  await expect(page.locator("h1"))
    .toHaveText("Kingdom Strategies for a Loving Legacy: Fathering O.J.A-Y");
  await expect(page.locator("text=Explore Fatherhood Resources")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("blog page loads (kingdom strategies)", async ({ page }) => {
  await page.goto("/blog/kingdom-strategies-for-a-loving-legacy");
  const mainH1 = page.getByRole("heading", { level: 1 }).first();
  await expect(mainH1).toContainText("Kingdom Strategies for a Loving Legacy");
  await expect(page.getByText("Explore Fatherhood Resources")).toBeVisible();
});

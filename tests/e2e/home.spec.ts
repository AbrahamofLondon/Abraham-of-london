import { test, expect } from "@playwright/test";
test("Home renders key UI", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
});

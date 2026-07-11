import { test, expect } from "@playwright/test";
import { stabilizeForSnapshot } from "./utils";
test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1280, height: 900 }); });
test("home snapshot", async ({ page }) => { await page.goto("/"); await stabilizeForSnapshot(page); await expect(page).toHaveScreenshot("home-1280x900.png", { fullPage: true, maxDiffPixelRatio: 0.03 }); });

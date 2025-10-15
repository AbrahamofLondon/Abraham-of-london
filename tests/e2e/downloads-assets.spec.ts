import { test, expect } from "@playwright/test";

test("asset ok", async ({ page }) => {
  const resp = await page.goto("/assets/sample.txt", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBe(200);
  const text = await page.locator("pre, body").innerText().catch(() => "");
  expect(text).toContain("sample asset");
});

test("pdf ok", async ({ page }) => {
  const resp = await page.goto("/downloads/Fathering_Without_Fear.pdf", { waitUntil: "domcontentloaded" });
  expect(resp?.status()).toBe(200);
});

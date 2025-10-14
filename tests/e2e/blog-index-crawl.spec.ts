import { test, expect } from "@playwright/test";
import { originOf } from "./utils";
test("crawl /blog posts and verify metadata", async ({ page }, ti) => {
  await page.goto("/blog");
  const links = new Set<string>(await page.$$eval('a[href^="/blog/"]', as => as.map(a => (a as HTMLAnchorElement).getAttribute("href")||"").filter(Boolean)));
  expect(links.size).toBeGreaterThan(0);
  const base = originOf(page.url());
  for (const href of links) {
    await ti.step(href, async () => {
      await page.goto(href);
      const h1 = page.locator("h1"); await expect(h1).toBeVisible();
      const h1Text = (await h1.first().textContent())?.trim() || "";
      const canonical = page.locator('head link[rel="canonical"]'); await expect(canonical).toHaveCount(1);
      const canonicalHref = await canonical.getAttribute("href"); expect(canonicalHref).toMatch(/^https?:\/\//);
      expect(canonicalHref!.startsWith(base)).toBeTruthy();
      const ogTitle = await page.locator('head meta[property="og:title"]').getAttribute("content");
      expect(ogTitle).toBeTruthy();
      if (ogTitle && h1Text) expect(ogTitle===h1Text || ogTitle.startsWith(h1Text) || h1Text.startsWith(ogTitle)).toBeTruthy();
    });
  }
});

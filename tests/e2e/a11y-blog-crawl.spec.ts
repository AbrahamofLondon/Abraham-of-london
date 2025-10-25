// tests/e2e/a11y-blog-crawl.spec.ts
import { test, expect } from "@playwright/test";
import { runAxe } from "./axe-helpers";

test.describe("A11y blog crawl (axe)", () => {
  test("scan all posts linked from /blog", async ({ page }, testInfo) => {
    await page.goto("/blog");

    const links = new Set<string>(
      await page.$$eval('a[href^="/blog/"]', (as) =>
        as
          .map((a) => (a as HTMLAnchorElement).getAttribute("href") || "")
          .filter(Boolean),
      ),
    );
    expect(links.size).toBeGreaterThan(0);

    for (const href of links) {
      await test.step(`axe ${href}`, async () => {
        await page.goto(href, { waitUntil: "domcontentloaded" });
        await runAxe(page, { tags: ["wcag2a", "wcag2aa"] });
        await testInfo.attach("page.txt", {
          body: Buffer.from(href),
          contentType: "text/plain",
        });
      });
    }
  });
});

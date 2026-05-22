import { expect, test, type Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const readerPath = "/editorials/series/the-minds-clay/the-living-basket";

function channelValues(color: string): number[] {
  return color
    .match(/\d+(?:\.\d+)?/g)
    ?.slice(0, 3)
    .map(Number) ?? [];
}

function luminance(color: string): number {
  const channels = channelValues(color).map((value) => {
    const normalized = value / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  );
}

async function readReaderSurface(page: Page) {
  const reader = page.locator(".mind-clay-reader");
  const firstParagraph = page.locator(".mind-clay-reader-body .aol-mdx-content p").first();

  await expect(reader).toBeVisible();
  await expect(firstParagraph).toBeVisible();

  return page.evaluate(() => {
    const readerNode = document.querySelector(".mind-clay-reader");
    const bodyNode = document.querySelector(
      ".mind-clay-reader-body .aol-mdx-content p",
    );

    if (!(readerNode instanceof HTMLElement) || !(bodyNode instanceof HTMLElement)) {
      throw new Error("Editorial reader surface is incomplete.");
    }

    const readerStyle = getComputedStyle(readerNode);
    const bodyStyle = getComputedStyle(bodyNode);
    const readerTop = readerNode.getBoundingClientRect().top;
    const bodyTop = bodyNode.getBoundingClientRect().top;

    return {
      backgroundColor: readerStyle.backgroundColor,
      bodyColor: bodyStyle.color,
      bodyTopDistance: bodyTop - readerTop,
      colorScheme: readerStyle.colorScheme,
    };
  });
}

test.describe("editorial series reader surface", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`stays readable with ${colorScheme} browser preference`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        colorScheme,
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();

      await page.goto(`${BASE_URL}${readerPath}`);

      const surface = await readReaderSurface(page);
      const contrast = Math.abs(
        luminance(surface.bodyColor) - luminance(surface.backgroundColor),
      );

      expect(surface.colorScheme).toContain("dark");
      expect(luminance(surface.backgroundColor)).toBeLessThan(0.08);
      expect(luminance(surface.bodyColor)).toBeGreaterThan(0.45);
      expect(contrast).toBeGreaterThan(0.4);
      expect(surface.bodyTopDistance).toBeLessThan(720);

      await context.close();
    });
  }
});

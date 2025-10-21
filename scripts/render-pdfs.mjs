import puppeteer from "puppeteer";

async function renderOne(url, outPath) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox","--font-render-hinting=medium"]
  });
  try {
    const page = await browser.newPage();

    // Avoid font swapping/FOUT: wait for network quiet
    await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

    // Detect 404 / non-200
    const resp = await page.waitForResponse((r) => r.url() === url);
    const status = resp.status();
    if (status >= 400) {
      console.warn(`! Skipping (${status}) ${url}`);
      return false;
    }

    // Use print CSS & keep brand colors
    await page.emulateMediaType("print");

    await page.pdf({
      path: outPath,
      printBackground: true,
      preferCSSPageSize: true, // respect @page size/margins from BrandFrame
      timeout: 120000
    });

    return true;
  } finally {
    await browser.close();
  }
}

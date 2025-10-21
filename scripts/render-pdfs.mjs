// scripts/render-pdfs.mjs  (ESM, no BOM)
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function arg(k, def = undefined) {
  const idx = process.argv.indexOf(k);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const BASE = arg("--base", "http://localhost:5555");
const OUT = arg("--out", path.join(process.cwd(), "public", "downloads"));
const TIMEOUT = parseInt(arg("--timeout", "120000"), 10);

// You can expand this list or import from a probe script / API
const ROUTES = [
  "/print/leadership-playbook",
  "/print/mentorship-starter-kit",
  "/print/family-altar-liturgy",
  "/print/standards-brief",
  "/print/principles-for-my-son",
  "/print/scripture-track-john14",
  "/print/fathering-without-fear-teaser",
  "/print/fathering-without-fear-teaser-mobile",
  // "/print/a6/principles-for-my-son-two-up", // example, only if exists
  "/print/a6/leaders-cue-card-two-up",
  "/print/a6/brotherhood-cue-card-two-up",
];

const MAP = {
  "/print/leadership-playbook": "Leadership_Playbook.pdf",
  "/print/mentorship-starter-kit": "Mentorship_Starter_Kit.pdf",
  "/print/family-altar-liturgy": "Family_Altar_Liturgy.pdf",
  "/print/standards-brief": "Standards_Brief.pdf",
  "/print/principles-for-my-son": "Principles_for_My_Son.pdf",
  "/print/scripture-track-john14": "Scripture_Track_John14.pdf",
  "/print/fathering-without-fear-teaser": "Fathering_Without_Fear_Teaser_A4.pdf",
  "/print/fathering-without-fear-teaser-mobile": "Fathering_Without_Fear_Teaser_Mobile.pdf",
  "/print/a6/leaders-cue-card-two-up": "Leaders_Cue_Card.pdf",
  "/print/a6/brotherhood-cue-card-two-up": "Brotherhood_Cue_Card.pdf",
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  console.log(`Base: ${BASE}`);
  console.log(`Out : ${OUT}`);

  await ensureDir(OUT);

  // headless:new (Puppeteer 22), no-sandbox for CI
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=full"],
  });

  try {
    for (const route of ROUTES) {
      const url = `${BASE}${route}`;
      const filename = MAP[route] || route.replace(/[^\w/.-]+/g, "_").split("/").filter(Boolean).slice(-1)[0] + ".pdf";
      const outPath = path.join(OUT, filename);

      process.stdout.write(`→ Rendering ${url} → ${path.relative(process.cwd(), outPath)}\n`);

      const page = await browser.newPage();

      // If PDFs are produced on CI, prefer local fonts by disabling remote font CSS
      // (Your page CSS already declares @font-face for local files)
      const useLocalFonts = process.env.PDF_ON_CI === "1" || process.env.PDF_ON_CI === "true";
      if (useLocalFonts) {
        await page.setRequestInterception(true);
        page.on("request", (req) => {
          const u = req.url();
          if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u)) {
            return req.abort();
          }
          req.continue();
        });
      }

      await page.goto(url, { waitUntil: "networkidle2", timeout: TIMEOUT });

      // Use print stylesheet
      await page.emulateMediaType("print");

      // Ensure webfonts and images are settled
      if (page.evaluateHandle) {
        try { await page.evaluate(() => (document.fonts?.ready ?? Promise.resolve())); } catch {}
      }
      await page.waitForTimeout(300); // tiny settle time for layout

      await page.pdf({
        path: outPath,
        printBackground: true,
        preferCSSPageSize: true,
        // You can force A4 if a page forgot @page size:
        // format: "A4",
      });

      await page.close();
      console.log(`  ✔ Saved ${path.relative(process.cwd(), outPath)}`);
    }
  } finally {
    await browser.close();
  }

  console.log("\nAll done.");
}

main().catch((e) => {
  console.error("\n--- Error in render-pdfs.mjs ---\n", e);
  process.exit(1);
});

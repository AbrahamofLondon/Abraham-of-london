// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const BASE = process.env.PDF_BASE_URL || "http://localhost:3000";
const OUTDIR = resolve("public", "downloads");
if (!existsSync(OUTDIR)) mkdirSync(OUTDIR, { recursive: true });

const JOBS = [
  { url: `${BASE}/print/leadership-playbook`, out: resolve(OUTDIR, "Leadership_Playbook.pdf"), title: "Leadership Playbook — 30•60•90" },
  { url: `${BASE}/print/mentorship-starter-kit`, out: resolve(OUTDIR, "Mentorship_Starter_Kit.pdf"), title: "Mentorship Starter Kit" },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  for (const job of JOBS) {
    console.log(`→ Rendering ${job.url} → ${job.out}`);
    await page.goto(job.url, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: job.out,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "10mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
  }

  await browser.close();
  console.log("✓ PDFs written to /public/downloads");
})();

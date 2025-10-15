// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const baseArg = args.find(a => a.startsWith("--base="));
const outArg  = args.find(a => a.startsWith("--out="));
const BASE = (baseArg ? baseArg.split("=")[1] : "http://localhost:5555").replace(/\/+$/, "");
const OUT  = outArg ? outArg.split("=")[1] : "public/downloads";

const TASKS = [
  // NEW — Fathering teaser (A4 + Mobile)
  {
    path: "/print/fathering-without-fear-teaser",
    file: "Fathering_Without_Fear_Teaser.pdf",
  },
  {
    path: "/print/fathering-without-fear-teaser-mobile",
    file: "Fathering_Without_Fear_Teaser-Mobile.pdf",
  },

  // Existing
  { path: "/print/leadership-playbook", file: "Leadership_Playbook.pdf" },
  { path: "/print/mentorship-starter-kit", file: "Mentorship_Starter_Kit.pdf" },
  { path: "/print/a6/leaders-cue-card-two-up", file: "Leaders_Cue_Card_Two_Up.pdf" },
  { path: "/print/a6/brotherhood-cue-card-two-up", file: "Brotherhood_Cue_Card_Two_Up.pdf" },
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

(async () => {
  console.log(`Base: ${BASE}`);
  console.log(`Out : ${path.resolve(OUT)}`);
  console.log(
    "Paths:",
    TASKS.map(t => t.path).join(", ")
  );

  await ensureDir(OUT);
  const browser = await chromium.launch({ headless: true, args: ["--font-render-hinting=none"] });

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      deviceScaleFactor: 2,
    });

    for (const t of TASKS) {
      const url = `${BASE}${t.path}`;
      const outFile = path.join(OUT, t.file);
      process.stdout.write(`→ Rendering ${url} → ${outFile}\n`);

      const page = await context.newPage();
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        if (!resp || !resp.ok()) {
          const status = resp ? resp.status() : "NO-RESPONSE";
          console.log(`  ! Skipping (${status}) ${url}`);
          await page.close();
          continue;
        }

        // Make sure webfonts are ready before print
        try { await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve())); } catch {}

        // Respect CSS @page size set inside the route
        await page.pdf({
          path: outFile,
          printBackground: true,
          preferCSSPageSize: true,
        });

        console.log(`  ✔ Saved ${outFile}`);
      } catch (err) {
        console.error(`  ✖ Failed ${url}\n${err}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\nAll done.");
})();

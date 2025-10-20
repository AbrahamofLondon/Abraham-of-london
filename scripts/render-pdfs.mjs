// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith("--base="));
const outArg = args.find((a) => a.startsWith("--out="));

const BASE = (baseArg ? baseArg.split("=")[1] : "http://localhost:5555").replace(/\/+$/, "");
const OUT = outArg ? outArg.split("=")[1] : "public/downloads";

// UPDATED TASKS LIST using the provided list for consistent naming
const TASKS = [
  { path: "/print/leadership-playbook", file: "Leadership_Playbook.pdf" },
  { path: "/print/mentorship-starter-kit", file: "Mentorship_Starter_Kit.pdf" },
  { path: "/print/family-altar-liturgy", file: "Family_Altar_Liturgy.pdf" },
  { path: "/print/standards-brief", file: "Standards_Brief.pdf" },
  { path: "/print/principles-for-my-son", file: "Principles_for_My_Son.pdf" },
  { path: "/print/a6/principles-for-my-son-two-up", file: "Principles_for_My_Son_Cue_Card.pdf" },
  { path: "/print/a6/leaders-cue-card-two-up", file: "Leaders_Cue_Card.pdf" },
  { path: "/print/a6/brotherhood-cue-card-two-up", file: "Brotherhood_Cue_Card.pdf" },
  { path: "/print/scripture-track-john14", file: "Scripture_Track_John14.pdf" },
  { path: "/print/fathering-without-fear-teaser", file: "Fathering_Without_Fear_Teaser_A4.pdf" },
  { path: "/print/fathering-without-fear-teaser-mobile", file: "Fathering_Without_Fear_Teaser_Mobile.pdf" },
  // NOTE: If you need to include the old "fathering-without-fear-teaser-mobile" as well, 
  // you'll need to update the source path to match the old filename, or confirm which path is correct.
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

(async () => {
  console.log(`Base: ${BASE}`);
  console.log(`Out : ${path.resolve(OUT)}`);
  console.log("Paths:", TASKS.map((t) => t.path).join(", "));
  await ensureDir(OUT);

  const browser = await chromium.launch({
    headless: true,
    args: ["--font-render-hinting=none"],
  });

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
          console.log(`  ! Skipping (${resp ? resp.status() : "NO-RESPONSE"}) ${url}`);
          await page.close();
          continue;
        }

        // Wait for webfonts if present (pure JS; no TS assertions)
        try {
          await page.evaluate(() => {
            if (document.fonts && document.fonts.ready) {
              return document.fonts.ready;
            }
            return Promise.resolve();
          });
        } catch {
          /* non-fatal */
        }

        await page.pdf({
          path: outFile,
          printBackground: true,
          preferCSSPageSize: true, // uses @page size from the print route
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
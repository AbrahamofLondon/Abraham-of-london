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
  // existing
  { path: "/print/fathering-without-fear-teaser",        file: "fathering-without-fear-teaser.pdf" },
  { path: "/print/fathering-without-fear-teaser-mobile", file: "fathering-without-fear-teaser-mobile.pdf" },
  { path: "/print/leadership-playbook",                  file: "leadership-playbook.pdf" },
  { path: "/print/mentorship-starter-kit",               file: "mentorship-starter-kit.pdf" },
  { path: "/print/a6/leaders-cue-card-two-up",           file: "leaders-cue-card-two-up.pdf" },
  { path: "/print/a6/brotherhood-cue-card-two-up",       file: "brotherhood-cue-card-two-up.pdf" },

  // NEW — premium set
  { path: "/print/principles-for-my-son",                file: "principles-for-my-son.pdf" },
  { path: "/print/a6/principles-for-my-son-cue-card-two-up", file: "principles-for-my-son-cue-card.pdf" },
  { path: "/print/scripture-track-john14",               file: "scripture-track-john14.pdf" },
  { path: "/print/standards-brief",                      file: "standards-brief.pdf" },
  { path: "/print/family-altar-liturgy",                 file: "family-altar-liturgy.pdf" },
];

async function ensureDir(dir) { await fs.mkdir(dir, { recursive: true }); }

(async () => {
  console.log(`Base: ${BASE}`);
  console.log(`Out : ${path.resolve(OUT)}`);
  console.log("Paths:", TASKS.map(t => t.path).join(", "));
  await ensureDir(OUT);

  const browser = await chromium.launch({ headless: true, args: ["--font-render-hinting=none"] });
  try {
    const context = await browser.newContext({ acceptDownloads: true, deviceScaleFactor: 2 });

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
        try { await page.evaluate(() => (document.fonts ? (window as any).document.fonts.ready : Promise.resolve())); } catch {}
        await page.pdf({
          path: outFile,
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
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

// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";

const args = process.argv.slice(2);
const getArg = (key, def) => {
  const hit = args.find((a) => a.startsWith(`--${key}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};

const BASE = (getArg("base", "http://localhost:5555") || "").replace(/\/+$/, "");
const OUT  = getArg("out", "public/downloads");
const ONLY = getArg("only", "").split(",").map(s => s.trim()).filter(Boolean);

// NOTE: keep filenames kebab-case to satisfy the validator.
const TASKS = [
  // Books / teasers
  { path: "/print/fathering-without-fear-teaser",        file: "fathering-without-fear-teaser.pdf" },
  { path: "/print/fathering-without-fear-teaser-mobile", file: "fathering-without-fear-teaser-mobile.pdf" },

  // Packs
  { path: "/print/leadership-playbook",                  file: "leadership-playbook.pdf" },
  { path: "/print/mentorship-starter-kit",               file: "mentorship-starter-kit.pdf" },

  // Formation & liturgy
  { path: "/print/family-altar-liturgy",                 file: "family-altar-liturgy.pdf" },
  { path: "/print/scripture-track-john14",               file: "scripture-track-john14.pdf" },

  // Principles
  { path: "/print/principles-for-my-son",                file: "principles-for-my-son.pdf" },
  { path: "/print/principles-for-my-son-cue-card",       file: "principles-for-my-son-cue-card.pdf" },

  // Covenants
  { path: "/print/brotherhood-covenant",                 file: "brotherhood-covenant.pdf" },

  // A6 two-up cards
  { path: "/print/a6/leaders-cue-card-two-up",           file: "leaders-cue-card-two-up.pdf" },
  { path: "/print/a6/brotherhood-cue-card-two-up",       file: "brotherhood-cue-card-two-up.pdf" },

  // (optional) add more here as you create new /print routes.
];

function filterTasks(tasks, only) {
  if (!only || only.length === 0) return tasks;
  // allow filtering by any substring of path or exact output filename
  return tasks.filter(t => only.some(o => t.path.includes(o) || t.file.includes(o)));
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForFonts(page) {
  try {
    await page.evaluate(() => (document.fonts ? document.fonts.ready : Promise.resolve()));
  } catch {}
}

(async () => {
  const run = filterTasks(TASKS, ONLY);

  console.log(`Base: ${BASE}`);
  console.log(`Out : ${path.resolve(OUT)}`);
  console.log(`Tasks (${run.length}):`, run.map(t => `${t.path} → ${t.file}`).join(", "));
  await ensureDir(OUT);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--font-render-hinting=none",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const context = await browser.newContext({
      acceptDownloads: true,
      deviceScaleFactor: 2,
    });

    for (const t of run) {
      const url = `${BASE}${t.path}`;
      const outFile = path.join(OUT, t.file);
      process.stdout.write(`\n→ Rendering ${url}\n   ↳ ${outFile}\n`);

      const page = await context.newPage();
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        if (!resp || !resp.ok()) {
          console.error(`  ✖ Skipping (${resp ? resp.status() : "NO-RESPONSE"}) ${url}`);
          await page.close();
          continue;
        }

        await waitForFonts(page);

        // prefer CSS @page size from each print route
        await page.pdf({
          path: outFile,
          printBackground: true,
          preferCSSPageSize: true,
          // (Margins are controlled by each /print route via @page; leave unset here.)
        });

        console.log(`  ✔ Saved ${t.file}`);
      } catch (err) {
        console.error(`  ✖ Failed ${url}\n    ${err?.stack || err}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log("\nAll done.");
})();

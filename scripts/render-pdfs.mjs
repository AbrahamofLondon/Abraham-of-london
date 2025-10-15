// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const [k, v] = token.split("=");
    if (v !== undefined) out[k.slice(2)] = v;
    else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[k.slice(2)] = argv[++i];
    } else out[k.slice(2)] = true;
  }
  return out;
}

const args = parseArgs(process.argv);
const base = args.base || "http://localhost:5555";
const outDir = path.resolve(args.out || "public/downloads");
const TIMEOUT_MS = 60_000;

const jobs = [
  { route: "/print/leadership-playbook",          file: "Leadership_Playbook.pdf" },
  { route: "/print/mentorship-starter-kit",       file: "Mentorship_Starter_Kit.pdf" },
  { route: "/print/a6/leaders-cue-card-two-up",   file: "Leaders_Cue_Card_Two_Up.pdf" },
  { route: "/print/a6/brotherhood-cue-card-two-up", file: "Brotherhood_Cue_Card_Two_Up.pdf" },
];

(async () => {
  console.log(`Base: ${base}`);
  console.log(`Out : ${outDir}`);
  console.log(
    "Paths:",
    jobs.map(j => j.route).join(", ")
  );

  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  for (const job of jobs) {
    const url = new URL(job.route, base).toString();
    const dest = path.join(outDir, job.file);
    process.stdout.write(`→ Rendering ${url} → ${dest}\n`);

    try {
      const resp = await page.goto(url, { waitUntil: "networkidle", timeout: TIMEOUT_MS });
      if (!resp || !resp.ok()) {
        const sc = resp ? resp.status() : "no-response";
        process.stdout.write(`  ! Skipping (${sc}) ${url}\n`);
        continue;
      }

      // Wait for webfonts (valid JS, no TS)
      await page.evaluate(async () => {
        if (document.fonts && typeof document.fonts.ready?.then === "function") {
          try { await document.fonts.ready; } catch {}
        }
      });

      await page.emulateMedia({ media: "print" });
      await page.pdf({
        path: dest,
        printBackground: true,
        preferCSSPageSize: true, // use @page size from the route
        timeout: 0
      });

      process.stdout.write(`  ✔ Saved ${dest}\n`);
    } catch (err) {
      process.stdout.write(`  ✖ Failed ${url}\n${(err && err.message) || err}\n`);
    }
  }

  await browser.close();
  process.stdout.write("\nAll done.\n");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

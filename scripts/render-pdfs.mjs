// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const baseArg = getArg("--base", "http://localhost:5555");
const outDir = path.resolve(getArg("--out", "public/downloads"));

const PATHS = [
  "/print/leadership-playbook",
  "/print/mentorship-starter-kit",
  "/print/a6/leaders-cue-card-two-up",
  "/print/a6/brotherhood-cue-card-two-up",
];

const FILES = {
  "/print/leadership-playbook": "Leadership_Playbook.pdf",
  "/print/mentorship-starter-kit": "Mentorship_Starter_Kit.pdf",
  "/print/a6/leaders-cue-card-two-up": "Leaders_Cue_Card_Two_Up.pdf",
  "/print/a6/brotherhood-cue-card-two-up": "Brotherhood_Cue_Card_Two_Up.pdf",
};

const TIMEOUT_MS = 90000;

console.log(`Base: ${baseArg}`);
console.log(`Out : ${outDir}`);
console.log(`Paths: ${PATHS.join(", ")}`);

await fs.promises.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  deviceScaleFactor: 2,
  colorScheme: "light",
  viewport: { width: 1200, height: 1697 }, // A4-ish portrait viewport
});

// Block obvious third-party/analytics to speed up “idle”
await ctx.route("**/*", (route) => {
  const url = route.request().url();
  if (/\b(googletagmanager|google-analytics|gtag|hotjar|segment|clarity|cdn.amplitude)\b/i.test(url)) {
    return route.abort();
  }
  route.continue();
});

try {
  for (const p of PATHS) {
    const url = new URL(p, baseArg).toString();
    const outPath = path.join(outDir, FILES[p] || p.replace(/\W+/g, "_") + ".pdf");
    process.stdout.write(`→ Rendering ${url} → ${outPath}\n`);

    const page = await ctx.newPage();

    try {
      // Be lenient: don't use networkidle. Load, fonts, images, tiny settle wait.
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });

      // Wait for Next to hydrate <main>, or a custom hook
      await waitAny(page, [
        () => page.waitForSelector(".print-ready", { timeout: 8000 }),
        () => page.waitForSelector("main", { timeout: 8000 }),
      ]);

      // Ensure webfonts & images are ready
      await page.evaluate(async () => {
        if (document.fonts?.ready) {
          try { await (document as any).fonts.ready; } catch {}
        }
        const imgs = Array.from(document.images || []);
        await Promise.all(imgs.map(img => {
          if (img.complete) return;
          return new Promise(res => { img.addEventListener("load", () => res(null)); img.addEventListener("error", () => res(null)); });
        }));
      });

      // Soft idle (don’t fail if it doesn’t go fully idle)
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(250);

      await page.pdf({
        path: outPath,
        printBackground: true,
        preferCSSPageSize: true, // respect @page size in the route
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      });
      process.stdout.write(`  ✔ Saved ${outPath}\n`);
    } catch (err) {
      if (/ERR_CONNECTION_REFUSED/i.test(String(err))) {
        process.stdout.write(`  ✖ Failed ${url} (server not running at ${baseArg})\n`);
      } else if (/Timeout/i.test(String(err))) {
        process.stdout.write(`  ✖ Timeout ${url}\n`);
      } else if (/404|500/.test(await safeStatus(page))) {
        process.stdout.write(`  ! Skipping (${await safeStatus(page)}) ${url}\n`);
      } else {
        process.stdout.write(`  ✖ Error ${url}\n`);
      }
    } finally {
      await page.close().catch(() => {});
    }
  }
} finally {
  await ctx.close().catch(() => {});
  await browser.close().catch(() => {});
}

function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
}

async function safeStatus(page) {
  try { return String((await page.response())?.status()); } catch { return ""; }
}

async function waitAny(page, fns) {
  return Promise.any(fns.map(fn => fn()));
}

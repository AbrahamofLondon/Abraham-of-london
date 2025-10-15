// scripts/render-pdfs.mjs
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import http from "http";

function parseArgs(argv) {
  const out = { base: "http://localhost:3000", outDir: "public/downloads", paths: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") out.base = argv[++i];
    else if (a === "--out") out.outDir = argv[++i];
    else if (a === "--paths") out.paths = argv[++i].split(",").map(s => s.trim()).filter(Boolean);
  }
  return out;
}

function toFilenameFromPath(p) {
  // /print/leadership-playbook -> Leadership_Playbook.pdf
  const name = p.split("/").filter(Boolean).pop() || "document";
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, "_") + ".pdf";
}

async function waitForServer(url, timeoutMs = 15000) {
  const started = Date.now();
  const u = new URL(url);
  const host = u.hostname;
  const port = Number(u.port || (u.protocol === "https:" ? 443 : 80));
  const path = u.pathname.endsWith("/") ? u.pathname : u.pathname + "/";
  return new Promise((resolveWait, rejectWait) => {
    (function poll() {
      const req = http.get({ host, port, path }, res => {
        res.resume();
        resolveWait(true);
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) rejectWait(new Error(`Timed out waiting for ${url}`));
        else setTimeout(poll, 500);
      });
    })();
  });
}

const args = parseArgs(process.argv);

// default set of known print routes (will skip 404s gracefully)
const defaultPaths = [
  "/print/leadership-playbook",
  "/print/mentorship-starter-kit",
  "/print/a6/leaders-cue-card-two-up",
  "/print/a6/brotherhood-cue-card-two-up"
];

const paths = args.paths.length ? args.paths : defaultPaths;

console.log(`Base: ${args.base}`);
console.log(`Out : ${resolve(args.outDir)}`);
console.log(`Paths: ${paths.join(", ")}`);

await waitForServer(args.base).catch(() => {
  console.error(`\n✖ No server responding at ${args.base}. Start one first (e.g. "npm run print:serve").\n`);
  process.exit(1);
});

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

for (const p of paths) {
  const url = new URL(p.replace(/^\/*/, "/"), args.base).toString();
  const outFile = resolve(args.outDir, toFilenameFromPath(p));
  try {
    console.log(`→ Rendering ${url} → ${outFile}`);
    const resp = await page.goto(url, { waitUntil: "networkidle" });
    if (!resp || resp.status() >= 400) {
      console.warn(`  ! Skipping (${resp ? resp.status() : "no response"}) ${url}`);
      continue;
    }
    await page.emulateMedia({ media: "print" });
    mkdirSync(dirname(outFile), { recursive: true });
    await page.pdf({
      path: outFile,
      printBackground: true,
      format: "A4",
      scale: 1,
      preferCSSPageSize: true
    });
    console.log(`  ✔ Saved ${outFile}`);
  } catch (err) {
    console.error(`  ✖ Failed ${url}`);
    console.error(err);
  }
}

await browser.close();
console.log("\nAll done.");

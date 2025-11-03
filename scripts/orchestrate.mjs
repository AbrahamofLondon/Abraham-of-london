// scripts/orchestrate.mjs (ESM; Windows-safe; NO BOM)
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import os from "node:os";

// ───────────────────────────────────────────────────────────
// Config / args
// ───────────────────────────────────────────────────────────
const ROOT = process.cwd();
const OUT_DIR     = getArg("--outDir", path.join(ROOT, "public", "downloads"));
const MIRROR_DIR  = getArg("--mirrorDir", path.join(ROOT, "public", "resources"));
const STRICT      = getBool("--strict", false);
const DRY_RUN     = getBool("--dry-run", true);               // safe default
const REBUILD     = getBool("--rebuild", false);
const FIX_REDIRECTS = getBool("--fix-redirects", true);
const PORT_OPT    = parseInt(getArg("--port", ""), 10) || 0;  // 0 → auto
const PDF_ON_CI   = getBool("--pdf-on-ci", process.env.PDF_ON_CI === "1");
const MANIFEST    = getArg("--manifest", path.join(ROOT, ".orchestrate-manifest.json"));
const REVERT_FROM = getArg("--revert-manifest", "");
const RENDER      = getBool("--render", true);
const VALIDATE    = getBool("--validate", true);

const SCRIPTS = {
  probe: path.join(ROOT, "scripts", "probe-print-routes.mjs"),
  render: path.join(ROOT, "scripts", "render-pdfs.mjs"),
  validate: path.join(ROOT, "scripts", "validate-downloads.mjs"),
  auditDownloads: path.join(ROOT, "scripts", "audit-downloads.mjs"),
};

const FALLBACK_ROUTES = [
  "/print/leadership-playbook",
  "/print/mentorship-starter-kit",
  "/print/family-altar-liturgy",
  "/print/standards-brief",
  "/print/principles-for-my-son",
  "/print/scripture-track-john14",
  "/print/fathering-without-fear-teaser",
  "/print/fathering-without-fear-teaser-mobile",
  "/print/a6/leaders-cue-card-two-up",
  "/print/a6/brotherhood-cue-card-two-up",
];
const FALLBACK_FILEMAP = {
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

// ───────────────────────────────────────────────────────────
// Main Orchestration
// ───────────────────────────────────────────────────────────
(async () => {
  if (REVERT_FROM) return await revertFromManifest(REVERT_FROM);

  // 1) Build if needed
  const hasBuild = fssync.existsSync(path.join(ROOT, ".next", "BUILD_ID"));
  if (REBUILD || !hasBuild) {
    console.log("[orchestrate] Building project...");
    await run("npm", ["run", "build"], { env: envPlus({ PDF_ON_CI: PDF_ON_CI ? "1" : undefined }) });
  }

  // 2) Start server on a free port
  const port = PORT_OPT || (await pickPort(5555));
  const base = `http://localhost:${port}`;
  const server = await startNext(port);
  // Wait for health check (tolerate missing endpoint)
  await waitFor(`${base}/api/health`, 15000).catch(() => {});

  // 3) Discover routes (probe > fallback)
  const { routes, fileMap } = await determinePrintRoutes(base);
  console.log(`[orchestrate] Discovered ${routes.length} print routes.`);

  // 4) Render PDFs
  await ensureDir(OUT_DIR);
  if (RENDER) {
    if (exists(SCRIPTS.render)) {
      console.log(`[orchestrate] Rendering PDFs to ${rel(OUT_DIR)}...`);
      await run("node", [SCRIPTS.render, "--base", base, "--out", OUT_DIR], {
        env: envPlus({ PDF_ON_CI: PDF_ON_CI ? "1" : undefined }),
      });
    } else {
      console.warn("[orchestrate] render-pdfs.mjs missing → skip render");
    }
  }

  // 5) Validate downloads
  if (VALIDATE && exists(SCRIPTS.validate)) {
    console.log("[orchestrate] Validating downloads...");
    await run("node", [SCRIPTS.validate, ...(STRICT ? ["--strict"] : [])], {
      env: envPlus({ DOWNLOADS_STRICT: STRICT ? "1" : "0" }),
      ignoreFail: !STRICT,
    });
  }

  // 6) Normalize names + guarded redirects
  if (FIX_REDIRECTS && exists(SCRIPTS.auditDownloads)) {
    console.log("[orchestrate] Auditing downloads/fixing redirects...");
    await run("node", [SCRIPTS.auditDownloads, "--fix", "--rename"], { env: envPlus() });
  }

  // 7) Mirror to secondary (revertable)
  console.log(`[orchestrate] Mirroring PDFs to ${rel(MIRROR_DIR)} (Dry Run: ${DRY_RUN})...`);
  const mirrorOps = await mirror(OUT_DIR, MIRROR_DIR, { dry: DRY_RUN });
  
  // 8) Write manifest
  await fs.writeFile(
    MANIFEST,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        system: os.platform(),
        base,
        outDir: OUT_DIR,
        mirrorDir: MIRROR_DIR,
        dryRun: DRY_RUN,
        pdfOnCi: PDF_ON_CI,
        routes,
        mirrorOps,
      },
      null,
      2
    )
  );

  // 9) Stop server and summarize
  await stop(server);
  console.log("\n──────── Orchestrate summary ────────");
  console.log(`Base     : ${base}`);
  console.log(`Downloads: ${rel(OUT_DIR)}`);
  console.log(`Mirror   : ${rel(MIRROR_DIR)} (${mirrorOps.copied.length} files ${DRY_RUN ? "simulated" : "copied"})`);
  console.log(`Manifest : ${rel(MANIFEST)}`);
  console.log(`Dry-run  : ${DRY_RUN ? "YES" : "NO"}`);
  console.log("Done.");

})().catch(async (e) => {
  console.error("\n[orchestrate] FATAL:", e);
  process.exit(1);
});

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────
function getArg(k, d) { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i+1] : d; }
function getBool(k, d) {
  if (!process.argv.includes(k)) return d;
  const v = getArg(k, "");
  if (v === "" || v === undefined) return true;
  return ["1","true","yes","on"].includes(String(v).toLowerCase());
}
function envPlus(extra = {}) { return Object.fromEntries(Object.entries({ ...process.env, ...extra }).filter(([,v]) => v !== undefined)); }
function exists(p) { return fssync.existsSync(p); }
function rel(p) { return path.relative(ROOT, p); }
async function ensureDir(d) { await fs.mkdir(d, { recursive: true }); }

async function run(cmd, args, { env, cwd = ROOT, ignoreFail = false } = {}) {
  return new Promise((resolve, reject) => {
    const ps = spawn(cmd, args, { cwd, env, stdio: "inherit", shell: process.platform === "win32" });
    ps.on("exit", (code) => (code === 0 || ignoreFail ? resolve(code) : reject(new Error(`${cmd} ${args.join(" ")} → ${code}`))));
    ps.on("error", reject);
  });
}

async function pickPort(start = 5555) {
  for (let p = start; p < start + 100; p++) if (await isFree(p)) return p;
  return start;
}
async function isFree(port) {
  const net = await import("node:net"); // Dynamic import is safe in this async function
  return new Promise((res) => {
    const srv = net.default.createServer().once("error", () => res(false)).once("listening", () => srv.close(() => res(true)));
    srv.listen(port, "0.0.0.0");
  });
}
async function startNext(port) {
  console.log(`[orchestrate] Starting Next on :${port}…`);
  const ps = spawn("npm", ["run", "print:serve", "--", "-p", String(port)], {
    cwd: ROOT, env: envPlus(), stdio: "inherit", shell: process.platform === "win32",
  });
  await sleep(1200);
  return ps;
}
async function stop(ps) {
  if (!ps || ps.killed) return;
  console.log("[orchestrate] Stopping Next…");
  return new Promise((resolve) => {
    ps.on("exit", resolve);
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(ps.pid), "/T", "/F"], { stdio: "ignore" }).on("exit", resolve);
    else { ps.kill("SIGTERM"); setTimeout(() => ps.kill("SIGKILL"), 3000); }
  });
}
async function waitFor(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const r = await fetch(url, { redirect: "manual" }); if (r.ok || r.status === 200) return true; } catch {}
    await sleep(500);
  }
  return false;
}
async function determinePrintRoutes(base) {
  if (exists(SCRIPTS.probe)) {
    try {
      const { pathToFileURL } = await import("node:url");
      const mod = await import(pathToFileURL(SCRIPTS.probe).href);
      if (typeof mod.probeRoutes === "function") {
        const data = await mod.probeRoutes(base);
        return {
          routes: data.routes?.length ? data.routes : FALLBACK_ROUTES,
          fileMap: { ...FALLBACK_FILEMAP, ...(data.fileMap || {}) },
        };
      }
    } catch (e) { console.warn("[orchestrate] probe failed → fallback.", e?.message || e); }
  }
  return { routes: FALLBACK_ROUTES, fileMap: FALLBACK_FILEMAP };
}
async function mirror(fromDir, toDir, { dry = true } = {}) {
  if (!exists(fromDir)) return { copied: [], skipped: [], notes: ["source missing"] };
  await fs.mkdir(toDir, { recursive: true });
  const entries = await fs.readdir(fromDir);
  const copied = [], skipped = [];
  for (const f of entries) {
    if (!/\.pdf$/i.test(f)) continue;
    const src = path.join(fromDir, f);
    const dst = path.join(toDir, f);
    // Check if destination exists AND is newer than source
    const needs = !(exists(dst) && fssync.statSync(dst).mtimeMs >= fssync.statSync(src).mtimeMs);
    if (!needs) { skipped.push({ src, dst, reason: "up-to-date" }); continue; }
    if (!dry) await fs.copyFile(src, dst);
    copied.push({ src, dst, dryRun: dry });
  }
  return { copied, skipped };
}
async function revertFromManifest(file) {
  if (!exists(file)) { console.error(`[orchestrate] Manifest not found: ${file}`); process.exit(1); }
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  const ops = data?.mirrorOps?.copied || [];
  let removed = 0;
  for (const op of ops) { try { if (op.dst && exists(op.dst)) { await fs.unlink(op.dst); removed++; } } catch {} }
  console.log(`[orchestrate] Reverted ${removed} files from ${rel(file)}`);
}

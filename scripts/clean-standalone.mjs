// scripts/clean-standalone.mjs
//
// Runs AFTER `next build --webpack` to strip heavyweight directories
// from `.next/standalone/` before @netlify/plugin-nextjs packages them
// into `___netlify-server-handler`.
//
// Why this exists:
// `outputFileTracingExcludes` in next.config.mjs is supposed to prune
// these from the standalone trace output, but the excludes are not
// being honoured (observed: sass, @esbuild, .contentlayer/.cache, and
// .netlify/ all survive in standalone despite being listed as excluded).
// This script is a deterministic post-build cleanup that guarantees
// those directories are removed before the Netlify plugin packages the
// handler. Without it, the handler exceeds the 250 MB Lambda limit.
//
// What it removes:
// - public/           — static assets served via Netlify CDN, not the function
// - .netlify/         — recursive self-inclusion from outputFileTracingRoot
// - .contentlayer/.cache/ — build cache, not needed at runtime
// - .contentlayer/generated/ per-doc JSON (keeps _index.json)
// - node_modules build-only packages still traced despite excludes
// - dev/test/repo dirs that leaked through tracing
// - workspace-only media, backups, and root build/env artifacts
//
// Node middleware note:
// @netlify/plugin-nextjs packages Node middleware for Edge from
// `.next/server/middleware.js.nft.json`, but the emitted middleware bundle
// still requires sibling `.next/server/webpack-runtime.js`. Keep that runtime
// in standalone output and in the NFT trace so Edge packaging does not create
// middleware.js without its Webpack runtime.

import fs from "node:fs";
import path from "node:path";

const standalone = path.join(process.cwd(), ".next", "standalone");
const nextServer = path.join(process.cwd(), ".next", "server");

// ── Vercel lock-file guard ────────────────────────────────────────────────────
// Next.js 16 lock-file recreation was a temporary workaround for a stale
// Vercel project-level outputDirectory=".next" setting. Keep it opt-in only;
// with native Vercel Next.js output detection, creating this marker can
// interfere with the adapter's post-build output packaging.
const nextDir = path.join(process.cwd(), ".next");
if (process.env.AOL_RECREATE_NEXT_LOCK === "1" && fs.existsSync(nextDir)) {
  const lockPath = path.join(nextDir, "lock");
  try {
    fs.closeSync(fs.openSync(lockPath, "a"));
    console.log("[clean-standalone] recreated .next/lock for Vercel packager");
  } catch (error) {
    if (
      ["EBUSY", "EPERM", "EACCES"].includes(error?.code) &&
      fs.existsSync(lockPath)
    ) {
      console.warn("[clean-standalone] .next/lock already exists but is locked; continuing");
    } else {
      throw error;
    }
  }
}

if (!fs.existsSync(standalone)) {
  console.log("[clean-standalone] .next/standalone not found — skipping");
  process.exit(0);
}

// Directories to remove entirely
const REMOVE_DIRS = [
  "public",
  ".netlify",
  ".contentlayer/.cache",
  ".agents",
  ".claude",
  ".github",
  ".husky",
  ".githooks",
  "tests",
  "scripts",
  "playwright-report",
  "briefs-contamination-backup",
  "deepseek-terminal-chat",
  "triage_hold",
  "CRM",
  "OGR",
  "src",
  "bin",
  "artifacts",
  "config",
  "private_storage",
  "private",
  ".vercel",
  "_tests_",
  "archive",
  "auth-migration",
  "backup",
  "old manual",
  "test-results",
  "tmp",
  "video",
  // Build-only node_modules
  "node_modules/sass",
  "node_modules/@esbuild",
  "node_modules/webpack",
  "node_modules/webpack-sources",
  "node_modules/enhanced-resolve",
  "node_modules/@webassemblyjs",
  "node_modules/acorn",
  "node_modules/acorn-import-attributes",
  "node_modules/eslint-scope",
  "node_modules/postcss",
  "node_modules/critters",
  "node_modules/beasties",
  "node_modules/terser",
  "node_modules/terser-webpack-plugin",
  "node_modules/uglify-js",
  "node_modules/caniuse-lite",
  "node_modules/browserslist",
  "node_modules/electron-to-chromium",
  "node_modules/@img",
  "node_modules/typescript",
  "node_modules/puppeteer",
  "node_modules/puppeteer-core",
  "node_modules/@puppeteer",
  "node_modules/chrome-headless-shell",
  "node_modules/.cache",
];

let saved = 0;

for (const rel of REMOVE_DIRS) {
  const abs = path.join(standalone, rel);
  if (fs.existsSync(abs)) {
    const before = dirSize(abs);
    fs.rmSync(abs, { recursive: true, force: true });
    saved += before;
    console.log(
      `[clean-standalone] removed ${rel} (${(before / 1024 / 1024).toFixed(1)} MB)`,
    );
  }
}

// Root workspace artifacts are not runtime inputs for the standalone server.
// Keep this scoped to top-level files so generated server assets remain intact.
const REMOVE_ROOT_FILE_PATTERNS = [
  /^\.env(?:\..*)?$/,
  /^\.netlify-env\.json$/,
  /^\.git$/,
  /^.*\.log$/,
  /^.*\.mp4$/,
  /^.*\.pdf$/,
  /^.*\.tsbuildinfo$/,
];

for (const entry of fs.readdirSync(standalone, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!REMOVE_ROOT_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
    continue;
  }

  const abs = path.join(standalone, entry.name);
  const before = fs.statSync(abs).size;
  fs.rmSync(abs, { force: true });
  saved += before;
  console.log(
    `[clean-standalone] removed root artifact ${entry.name} (${(before / 1024 / 1024).toFixed(1)} MB)`,
  );
}

// Remove per-document JSON from .contentlayer/generated/ but KEEP _index.json
const clGenerated = path.join(standalone, ".contentlayer", "generated");
if (fs.existsSync(clGenerated)) {
  let removed = 0;
  for (const typeDir of fs.readdirSync(clGenerated, { withFileTypes: true })) {
    if (!typeDir.isDirectory()) continue;
    const typePath = path.join(clGenerated, typeDir.name);
    for (const file of fs.readdirSync(typePath)) {
      if (file === "_index.json") continue; // keep
      const fp = path.join(typePath, file);
      const st = fs.statSync(fp);
      if (st.isFile()) {
        removed += st.size;
        fs.unlinkSync(fp);
      }
    }
  }
  if (removed > 0) {
    saved += removed;
    console.log(
      `[clean-standalone] pruned per-doc JSON from .contentlayer/generated (${(removed / 1024 / 1024).toFixed(1)} MB)`,
    );
  }
}

ensureNetlifyNodeMiddlewareRuntime();

console.log(
  `[clean-standalone] total saved: ${(saved / 1024 / 1024).toFixed(1)} MB`,
);

function ensureNetlifyNodeMiddlewareRuntime() {
  const middlewareEntry = path.join(nextServer, "middleware.js");
  const middlewareTrace = `${middlewareEntry}.nft.json`;
  const middlewareRuntime = path.join(nextServer, "webpack-runtime.js");

  if (
    !fs.existsSync(middlewareEntry) ||
    !fs.existsSync(middlewareTrace) ||
    !fs.existsSync(middlewareRuntime)
  ) {
    console.log(
      "[clean-standalone] node middleware runtime trace not present — skipping",
    );
    return;
  }

  const standaloneRuntime = path.join(
    standalone,
    ".next",
    "server",
    "webpack-runtime.js",
  );
  fs.mkdirSync(path.dirname(standaloneRuntime), { recursive: true });
  fs.copyFileSync(middlewareRuntime, standaloneRuntime);
  console.log(
    "[clean-standalone] preserved .next/server/webpack-runtime.js for Netlify node middleware",
  );

  const trace = JSON.parse(fs.readFileSync(middlewareTrace, "utf8"));
  if (!Array.isArray(trace.files)) {
    throw new Error(
      "[clean-standalone] invalid middleware NFT trace: files must be an array",
    );
  }

  const runtimeTraceEntry = "webpack-runtime.js";
  const hasRuntimeTrace = trace.files.some(
    (file) => path.posix.normalize(String(file)) === runtimeTraceEntry,
  );
  if (hasRuntimeTrace) return;

  trace.files.push(runtimeTraceEntry);
  fs.writeFileSync(middlewareTrace, `${JSON.stringify(trace, null, 2)}\n`);
  console.log(
    "[clean-standalone] added webpack-runtime.js to node middleware NFT trace",
  );
}

function dirSize(dir) {
  let total = 0;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += dirSize(full);
      else if (entry.isFile()) total += fs.statSync(full).size;
    }
  } catch {}
  return total;
}

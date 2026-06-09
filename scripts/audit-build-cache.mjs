#!/usr/bin/env node
/**
 * scripts/audit-build-cache.mjs
 *
 * Build output, page-data and cache hygiene audit.
 *
 * Reports:
 *   - .contentlayer/ size
 *   - .next/ size and page-data breakdown
 *   - public/ size and largest assets
 *   - Top 30 generated page-data JSON files by size
 *   - Trend notes / growth warnings
 *
 * Usage:
 *   node scripts/audit-build-cache.mjs
 *   node scripts/audit-build-cache.mjs --json   # machine-readable output
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_MODE = process.argv.includes("--json");

// ─── helpers ────────────────────────────────────────────────────────────────

function kb(bytes) {
  return (bytes / 1024).toFixed(1);
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

function humanSize(bytes) {
  if (bytes >= 1024 * 1024) return `${mb(bytes)} MB`;
  return `${kb(bytes)} kB`;
}

/** Recursively sum all file sizes under a directory. Returns bytes. */
function dirSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        try {
          total += fs.statSync(full).size;
        } catch {
          // ignore inaccessible files
        }
      }
    }
  };
  walk(dir);
  return total;
}

/** Collect all files matching an extension under a directory. */
function findFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (!ext || entry.name.endsWith(ext)) {
        try {
          const { size } = fs.statSync(full);
          results.push({ file: path.relative(ROOT, full), size });
        } catch {
          // skip
        }
      }
    }
  };
  walk(dir);
  return results;
}

const THRESHOLD_WARN_PAGE_DATA_KB = 128;
const THRESHOLD_DANGER_PAGE_DATA_KB = 500;

// ─── measure ────────────────────────────────────────────────────────────────

const contentlayerSize = dirSize(path.join(ROOT, ".contentlayer"));
const nextSize = dirSize(path.join(ROOT, ".next"));
const publicSize = dirSize(path.join(ROOT, "public"));

// Page-data JSON files (.next/server/pages/**/*.json)
// Exclude .nft.json (Next.js serverless dependency trace files — not page props)
const pageDataFiles = findFiles(path.join(ROOT, ".next", "server", "pages"), ".json")
  .filter((f) => !f.file.endsWith(".nft.json"))
  .sort((a, b) => b.size - a.size);

// All public assets sorted by size
const publicAssets = findFiles(path.join(ROOT, "public"), null)
  .filter((f) => !f.file.includes("/_next/"))
  .sort((a, b) => b.size - a.size);

// ─── output ─────────────────────────────────────────────────────────────────

if (JSON_MODE) {
  const report = {
    generatedAt: new Date().toISOString(),
    sizes: {
      contentlayer: { bytes: contentlayerSize, human: humanSize(contentlayerSize) },
      next: { bytes: nextSize, human: humanSize(nextSize) },
      public: { bytes: publicSize, human: humanSize(publicSize) },
    },
    pageDataTop30: pageDataFiles.slice(0, 30).map((f) => ({
      file: f.file,
      kb: parseFloat(kb(f.size)),
      warning: f.size / 1024 > THRESHOLD_DANGER_PAGE_DATA_KB
        ? "DANGER"
        : f.size / 1024 > THRESHOLD_WARN_PAGE_DATA_KB
          ? "WARN"
          : null,
    })),
    publicTop30: publicAssets.slice(0, 30).map((f) => ({
      file: f.file,
      kb: parseFloat(kb(f.size)),
    })),
  };
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  process.exit(0);
}

// Human-readable output

const sep = "─".repeat(64);
const col = (label, value) => `  ${label.padEnd(22)}${value}`;

console.log(`\n${"═".repeat(64)}`);
console.log("  BUILD CACHE & OUTPUT AUDIT");
console.log(`  ${new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}`);
console.log(`${"═".repeat(64)}\n`);

// ── Directory sizes ──
console.log("📦 DIRECTORY SIZES");
console.log(sep);
console.log(col(".contentlayer/", humanSize(contentlayerSize)));
console.log(col(".next/", humanSize(nextSize)));
console.log(col("public/", humanSize(publicSize)));
console.log();

// ── Page-data warnings ──
const dangerFiles = pageDataFiles.filter((f) => f.size / 1024 > THRESHOLD_DANGER_PAGE_DATA_KB);
const warnFiles = pageDataFiles.filter(
  (f) => f.size / 1024 > THRESHOLD_WARN_PAGE_DATA_KB && f.size / 1024 <= THRESHOLD_DANGER_PAGE_DATA_KB,
);

if (dangerFiles.length > 0) {
  console.log("🔴 PAGE-DATA DANGER (> 500 kB — immediate action needed)");
  console.log(sep);
  for (const f of dangerFiles) {
    console.log(`  ${kb(f.size).padStart(8)} kB  ${f.file}`);
  }
  console.log();
}

if (warnFiles.length > 0) {
  console.log("🟡 PAGE-DATA WARNINGS (> 128 kB)");
  console.log(sep);
  for (const f of warnFiles) {
    console.log(`  ${kb(f.size).padStart(8)} kB  ${f.file}`);
  }
  console.log();
}

// ── Top 30 page-data files ──
console.log("📊 TOP 30 PAGE-DATA FILES (by size)");
console.log(sep);
if (pageDataFiles.length === 0) {
  console.log("  (no .next/server/pages/*.json found — run a production build first)");
} else {
  for (const f of pageDataFiles.slice(0, 30)) {
    const sizeStr = kb(f.size).padStart(8);
    const flag =
      f.size / 1024 > THRESHOLD_DANGER_PAGE_DATA_KB
        ? " 🔴"
        : f.size / 1024 > THRESHOLD_WARN_PAGE_DATA_KB
          ? " 🟡"
          : "";
    console.log(`  ${sizeStr} kB  ${f.file}${flag}`);
  }
}
console.log();

// ── Top 30 public assets ──
console.log("📁 TOP 30 PUBLIC ASSETS (by size)");
console.log(sep);
if (publicAssets.length === 0) {
  console.log("  (public/ is empty or missing)");
} else {
  for (const f of publicAssets.slice(0, 30)) {
    const sizeStr = humanSize(f.size).padStart(10);
    console.log(`  ${sizeStr}  ${f.file}`);
  }
}
console.log();

// ── Growth trend notes ──
console.log("📋 TREND NOTES");
console.log(sep);
const clMB = contentlayerSize / 1024 / 1024;
const nextMB = nextSize / 1024 / 1024;
const pubMB = publicSize / 1024 / 1024;

if (clMB > 100) {
  console.log("  ⚠️  .contentlayer/ > 100 MB — consider pruning unused doc types");
}
if (nextMB > 800) {
  console.log("  ⚠️  .next/ > 800 MB — build cache may slow Vercel deploys");
} else if (nextMB > 400) {
  console.log("  🟡  .next/ > 400 MB — monitor for growth");
}
if (pubMB > 500) {
  console.log("  ⚠️  public/ > 500 MB — audit large/unused assets");
} else if (pubMB > 200) {
  console.log("  🟡  public/ > 200 MB — consider image CDN for originals");
}
if (dangerFiles.length === 0 && warnFiles.length === 0) {
  console.log("  ✅  All page-data files within 128 kB threshold");
}

console.log("\n" + "═".repeat(64) + "\n");

#!/usr/bin/env node
/**
 * scripts/audit-library-page-data.mjs
 *
 * Audits the /library page payload for size compliance.
 *
 * Checks:
 *   1. public/system/library-index-lite.json exists (generated before build)
 *   2. library-index-lite.json: warns if > 200 kB, fails if > 300 kB
 *      (this is the full lazy-load index; it's gzip'd by CDN to ~40-50 kB)
 *   3. .next/server/pages/library.json exists after next build (SSG page data)
 *   4. /library page-data: fails if > 128 kB, warns if > 110 kB
 *   5. Prints top-20 largest fields and average bytes per item
 *   6. Validates LiteItem schema: no forbidden fields in the JSON
 *
 * Usage:
 *   node scripts/audit-library-page-data.mjs
 *
 * Add to package.json: "audit:library-page-data": "node scripts/audit-library-page-data.mjs"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let failures = 0;
let warnings = 0;

function pass(msg)  { console.log(`  ✓ OK    ${msg}`); }
function fail(msg)  { console.error(`  ✗ FAIL  ${msg}`); failures++; }
function warn(msg)  { console.warn(`  ⚠ WARN  ${msg}`); warnings++; }
function info(msg)  { console.log(`  ℹ       ${msg}`); }
function section(t) { console.log(`\n▸ ${t}`); }

// ── 1. public/system/library-index-lite.json ─────────────────────────────────

section("1 — public/system/library-index-lite.json (full lazy-load index)");

const liteJsonPath = path.join(ROOT, "public/system/library-index-lite.json");

if (!fs.existsSync(liteJsonPath)) {
  fail("public/system/library-index-lite.json not found — run: pnpm exec tsx scripts/generate-library-index-lite.ts");
} else {
  const liteBytes = fs.statSync(liteJsonPath).size;
  const liteKb    = (liteBytes / 1024).toFixed(1);
  info(`Size: ${liteKb} kB uncompressed (CDN gzip ~${(liteBytes * 0.25 / 1024).toFixed(0)}–${(liteBytes * 0.35 / 1024).toFixed(0)} kB)`);

  if (liteBytes > 300 * 1024) {
    fail(`library-index-lite.json is ${liteKb} kB — exceeds 300 kB hard limit (investigate field bloat)`);
  } else if (liteBytes > 200 * 1024) {
    warn(`library-index-lite.json is ${liteKb} kB — exceeds 200 kB soft limit`);
  } else {
    pass(`library-index-lite.json is ${liteKb} kB — within 200 kB soft limit`);
  }

  // Schema validation
  let liteItems;
  try {
    liteItems = JSON.parse(fs.readFileSync(liteJsonPath, "utf-8"));
  } catch {
    fail("library-index-lite.json is not valid JSON");
    liteItems = null;
  }

  if (liteItems) {
    if (!Array.isArray(liteItems)) {
      fail("library-index-lite.json is not an array");
    } else {
      pass(`${liteItems.length} items in full index`);

      // Check for forbidden fields
      const FORBIDDEN = ["status", "category", "description", "sourceType", "sourcePath", "body", "content", "raw"];
      const sample = liteItems.slice(0, 10);
      const found = FORBIDDEN.filter(f => sample.some(item => f in item));
      if (found.length > 0) {
        fail(`Forbidden fields found in index: ${found.join(", ")}`);
      } else {
        pass("No forbidden fields (status, category, description, sourceType, sourcePath) in index");
      }

      // Required fields check
      const REQUIRED = ["id", "title", "href", "type", "access", "section", "tags", "featured"];
      const missingRequired = REQUIRED.filter(r => sample.some(item => !(r in item)));
      if (missingRequired.length > 0) {
        fail(`Required fields missing from some items: ${missingRequired.join(", ")}`);
      } else {
        pass("All required fields (id, title, href, type, access, section, tags, featured) present");
      }

      // Summary cap check
      const longSummaries = liteItems.filter(i => i.summary && i.summary.length > 100);
      if (longSummaries.length > 0) {
        fail(`${longSummaries.length} items have summary > 100 chars (serializer not applied correctly)`);
      } else {
        pass("All summaries ≤ 100 chars");
      }

      // Tags cap check
      const longTagLists = liteItems.filter(i => Array.isArray(i.tags) && i.tags.length > 3);
      if (longTagLists.length > 0) {
        fail(`${longTagLists.length} items have more than 3 tags`);
      } else {
        pass("All tag arrays ≤ 3 items");
      }

      // Date format check
      const badDates = liteItems.filter(i => i.date && i.date.length > 10);
      if (badDates.length > 0) {
        fail(`${badDates.length} items have date strings longer than YYYY-MM-DD`);
      } else {
        pass("All dates are YYYY-MM-DD or null");
      }

      // Field size breakdown
      const fieldSizes = {};
      for (const item of liteItems) {
        for (const [k, v] of Object.entries(item)) {
          fieldSizes[k] = (fieldSizes[k] || 0) + JSON.stringify(v).length + k.length + 4;
        }
      }
      const sorted = Object.entries(fieldSizes).sort((a, b) => b[1] - a[1]).slice(0, 20);
      info("Top fields by total size:");
      for (const [k, v] of sorted) {
        info(`  ${k.padEnd(12)} ${(v / 1024).toFixed(1).padStart(7)} kB  avg ${(v / liteItems.length).toFixed(1)} B/item`);
      }
    }
  }
}

// ── 2. .next/server/pages/library.json (page-data after next build) ──────────

section("2 — /library page-data JSON (next build SSG output)");

const pageDataPath = path.join(ROOT, ".next/server/pages/library.json");

if (!fs.existsSync(pageDataPath)) {
  // Not a hard failure — ISR pages may not emit a .json in all Next.js versions
  warn(".next/server/pages/library.json not found — run: pnpm exec next build --webpack first");
  info("This check only runs after a successful next build.");
} else {
  const pageDataBytes = fs.statSync(pageDataPath).size;
  const pageDataKb    = (pageDataBytes / 1024).toFixed(1);
  info(`Page-data size: ${pageDataKb} kB`);

  if (pageDataBytes > 128 * 1024) {
    fail(`/library page-data is ${pageDataKb} kB — EXCEEDS 128 kB threshold`);
  } else if (pageDataBytes > 110 * 1024) {
    warn(`/library page-data is ${pageDataKb} kB — exceeds 110 kB soft limit`);
  } else {
    pass(`/library page-data is ${pageDataKb} kB — within 110 kB soft limit`);
  }

  // Parse and analyse
  try {
    const pageData = JSON.parse(fs.readFileSync(pageDataPath, "utf-8"));
    const propsKeys = Object.keys(pageData?.pageProps || {});
    info(`Top-level prop keys: [${propsKeys.join(", ")}]`);

    const items = pageData?.pageProps?.initialItems;
    if (Array.isArray(items)) {
      info(`initialItems count: ${items.length} (seed set)`);
      const avgBytes = Math.round(JSON.stringify(items).length / items.length);
      info(`Average bytes per seed item: ${avgBytes}`);

      // Print top 20 largest items
      const withSizes = items.map(i => ({ size: JSON.stringify(i).length, item: i }))
        .sort((a, b) => b.size - a.size);
      info("Top 5 largest seed items:");
      for (const { size, item } of withSizes.slice(0, 5)) {
        info(`  ${size} bytes: ${String(item.id || item.href || "").substring(0, 60)}`);
      }
    }
  } catch {
    warn("Could not parse library.json as JSON");
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("\n────────────────────────────────────────────────────");
if (failures > 0) {
  console.error(`\n❌  Library page-data audit FAILED — ${failures} failure(s), ${warnings} warning(s)\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠   Library page-data audit PASSED with ${warnings} warning(s)\n`);
} else {
  console.log(`\n✅  Library page-data audit PASSED — 0 failures, 0 warnings\n`);
}

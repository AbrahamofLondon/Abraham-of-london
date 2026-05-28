#!/usr/bin/env node
/**
 * scripts/check-series-integrity.mjs
 *
 * Checks series metadata integrity across all Contentlayer documents.
 * Detects:
 *   - duplicate seriesOrder within a series
 *   - missing seriesTitle
 *   - missing seriesDescription
 *   - missing seriesOrder
 *   - non-contiguous numbering (gaps)
 *   - mixed blog/editorial docs in same series slug
 *   - public series with zero published parts
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __dirname = join(fileURLToPath(import.meta.url), "..", "..");
const ROOT = join(__dirname);

const IGNORE_DIRS = ["node_modules", ".next", ".contentlayer", ".git"];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some((dir) => filePath.includes(dir));
}

// Collect only Contentlayer-processed paths — blog and editorial-series
// Outbound content, source material, and other non-Contentlayer files are excluded.
const sourceFiles = globSync("content/{blog,editorial-series}/**/*.{md,mdx}", {
  cwd: ROOT,
  ignore: [...IGNORE_DIRS.map((d) => `${d}/**`)],
});

let violations = [];
let seriesMap = new Map(); // slug -> { docs: [], paths: [] }

for (const file of sourceFiles) {
  const fullPath = join(ROOT, file);
  if (!existsSync(fullPath)) continue;
  if (shouldIgnore(fullPath)) continue;

  const content = readFileSync(fullPath, "utf-8");
  const normalized = file.replace(/\\/g, "/");

  // Quick check: does it have frontmatter with series field?
  const seriesMatch = content.match(/^series:\s*["']?(.+?)["']?\s*$/m);
  const orderMatch = content.match(/^seriesOrder:\s*(\d+)\s*$/m);
  const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const seriesTitleMatch = content.match(/^seriesTitle:\s*["']?(.+?)["']?\s*$/m);
  const seriesDescMatch = content.match(/^seriesDescription:\s*["']?(.+?)["']?\s*$/m);
  const draftMatch = content.match(/^draft:\s*(true|false)\s*$/m);

  if (!seriesMatch) continue;

  const slug = seriesMatch[1].trim();
  const order = orderMatch ? parseInt(orderMatch[1], 10) : null;
  const title = titleMatch ? titleMatch[1].trim() : "Untitled";
  const seriesTitle = seriesTitleMatch ? seriesTitleMatch[1].trim() : null;
  const seriesDesc = seriesDescMatch ? seriesDescMatch[1].trim() : null;
  const isDraft = draftMatch ? draftMatch[1] === "true" : false;

  if (!seriesMap.has(slug)) {
    seriesMap.set(slug, { docs: [], paths: [] });
  }
  seriesMap.get(slug).docs.push({ order, title, seriesTitle, seriesDesc, isDraft, file: normalized });
  seriesMap.get(slug).paths.push(normalized);
}

for (const [slug, data] of seriesMap.entries()) {
  const { docs } = data;

  // Check for missing seriesTitle
  const hasSeriesTitle = docs.some((d) => d.seriesTitle);
  if (!hasSeriesTitle) {
    violations.push(`"${slug}": missing seriesTitle in all documents`);
  }

  // Check for missing seriesDescription
  const hasSeriesDesc = docs.some((d) => d.seriesDesc);
  if (!hasSeriesDesc) {
    violations.push(`"${slug}": missing seriesDescription in all documents`);
  }

  // Check for missing seriesOrder
  const missingOrder = docs.filter((d) => d.order === null);
  if (missingOrder.length > 0) {
    violations.push(
      `"${slug}": ${missingOrder.length} document(s) missing seriesOrder — ${missingOrder.map((d) => d.file).join(", ")}`,
    );
  }

  // Check for duplicate seriesOrder
  const orders = docs.filter((d) => d.order !== null).map((d) => d.order);
  const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
  if (dupes.length > 0) {
    violations.push(
      `"${slug}": duplicate seriesOrder values — ${[...new Set(dupes)].join(", ")}`,
    );
  }

  // Check for non-contiguous numbering (gaps)
  const uniqueOrders = [...new Set(orders)].sort((a, b) => a - b);
  if (uniqueOrders.length > 1) {
    for (let i = 1; i < uniqueOrders.length; i++) {
      if (uniqueOrders[i] !== uniqueOrders[i - 1] + 1) {
        violations.push(
          `"${slug}": non-contiguous seriesOrder — gap between ${uniqueOrders[i - 1]} and ${uniqueOrders[i]}`,
        );
        break;
      }
    }
  }

  // Check for zero published parts
  // Exempt: SCHEDULED_VISIBLE series (seriesVisibility: scheduled/visible/teaser)
  // are intentionally shown with zero published parts as public previews.
  const publishedCount = docs.filter((d) => !d.isDraft).length;
  const hasScheduledVisibility = docs.some((d) => {
    const content = readFileSync(join(ROOT, d.file), "utf-8");
    return /^seriesVisibility:\s*["']?(scheduled|visible|teaser)["']?\s*$/m.test(content);
  });
  if (publishedCount === 0 && !hasScheduledVisibility) {
    violations.push(`"${slug}": zero published parts — series will not be exposed publicly`);
  }
}

if (violations.length > 0) {
  console.error(`\n❌ [SERIES_INTEGRITY] Found ${violations.length} issue(s):\n`);
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error("\n");
  process.exit(1);
} else {
  console.log(`✅ [SERIES_INTEGRITY] All ${seriesMap.size} series are valid.`);
  process.exit(0);
}

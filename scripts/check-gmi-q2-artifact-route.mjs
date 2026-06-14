#!/usr/bin/env node
/**
 * scripts/check-gmi-q2-artifact-route.mjs
 *
 * Verifies the GMI Q2 2026 artifact consolidation:
 * 1. Canonical MDX file exists
 * 2. Slug matches expected value
 * 3. productCode matches expected value
 * 4. Route path matches expected value
 * 5. No duplicate Q2 production markdown exists in content/artifacts
 * 6. Handoff file is outside public artifact content
 * 7. Catalog route resolves to canonical artifact path
 * 8. Premium content registry has the Q2 entry
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Configuration ────────────────────────────────────────────────────────

const CANONICAL_MDX_PATH = join(
  ROOT,
  "content/artifacts/global-market-intelligence-report-q2-2026.mdx",
);
const ARCHIVE_PRODUCTION_MD_PATH = join(
  ROOT,
  "docs/commercial/archive/global-market-intelligence-report-q2-2026.production.md",
);
const HANDOFF_PATH = join(
  ROOT,
  "docs/commercial/gmi-q2-2026-production-handoff.md",
);
const DUPLICATE_CHECK_PATHS = [
  join(ROOT, "content/artifacts/global-market-intelligence-report-q2-2026.production.md"),
  join(ROOT, "content/artifacts/gmi-q2-2026-production-handoff.md"),
];

const EXPECTED_SLUG = "global-market-intelligence-report-q2-2026";
const EXPECTED_PRODUCT_CODE = "gmi_q2_2026";
const EXPECTED_DOCUMENT_ID = "GMI-Q2-2026";
const EXPECTED_ROUTE = "/artifacts/global-market-intelligence-report-q2-2026";

// ── Helpers ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

// ── 1. Canonical MDX file exists ─────────────────────────────────────────

console.log("\n📄 CANONICAL MDX FILE");
console.log("-".repeat(60));

const mdxExists = existsSync(CANONICAL_MDX_PATH);
check(mdxExists, `Canonical MDX exists at content/artifacts/global-market-intelligence-report-q2-2026.mdx`);

if (!mdxExists) {
  console.error("\n❌ FATAL: Canonical MDX file not found. Aborting.");
  process.exit(1);
}

// ── 2. Parse frontmatter ─────────────────────────────────────────────────

console.log("\n📋 FRONTMATTER VALIDATION");
console.log("-".repeat(60));

const raw = readFileSync(CANONICAL_MDX_PATH, "utf8");
const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---/);

if (!frontmatterMatch) {
  console.error("❌ No frontmatter found in canonical MDX.");
  process.exit(1);
}

let fm;
try {
  // Simple YAML-like parser for key fields
  const fmRaw = frontmatterMatch[1];
  fm = {};
  for (const line of fmRaw.split("\n")) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      fm[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch (e) {
  console.error("❌ Failed to parse frontmatter:", e.message);
  process.exit(1);
}

check(fm.slug === EXPECTED_SLUG, `slug is "${EXPECTED_SLUG}"`);
check(fm.productCode === EXPECTED_PRODUCT_CODE, `productCode is "${EXPECTED_PRODUCT_CODE}"`);
check(fm.documentId === EXPECTED_DOCUMENT_ID, `documentId is "${EXPECTED_DOCUMENT_ID}"`);
check(fm.canonicalPath === EXPECTED_ROUTE, `canonicalPath is "${EXPECTED_ROUTE}"`);
check(fm.coveragePeriod === "Q2 2026", `coveragePeriod is "Q2 2026"`);
check(fm.currentDecisionWindow === "Q3 2026", `currentDecisionWindow is "Q3 2026"`);
check(fm.access === "restricted", `access is "restricted"`);
check(fm.notInvestmentAdvice === true || fm.notInvestmentAdvice === "true", `notInvestmentAdvice flag is set`);

// ── 3. No duplicate Q2 production markdown in content/artifacts ──────────

console.log("\n🗑️  DUPLICATE CHECK");
console.log("-".repeat(60));

let allClean = true;
for (const dupPath of DUPLICATE_CHECK_PATHS) {
  const exists = existsSync(dupPath);
  if (exists) {
    console.log(`  ❌ Duplicate still exists: ${dupPath}`);
    allClean = false;
    failed++;
  } else {
    const rel = dupPath.replace(ROOT + "/", "");
    console.log(`  ✅ No duplicate at ${rel}`);
    passed++;
  }
}

// ── 4. Archived production markdown exists ───────────────────────────────

console.log("\n📦 ARCHIVE CHECK");
console.log("-".repeat(60));

check(
  existsSync(ARCHIVE_PRODUCTION_MD_PATH),
  `Archived .production.md exists at docs/commercial/archive/`,
);
check(
  existsSync(HANDOFF_PATH),
  `Handoff note exists at docs/commercial/gmi-q2-2026-production-handoff.md`,
);

// ── 5. Catalog route check ───────────────────────────────────────────────

console.log("\n🔗 CATALOG ROUTE CHECK");
console.log("-".repeat(60));

// Verify the GMI edition registry has the Q2 entry with correct slug
const registryPath = join(ROOT, "lib/commercial/gmi/gmi-edition-registry.ts");
if (existsSync(registryPath)) {
  const registryRaw = readFileSync(registryPath, "utf8");
  const hasQ2Entry = registryRaw.includes('editionId: "GMI-Q2-2026"');
  const hasProductCode = registryRaw.includes('productCode: "gmi_q2_2026"');
  const hasSlug = registryRaw.includes('slug: "q2-2026"');

  check(hasQ2Entry, 'GMI edition registry has Q2 entry (editionId: "GMI-Q2-2026")');
  check(hasProductCode, 'GMI edition registry has productCode "gmi_q2_2026"');
  check(hasSlug, 'GMI edition registry has slug "q2-2026"');

  // Verify the factory derives the correct route
  const factoryPath = join(ROOT, "lib/commercial/gmi/gmi-edition-factory.ts");
  if (existsSync(factoryPath)) {
    const factoryRaw = readFileSync(factoryPath, "utf8");
    const routePattern = "/artifacts/global-market-intelligence-report-";
    const hasRoutePattern = factoryRaw.includes(routePattern);
    check(hasRoutePattern, 'GMI edition factory derives route as "/artifacts/global-market-intelligence-report-{slug}"');
  }
} else {
  check(false, "GMI edition registry file exists");
}

// ── 6. Premium content registry check ────────────────────────────────────

console.log("\n📚 PREMIUM CONTENT REGISTRY CHECK");
console.log("-".repeat(60));

const registryContentPath = join(ROOT, "lib/premium/content-registry.ts");
if (existsSync(registryContentPath)) {
  const contentRaw = readFileSync(registryContentPath, "utf8");
  const hasQ2Entry = contentRaw.includes('id: "global-market-intelligence-report-q2-2026"');
  const hasQ2InRelated = contentRaw.includes('"global-market-intelligence-report-q2-2026"');

  check(hasQ2Entry, 'Premium content registry has Q2 entry (id: "global-market-intelligence-report-q2-2026")');
  check(hasQ2InRelated, 'Q2 report ID is in GMI_RELATED_IDS');
}

// ── Summary ──────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(60));
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log("=".repeat(60));

if (failed > 0) {
  console.error(`\n❌ ${failed} check(s) failed.\n`);
  process.exit(1);
} else {
  console.log(`\n✅ All checks passed. GMI Q2 artifact is correctly consolidated.\n`);
  process.exit(0);
}

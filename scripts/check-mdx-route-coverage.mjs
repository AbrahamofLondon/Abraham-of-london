#!/usr/bin/env node
/**
 * scripts/check-mdx-route-coverage.mjs
 *
 * Compares the MDX route manifest against expected routes and flags issues:
 * - Missing expected public routes
 * - Duplicate route paths
 * - Draft documents in public routes
 * - Collection inference mismatches
 * - Orphaned documents
 *
 * Also checks the known broken URL:
 *   /shorts/when-a-single-yes-changes-everything
 *
 * Output: reports/mdx-route-coverage-report.json
 * Exit code: 0 if all expected routes pass, 1 if failures found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const OUTPUT_PATH = path.join(ROOT, "reports", "mdx-route-coverage-report.json");

// ─── Known broken URL to check ───────────────────────────────────────────────
const KNOWN_BROKEN_URL = "/shorts/when-a-single-yes-changes-everything";

// ─── Page route patterns that handle dynamic slugs ───────────────────────────
// Maps route pattern → the page file that handles it
const DYNAMIC_ROUTE_PATTERNS = {
  "/blog/[...slug]": "pages/blog/[...slug].tsx",
  "/shorts/[...slug]": "pages/shorts/[...slug].tsx",
  "/editorials/[slug]": "pages/editorials/[slug].tsx",
  "/editorials/series/[seriesSlug]/[partSlug]": "pages/editorials/series/[seriesSlug]/[partSlug].tsx",
  "/editorials/series/[seriesSlug]": "pages/editorials/series/[seriesSlug]/index.tsx",
  "/books/[slug]": "pages/books/[slug].tsx",
  "/canon/[slug]": "pages/canon/[slug].tsx",
  "/briefs/[slug]": "pages/briefs/[slug].tsx",
  "/vault/briefs/[slug]": "pages/vault/briefs/[slug].tsx",
  "/intelligence/[slug]": "pages/intelligence/[slug].tsx",
  "/downloads/[...slug]": "pages/downloads/[...slug].tsx",
  "/events/[slug]": "pages/events/[slug].tsx",
  "/prints/[slug]": "pages/prints/[slug].tsx",
  "/resources/[...slug]": "pages/resources/[...slug].tsx",
  "/strategy/[...slug]": "pages/strategy/[...slug].tsx",
  "/lexicon/[slug]": "pages/lexicon/[slug].tsx",
  "/vault/[...slug]": "pages/vault/[...slug].tsx",
  "/playbooks/[slug]": "pages/playbooks/[slug].tsx",
  // Also check app router
  "/registry/[...slug]": "app/registry/[...slug]/page.tsx",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function routeMatchesPattern(routePath, pattern) {
  // Convert Next.js dynamic route pattern to regex
  const regexStr = pattern
    .replace(/\[\.\.\.slug\]/g, "([^/]+(?:/[^/]+)*)")
    .replace(/\[slug\]/g, "([^/]+)")
    .replace(/\[seriesSlug\]/g, "([^/]+)")
    .replace(/\[partSlug\]/g, "([^/]+)")
    .replace(/\[id\]/g, "([^/]+)")
    .replace(/\[type\]/g, "([^/]+)");

  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(routePath);
}

function findMatchingPattern(routePath) {
  for (const [pattern] of Object.entries(DYNAMIC_ROUTE_PATTERNS)) {
    if (routeMatchesPattern(routePath, pattern)) return pattern;
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function checkCoverage() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-mdx-route-coverage] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;

  const failures = [];
  const warnings = [];
  const passed = [];

  // Track seen route paths for collision detection
  const routeMap = new Map();

  // ── Check 1: Expected public routes ────────────────────────────────────
  for (const doc of docs) {
    if (!doc.expectedPublicRoute) continue;
    if (!doc.routePath) {
      failures.push({
        type: "MISSING_ROUTE_PATH",
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        detail: "Expected public route but no routePath resolved",
      });
      continue;
    }

    // Check if route path matches a known dynamic route pattern
    const pattern = findMatchingPattern(doc.routePath);
    if (!pattern) {
      failures.push({
        type: "UNMATCHED_ROUTE_PATTERN",
        routePath: doc.routePath,
        collection: doc.collection,
        slug: doc.slug,
        title: doc.title,
        detail: `Route path ${doc.routePath} does not match any known dynamic route pattern`,
      });
    }

    // Track for collisions
    if (routeMap.has(doc.routePath)) {
      const existing = routeMap.get(doc.routePath);
      failures.push({
        type: "DUPLICATE_ROUTE",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        detail: `Route collision: "${existing.title}" (${existing.collection}) and "${doc.title}" (${doc.collection}) both map to ${doc.routePath}`,
      });
    } else {
      routeMap.set(doc.routePath, { title: doc.title, collection: doc.collection, slug: doc.slug });
    }

    passed.push({
      routePath: doc.routePath,
      slug: doc.slug,
      collection: doc.collection,
      title: doc.title,
    });
  }

  // ── Check 2: Future-dated documents should not appear in public routes ──
  for (const doc of docs) {
    if (doc.isFutureDated && doc.expectedPublicRoute) {
      failures.push({
        type: "FUTURE_DATED_IN_PUBLIC_ROUTE",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        detail: `Future-dated document (${doc.date}) is marked as expected public route — set draft: true or update date`,
      });
    }
  }

  // ── Check 3: Draft documents should not appear in public routes ────────
  for (const doc of docs) {
    if (doc.draft && doc.expectedPublicRoute) {
      failures.push({
        type: "DRAFT_IN_PUBLIC_ROUTE",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        detail: `Draft document (draft: true) is marked as expected public route`,
      });
    }
  }

  // ── Check 3: Non-public documents with routes ──────────────────────────
  for (const doc of docs) {
    if (!doc.expectedPublicRoute && doc.routePath && !doc.isInternal) {
      // These may be intentional (member/restricted content with gated pages)
      // Just warn about them
      warnings.push({
        type: "NON_PUBLIC_ROUTE",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        detail: doc.reasonIfNotPublic || "Non-public document has a route path",
      });
    }
  }

  // ── Check 4: Known broken URL ──────────────────────────────────────────
  const brokenDoc = docs.find(d => d.routePath === KNOWN_BROKEN_URL);
  if (brokenDoc) {
    if (brokenDoc.expectedPublicRoute) {
      passed.push({
        type: "KNOWN_BROKEN_URL_RESOLVED",
        routePath: KNOWN_BROKEN_URL,
        slug: brokenDoc.slug,
        collection: brokenDoc.collection,
        title: brokenDoc.title,
        detail: "Document found and expected as public route",
      });
    } else {
      failures.push({
        type: "KNOWN_BROKEN_URL_NOT_PUBLIC",
        routePath: KNOWN_BROKEN_URL,
        slug: brokenDoc.slug,
        collection: brokenDoc.collection,
        title: brokenDoc.title,
        detail: `Document exists but is not public: ${brokenDoc.reasonIfNotPublic}`,
      });
    }
  } else {
    failures.push({
      type: "KNOWN_BROKEN_URL_MISSING",
      routePath: KNOWN_BROKEN_URL,
      detail: `Document not found in manifest at all — missing from contentlayer output`,
    });
  }

  // ── Check 5: Collection inference mismatches ───────────────────────────
  for (const doc of docs) {
    if (!doc.isInternal && doc.collection && doc.flattenedPath) {
      const fp = doc.flattenedPath;
      const collectionInfo = manifest.collections?.[doc.collection];
      if (collectionInfo && !fp.startsWith(collectionInfo.contentDir) && !fp.startsWith(doc.collection.toLowerCase())) {
        warnings.push({
          type: "COLLECTION_INFERENCE_MISMATCH",
          slug: doc.slug,
          collection: doc.collection,
          flattenedPath: doc.flattenedPath,
          title: doc.title,
          detail: `Flattened path "${fp}" does not match content dir "${collectionInfo.contentDir}" for collection ${doc.collection}`,
        });
      }
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalDocuments: docs.length,
      expectedPublicRoutes: manifest.summary.expectedPublicRoutes,
      passed: passed.length,
      failures: failures.length,
      warnings: warnings.length,
      duplicateRoutes: failures.filter(f => f.type === "DUPLICATE_ROUTE").length,
      missingRoutes: failures.filter(f => f.type === "MISSING_ROUTE_PATH").length,
      unmatchedPatterns: failures.filter(f => f.type === "UNMATCHED_ROUTE_PATTERN").length,
      draftInPublic: failures.filter(f => f.type === "DRAFT_IN_PUBLIC_ROUTE").length,
    },
    knownBrokenUrl: KNOWN_BROKEN_URL,
    knownBrokenUrlStatus: failures.find(f => f.routePath === KNOWN_BROKEN_URL)
      ? "FAIL"
      : passed.find(p => p.routePath === KNOWN_BROKEN_URL)
        ? "PASS"
        : "NOT_FOUND",
    passed: passed.slice(0, 500), // Limit output size
    failures,
    warnings: warnings.slice(0, 200),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n========================================");
  console.log("MDX ROUTE COVERAGE REPORT");
  console.log("========================================");
  console.log(`Total documents:     ${report.summary.totalDocuments}`);
  console.log(`Expected public:     ${report.summary.expectedPublicRoutes}`);
  console.log(`Passed:              ${report.summary.passed}`);
  console.log(`Failures:            ${report.summary.failures}`);
  console.log(`Warnings:            ${report.summary.warnings}`);
  console.log(`  Duplicate routes:  ${report.summary.duplicateRoutes}`);
  console.log(`  Missing routes:    ${report.summary.missingRoutes}`);
  console.log(`  Unmatched pattern: ${report.summary.unmatchedPatterns}`);
  console.log(`  Draft in public:   ${report.summary.draftInPublic}`);
  console.log(`\nKnown broken URL: ${KNOWN_BROKEN_URL}`);
  console.log(`Status: ${report.knownBrokenUrlStatus}`);
  console.log("========================================\n");

  if (failures.length > 0) {
    console.error("FAILURES:");
    for (const f of failures.slice(0, 20)) {
      console.error(`  [${f.type}] ${f.routePath || f.slug || "(no path)"} — ${f.detail}`);
    }
    if (failures.length > 20) {
      console.error(`  ...and ${failures.length - 20} more`);
    }
  }

  if (warnings.length > 0) {
    console.log("\nWARNINGS (sample):");
    for (const w of warnings.slice(0, 10)) {
      console.log(`  [${w.type}] ${w.routePath || w.slug || "(no path)"} — ${w.detail}`);
    }
    if (warnings.length > 10) {
      console.log(`  ...and ${warnings.length - 10} more`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} failure(s) found — route coverage check FAILED`);
    process.exit(1);
  }

  console.log(`\n✅ All ${report.summary.expectedPublicRoutes} expected public routes pass`);
  process.exit(0);
}

checkCoverage();

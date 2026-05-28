#!/usr/bin/env node
/**
 * scripts/check-mdx-public-routes.mjs
 *
 * Generates a smoke list of public MDX routes and verifies they exist
 * in the route manifest with expected properties.
 *
 * Output: reports/mdx-public-smoke-list.json
 * Exit code: 0 if all pass, 1 if failures found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const OUTPUT_PATH = path.join(ROOT, "reports", "mdx-public-smoke-list.json");

// ─── Minimum expected counts per collection ──────────────────────────────────
const MINIMUM_EXPECTED = {
  Post: 10,
  Short: 10,
  Editorial: 1,
  EditorialSeriesPart: 9, // Series 1 only (9 published parts)
  Canon: 5,
  Book: 2,
  Brief: 3,
  Resource: 3,
};

// ─── Specific known URLs that must resolve ───────────────────────────────────
const REQUIRED_URLS = [
  "/shorts/when-a-single-yes-changes-everything",
  "/editorials/ultimate-purpose-of-man",
  "/canon/execution-breaks-long-before-strategy-does",
  "/playbooks/execution-integrity-public",
  "/editorials",
  "/blog",
  "/shorts",
  "/books",
];

// ─── Main ────────────────────────────────────────────────────────────────────

function checkPublicRoutes() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-mdx-public-routes] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;
  const collections = manifest.collections;

  const failures = [];
  const warnings = [];
  const smokeList = [];

  // ── Check 1: Minimum counts per collection ─────────────────────────────
  for (const [typeName, expected] of Object.entries(MINIMUM_EXPECTED)) {
    const info = collections[typeName];
    if (!info) {
      failures.push({
        type: "COLLECTION_NOT_FOUND",
        collection: typeName,
        detail: `Collection ${typeName} not found in manifest`,
      });
      continue;
    }

    if (info.publicCount < expected) {
      failures.push({
        type: "INSUFFICIENT_PUBLIC_DOCUMENTS",
        collection: typeName,
        expected,
        actual: info.publicCount,
        detail: `Expected at least ${expected} public documents in ${typeName}, found ${info.publicCount}`,
      });
    }
  }

  // ── Check 2: Required URLs exist ───────────────────────────────────────
  for (const url of REQUIRED_URLS) {
    // For index pages (/editorials, /blog, etc.), check that the collection exists
    const collectionMatch = url.match(/^\/([^/]+)/);
    if (collectionMatch) {
      const basePath = collectionMatch[1];
      const matchingDocs = docs.filter(d => d.routePath && d.routePath.startsWith("/" + basePath));
      if (matchingDocs.length === 0) {
        failures.push({
          type: "REQUIRED_URL_NO_DOCUMENTS",
          url,
          detail: `No documents found under route prefix /${basePath}`,
        });
      } else {
        smokeList.push({
          url,
          type: "COLLECTION_INDEX",
          documentCount: matchingDocs.length,
          status: "OK",
        });
      }
    }

    // For specific document URLs
    const docMatch = docs.find(d => d.routePath === url);
    if (docMatch) {
      if (!docMatch.expectedPublicRoute) {
        failures.push({
          type: "REQUIRED_URL_NOT_PUBLIC",
          url,
          slug: docMatch.slug,
          collection: docMatch.collection,
          title: docMatch.title,
          detail: docMatch.reasonIfNotPublic || "Not marked as expected public route",
        });
      } else {
        smokeList.push({
          url,
          slug: docMatch.slug,
          collection: docMatch.collection,
          title: docMatch.title,
          status: "OK",
        });
      }
    } else if (!url.match(/^\/(editorials|blog|shorts|books)$/)) {
      // Only flag as missing if it's not an index page
      failures.push({
        type: "REQUIRED_URL_MISSING",
        url,
        detail: `Required URL ${url} not found in route manifest`,
      });
    }
  }

  // ── Check 3: Sample public documents for key collections ───────────────
  const sampleCollections = {
    Post: 10,
    Short: 10,
    Editorial: 1,
    EditorialSeriesPart: 3,
    Canon: 3,
    Book: 3,
    Brief: 3,
    Resource: 3,
  };

  for (const [typeName, count] of Object.entries(sampleCollections)) {
    const typeDocs = docs.filter(d => d.collection === typeName && d.expectedPublicRoute);
    const sample = typeDocs.slice(0, count);

    for (const doc of sample) {
      smokeList.push({
        url: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        status: "OK",
        hasBody: doc.hasBodyRaw || doc.hasBodyCode || doc.hasContent,
      });
    }

    if (sample.length < Math.min(count, typeDocs.length)) {
      warnings.push({
        type: "SAMPLE_INCOMPLETE",
        collection: typeName,
        requested: count,
        available: typeDocs.length,
        sampled: sample.length,
        detail: `Only ${sample.length} of ${count} requested samples available for ${typeName}`,
      });
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalSmokeUrls: smokeList.length,
      failures: failures.length,
      warnings: warnings.length,
      requiredUrlsChecked: REQUIRED_URLS.length,
      collectionsChecked: Object.keys(MINIMUM_EXPECTED).length,
    },
    smokeList,
    failures,
    warnings: warnings.slice(0, 50),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n========================================");
  console.log("MDX PUBLIC SMOKE LIST REPORT");
  console.log("========================================");
  console.log(`Total smoke URLs:    ${report.summary.totalSmokeUrls}`);
  console.log(`Failures:            ${report.summary.failures}`);
  console.log(`Warnings:            ${report.summary.warnings}`);
  console.log("========================================\n");

  if (failures.length > 0) {
    console.error("FAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.url || f.collection} — ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — public smoke check FAILED`);
    process.exit(1);
  }

  console.log(`\n✅ All smoke checks pass`);
  process.exit(0);
}

checkPublicRoutes();

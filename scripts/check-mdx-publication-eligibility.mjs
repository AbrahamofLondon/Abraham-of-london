#!/usr/bin/env node
/**
 * scripts/check-mdx-publication-eligibility.mjs
 *
 * Hard regression guard: fails if any future-dated content is classified
 * as PUBLIC_NOW without an explicit authorised override.
 *
 * Output: lists all future-dated documents, their classification,
 * and whether they are exposed publicly.
 *
 * Exit code: 0 if all future-dated content is correctly classified as non-public.
 * Exit code: 1 if any future-dated content appears as expected public route.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");

const TODAY = new Date("2026-05-28T23:59:59Z");

// Authorised overrides: documents that are intentionally public despite future dates
const AUTHORISED_OVERRIDES = new Set([
  // Add explicit overrides here if needed, e.g.:
  // "/shorts/some-pre-scheduled-release"
]);

function checkPublicationEligibility() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-mdx-publication-eligibility] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;

  const futureDated = docs.filter(d => d.isFutureDated);
  const futureDatedPublic = futureDated.filter(d => d.expectedPublicRoute);
  const futureDatedNonPublic = futureDated.filter(d => !d.expectedPublicRoute);

  const failures = [];

  console.log("\n============================================");
  console.log("PUBLICATION ELIGIBILITY CHECK");
  console.log("============================================");
  console.log(`Today: ${TODAY.toISOString().split("T")[0]}`);
  console.log(`Total future-dated documents: ${futureDated.length}`);
  console.log(`  Correctly classified as non-public: ${futureDatedNonPublic.length}`);
  console.log(`  Incorrectly classified as public:   ${futureDatedPublic.length}`);
  console.log("");

  if (futureDated.length > 0) {
    console.log("--- FUTURE-DATED DOCUMENTS ---");
    // Sort by date ascending
    futureDated.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    for (const doc of futureDated) {
      const status = doc.expectedPublicRoute ? "❌ PUBLIC" : "✅ SCHEDULED";
      const override = AUTHORISED_OVERRIDES.has(doc.routePath) ? " (AUTHORISED)" : "";
      console.log(`  ${status}${override} ${doc.routePath || doc.slug}`);
      console.log(`         Date: ${doc.date || "unknown"} | Title: ${doc.title} | Collection: ${doc.collection}`);
    }
    console.log("");
  }

  // Check for failures
  for (const doc of futureDatedPublic) {
    if (!AUTHORISED_OVERRIDES.has(doc.routePath)) {
      failures.push({
        type: "FUTURE_DATED_PUBLICLY_EXPOSED",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        date: doc.date,
        detail: `Future-dated content (${doc.date}) is classified as expected public route without authorised override`,
      });
    }
  }

  if (failures.length > 0) {
    console.error("FAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.routePath || f.slug} — ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — publication eligibility check FAILED`);
    process.exit(1);
  }

  console.log(`✅ All ${futureDated.length} future-dated documents correctly classified as non-public`);
  process.exit(0);
}

checkPublicationEligibility();

#!/usr/bin/env node
/**
 * scripts/check-editorial-series-display-contract.mjs
 *
 * Regression check for the Editorial Series display contract.
 *
 * Compares the homepage editorial model (lib/content/homepage-editorial-series.ts)
 * against the /editorials catalogue model (lib/editorial/series.ts).
 *
 * Fails if:
 * - a scheduled-visible editorial series exists in catalogue but not homepage
 * - a complete editorial series exists in catalogue but not homepage
 * - homepage labels differ from catalogue labels
 * - homepage links scheduled unreadable parts
 * - Applied Essay Series replaces Editorial Series
 * - complete series disappears because a scheduled filter is applied globally
 *
 * Exit code: 0 if all pass, 1 if failures found.
 */

import { resolveAllSeries } from "../lib/series/resolver.ts";
import { getEditorialSeriesCatalogue } from "../lib/editorial/series.ts";
import { getHomepageEditorialSeries } from "../lib/content/homepage-editorial-series.ts";

const failures = [];
const warnings = [];

console.log("\n============================================");
console.log("EDITORIAL SERIES DISPLAY CONTRACT CHECK");
console.log("============================================\n");

// ─── 1. Resolve all three models ─────────────────────────────────────────────
const resolved = resolveAllSeries("editorial");
const catalogue = getEditorialSeriesCatalogue();
const homepage = getHomepageEditorialSeries();

console.log(`Resolver series count: ${resolved.length}`);
console.log(`Catalogue series count: ${catalogue.length}`);
console.log(`Homepage editorial series count: ${homepage.editorialSeries.length}`);
console.log(`Homepage applied series count: ${homepage.appliedSeries.length}\n`);

// ─── 2. Build lookup maps ────────────────────────────────────────────────────
const catalogueMap = new Map(catalogue.map((s) => [s.slug, s]));
const homepageMap = new Map(
  homepage.editorialSeries.map((s) => [s.slug, s]),
);

// ─── 3. Every catalogue series must exist in homepage model ──────────────────
for (const [slug, catSeries] of catalogueMap) {
  const hpSeries = homepageMap.get(slug);

  if (!hpSeries) {
    failures.push({
      type: "MISSING_FROM_HOMEPAGE",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" exists in /editorials catalogue but is absent from homepage editorial model`,
    });
    continue;
  }

  // ── 3a. Status label must match ────────────────────────────────────────
  const expectedStatus =
    catSeries.status === "PUBLISHED"
      ? "Complete"
      : catSeries.partCount > 0 && catSeries.parts.length === 0
        ? "Scheduled"
        : "In progress";

  if (hpSeries.statusLabel !== expectedStatus) {
    failures.push({
      type: "LABEL_MISMATCH",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" homepage label "${hpSeries.statusLabel}" does not match catalogue label "${expectedStatus}"`,
    });
  }

  // ── 3b. CTA must not link scheduled unreadable parts ───────────────────
  if (hpSeries.statusLabel === "Scheduled" && hpSeries.ctaHref !== null) {
    failures.push({
      type: "SCHEDULED_SERIES_HAS_ACTIVE_LINK",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" is SCHEDULED but has active CTA href "${hpSeries.ctaHref}" — scheduled series must not link readable parts before release`,
    });
  }

  // ── 3c. CTA must be present for non-scheduled series ───────────────────
  if (hpSeries.statusLabel !== "Scheduled" && hpSeries.ctaHref === null) {
    failures.push({
      type: "PUBLISHED_SERIES_MISSING_CTA",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" is ${hpSeries.statusLabel} but has no CTA href — readable series must have an active link`,
    });
  }

  // ── 3d. Part count must match ──────────────────────────────────────────
  if (hpSeries.partCount !== catSeries.partCount) {
    failures.push({
      type: "PART_COUNT_MISMATCH",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" homepage partCount (${hpSeries.partCount}) does not match catalogue (${catSeries.partCount})`,
    });
  }

  // ── 3e. Readable part count must match ─────────────────────────────────
  if (hpSeries.readablePartCount !== catSeries.parts.length) {
    failures.push({
      type: "READABLE_COUNT_MISMATCH",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" homepage readablePartCount (${hpSeries.readablePartCount}) does not match catalogue published parts (${catSeries.parts.length})`,
    });
  }

  console.log(`✅ ${catSeries.title}: ${hpSeries.statusLabel} — ${hpSeries.ctaLabel}`);
}

// ─── 4. Homepage must not have series not in catalogue ───────────────────────
for (const [slug, hpSeries] of homepageMap) {
  if (!catalogueMap.has(slug)) {
    failures.push({
      type: "UNKNOWN_SERIES_IN_HOMEPAGE",
      slug,
      title: hpSeries.title,
      detail: `"${hpSeries.title}" exists in homepage model but not in /editorials catalogue`,
    });
  }
}

// ─── 5. Applied Essay Series must not replace Editorial Series ───────────────
const appliedSlugs = homepage.appliedSeries.map((s) => s.slug);
for (const slug of appliedSlugs) {
  if (catalogueMap.has(slug)) {
    failures.push({
      type: "APPLIED_SERIES_IN_EDITORIAL",
      slug,
      detail: `Applied essay series "${slug}" appears in editorial catalogue — editorial and applied series must be separate`,
    });
  }
  if (homepageMap.has(slug)) {
    failures.push({
      type: "APPLIED_SERIES_IN_EDITORIAL_SECTION",
      slug,
      detail: `Applied essay series "${slug}" appears in homepage editorial series section — must be in applied series section only`,
    });
  }
}

// ─── 6. Complete series must not be filtered out globally ────────────────────
const completeInCatalogue = catalogue.filter((s) => s.status === "PUBLISHED");
if (completeInCatalogue.length === 0) {
  failures.push({
    type: "NO_COMPLETE_SERIES",
    detail: "No complete (PUBLISHED) series found in catalogue — all series may be incorrectly filtered",
  });
}

// Verify each complete series is in homepage
for (const cs of completeInCatalogue) {
  if (!homepageMap.has(cs.slug)) {
    failures.push({
      type: "COMPLETE_SERIES_MISSING_FROM_HOMEPAGE",
      slug: cs.slug,
      title: cs.title,
      detail: `Complete series "${cs.title}" exists in catalogue but is absent from homepage model`,
    });
  }
}

// ─── 7. Report ───────────────────────────────────────────────────────────────
console.log("\n============================================");
if (failures.length > 0) {
  console.error("FAILURES:");
  for (const f of failures) {
    console.error(`  [${f.type}] ${f.slug || ""} — ${f.detail}`);
  }
  console.error(`\n❌ ${failures.length} failure(s) found — display contract check FAILED`);
} else {
  console.log("✅ All editorial series display contract checks pass");
}

if (warnings.length > 0) {
  console.log("\nWARNINGS:");
  for (const w of warnings) {
    console.log(`  [${w.type}] ${w.slug || ""} — ${w.detail}`);
  }
}

if (failures.length > 0) process.exit(1);
process.exit(0);
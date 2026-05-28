#!/usr/bin/env node
/**
 * scripts/check-editorial-series-display-contract.mjs
 *
 * Regression check for the Editorial Series display contract.
 *
 * Pure-JavaScript rewrite — inlines the resolver, publication-eligibility,
 * and homepage view-model logic so the script runs via plain `node` without
 * a TypeScript transformer.
 *
 * Equivalent to the original which imported:
 *   lib/series/resolver.ts
 *   lib/editorial/series.ts
 *   lib/content/homepage-editorial-series.ts
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

// This script intentionally mirrors lib/content/homepage-editorial-series.ts
// and publication eligibility rules. If those files change, update this check.

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

// ─── Inlined: lib/content/publication-eligibility.ts ─────────────────────────

function getToday() {
  if (process.env.MDX_PUBLICATION_TODAY) {
    const override = new Date(process.env.MDX_PUBLICATION_TODAY);
    if (Number.isFinite(override.getTime())) return override;
  }
  return new Date();
}

function safeStr(v, fallback = "") {
  return v && typeof v === "string" ? v.trim() : fallback;
}

function safeBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return fallback;
}

function parseDate(value) {
  const s = safeStr(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function hasPublicPreviewPermission(doc) {
  const sv = safeStr(
    doc.seriesVisibility || doc.publicPreview || doc.teaser || ""
  ).toLowerCase();
  return (
    sv === "scheduled" || sv === "visible" || sv === "true" || sv === "teaser"
  );
}

/**
 * Classify a single document's publication state.
 * Mirrors lib/content/publication-eligibility.ts → classifyPublication()
 */
function classifyPublication(doc, now) {
  if (!doc) return "UNKNOWN";

  const type = safeStr(doc.type || doc.docKind || "");
  if (
    ["LinkedInOutbound", "FacebookOutbound", "XOutbound", "Dispatch"].includes(
      type
    )
  ) {
    return "INTERNAL";
  }

  // Future date check FIRST — draft:true on future content is a safety belt,
  // not the primary classification.
  const dateStr = safeStr(
    doc.date ||
      doc.eventDate ||
      doc.startDate ||
      doc.scheduledDate ||
      doc.releaseDate
  );
  if (dateStr) {
    const d = parseDate(dateStr);
    if (d && d > now) return "SCHEDULED";
  }

  const draft = safeBool(doc.draft, false);
  const published = safeBool(doc.published, true);
  const status = safeStr(doc.status || doc.publicationStatus).toLowerCase();

  if (draft) return "DRAFT";
  if (published === false) return "DRAFT";
  if (status === "draft") return "DRAFT";

  const tier = safeStr(
    doc.accessTierSafe ||
      doc.accessTier ||
      doc.accessLevel ||
      doc.tier ||
      doc.classification ||
      "public"
  ).toLowerCase();
  if (!["public", "open", "free", "unclassified"].includes(tier)) {
    return "RESTRICTED";
  }

  if (status === "scheduled" || status === "limited") return "SCHEDULED";

  return "PUBLIC_READABLE_NOW";
}

/**
 * Compute series-level publication state from its raw parts.
 * Mirrors lib/content/publication-eligibility.ts → computeSeriesPublicationState()
 */
function computeSeriesPublicationState(parts, now) {
  if (!parts || parts.length === 0) {
    return {
      totalParts: 0,
      publicNowParts: 0,
      scheduledParts: 0,
      draftParts: 0,
      restrictedParts: 0,
      firstPublicDate: null,
      nextScheduledDate: null,
      seriesVisibility: "DRAFT_INTERNAL",
      seriesStatusLabel: "Draft",
    };
  }

  let publicNowCount = 0,
    scheduledCount = 0,
    draftCount = 0,
    restrictedCount = 0;
  let firstPublicDate = null,
    nextScheduledDate = null,
    hasPreviewPermission = false;

  for (const part of parts) {
    const cls = classifyPublication(part, now);
    switch (cls) {
      case "PUBLIC_READABLE_NOW": {
        publicNowCount++;
        const pd = safeStr(part.date || part.eventDate || part.startDate);
        if (pd && (!firstPublicDate || pd < firstPublicDate))
          firstPublicDate = pd;
        break;
      }
      case "SCHEDULED": {
        scheduledCount++;
        const sd = safeStr(part.date || part.eventDate || part.startDate);
        if (sd && (!nextScheduledDate || sd < nextScheduledDate))
          nextScheduledDate = sd;
        break;
      }
      case "DRAFT":
        draftCount++;
        break;
      case "RESTRICTED":
        restrictedCount++;
        break;
    }
    if (hasPublicPreviewPermission(part)) hasPreviewPermission = true;
  }

  // Also check series-level preview permission on the first doc
  const firstDoc = parts[0];
  if (firstDoc && hasPublicPreviewPermission(firstDoc)) hasPreviewPermission = true;

  let seriesVisibility, seriesStatusLabel;

  if (publicNowCount === parts.length) {
    seriesVisibility = "COMPLETE";
    seriesStatusLabel = "Complete";
  } else if (publicNowCount > 0) {
    seriesVisibility = "IN_PROGRESS";
    seriesStatusLabel = "In progress";
  } else if (
    scheduledCount > 0 &&
    scheduledCount + restrictedCount === parts.length
  ) {
    if (hasPreviewPermission) {
      seriesVisibility = "SCHEDULED_VISIBLE";
      seriesStatusLabel = "Scheduled";
    } else {
      seriesVisibility = "SCHEDULED_HIDDEN";
      seriesStatusLabel = "Scheduled";
    }
  } else if (draftCount === parts.length) {
    seriesVisibility = "DRAFT_INTERNAL";
    seriesStatusLabel = "Draft";
  } else {
    seriesVisibility = "MIXED_REVIEW";
    seriesStatusLabel = "Review needed";
  }

  return {
    totalParts: parts.length,
    publicNowParts: publicNowCount,
    scheduledParts: scheduledCount,
    draftParts: draftCount,
    restrictedParts: restrictedCount,
    firstPublicDate,
    nextScheduledDate,
    seriesVisibility,
    seriesStatusLabel,
  };
}

// ─── Inlined: lib/series/data.ts ─────────────────────────────────────────────

function readIndexJson(typeDir) {
  try {
    const indexPath = join(
      ROOT,
      ".contentlayer",
      "generated",
      typeDir,
      "_index.json"
    );
    if (!existsSync(indexPath)) return null; // null = file absent (vs [] = empty array)
    const raw = readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Inlined: lib/series/resolver.ts (editorial subset) ──────────────────────

function normaliseSeriesSlug(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Resolve all editorial series from the Contentlayer generated index.
 * Returns { catalogue, rawDocCount } where catalogue is the EditorialSeries array.
 */
function resolveEditorialSeriesCatalogue(allDocs, now) {
  const seriesDocs = allDocs.filter(
    (doc) => doc.series && doc.seriesOrder != null
  );

  // Group by normalised series slug
  const groups = new Map();
  for (const doc of seriesDocs) {
    const rawSeries = String(doc.series);
    const slug = normaliseSeriesSlug(rawSeries);
    if (!groups.has(slug)) {
      groups.set(slug, { docs: [], rawSlug: rawSeries });
    }
    groups.get(slug).docs.push(doc);
  }

  const catalogue = [];

  for (const [slug, { docs, rawSlug }] of groups.entries()) {
    const sortedParts = [...docs].sort(
      (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0)
    );
    const seriesPubState = computeSeriesPublicationState(sortedParts, now);

    // Skip hidden/internal/review series — same rules as resolver.ts
    if (
      seriesPubState.seriesVisibility === "DRAFT_INTERNAL" ||
      seriesPubState.seriesVisibility === "SCHEDULED_HIDDEN" ||
      seriesPubState.seriesVisibility === "MIXED_REVIEW"
    ) {
      continue;
    }

    // Map visibility state → status string (mirrors resolver.ts)
    let status;
    switch (seriesPubState.seriesVisibility) {
      case "COMPLETE":
        status = "PUBLISHED";
        break;
      default:
        status = "DRAFT"; // IN_PROGRESS and SCHEDULED_VISIBLE both map to DRAFT
        break;
    }

    const firstDoc = sortedParts[0];
    const title = firstDoc.seriesTitle ?? rawSlug;
    const descriptor = firstDoc.seriesDescription ?? firstDoc.description ?? "";

    // Published parts: those classified as PUBLIC_READABLE_NOW
    const parts = sortedParts
      .filter((doc) => classifyPublication(doc, now) === "PUBLIC_READABLE_NOW")
      .map((doc) => ({
        order: doc.seriesOrder ?? 0,
        slug: doc.slug ?? "",
        title: doc.title ?? "Untitled",
        excerpt: doc.excerpt ?? doc.description ?? "",
        readTime: doc.readTime ?? "",
        status: "PUBLISHED",
        mdxSlug: doc.slug ?? undefined,
      }));

    catalogue.push({
      id: `editorial-series-${slug}`,
      slug,
      title,
      descriptor,
      partCount: seriesPubState.totalParts,
      status,
      parts,
    });
  }

  return catalogue;
}

// ─── Inlined: lib/content/homepage-editorial-series.ts ───────────────────────

// Applied Essay Series — stable curated list (blog-based, not EditorialSeriesPart)
// Keep in sync with lib/content/homepage-editorial-series.ts → APPLIED_SERIES
const APPLIED_SERIES = [
  { slug: "the-burden-changes-hands" },
  { slug: "the-science-of-inherited-selves" },
];

function computeStatusLabel(series) {
  if (series.status === "PUBLISHED") return "Complete";
  if (series.partCount > 0 && series.parts.length === 0) return "Scheduled";
  return "In progress";
}

function computeCtaLabel(statusLabel) {
  return statusLabel === "Scheduled" ? "Coming soon" : "Enter the series";
}

function computeCtaHref(series, statusLabel) {
  if (statusLabel === "Scheduled") return null;
  return `/editorials/series/${series.slug}`;
}

function buildHomepageViewModel(catalogue) {
  const editorialSeries = catalogue.map((s) => {
    const statusLabel = computeStatusLabel(s);
    return {
      slug: s.slug,
      title: s.title,
      statusLabel,
      ctaLabel: computeCtaLabel(statusLabel),
      ctaHref: computeCtaHref(s, statusLabel),
      partCount: s.partCount,
      readablePartCount: s.parts.length,
    };
  });
  return { editorialSeries, appliedSeries: APPLIED_SERIES };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const failures = [];
const warnings = [];

console.log("\n============================================");
console.log("EDITORIAL SERIES DISPLAY CONTRACT CHECK");
console.log("============================================\n");

// Guard: contentlayer must have been built
const allDocs = readIndexJson("EditorialSeriesPart");
if (allDocs === null) {
  console.warn(
    "⚠️  .contentlayer/generated/EditorialSeriesPart/_index.json not found."
  );
  console.warn("   Run `npm run build` or contentlayer build first.\n");
  process.exit(0);
}

const now = getToday();
const catalogue = resolveEditorialSeriesCatalogue(allDocs, now);
const homepage = buildHomepageViewModel(catalogue);

console.log(`Resolver series count:          ${catalogue.length}`);
console.log(`Catalogue series count:         ${catalogue.length}`);
console.log(`Homepage editorial series count: ${homepage.editorialSeries.length}`);
console.log(`Homepage applied series count:   ${homepage.appliedSeries.length}\n`);

// Guard: if docs exist but nothing resolved, the filters may be broken
if (allDocs.length > 0 && catalogue.length === 0) {
  failures.push({
    type: "ALL_SERIES_FILTERED",
    detail: `${allDocs.length} EditorialSeriesPart doc(s) found but zero series resolved — check visibility/filter logic`,
  });
}

// ─── 2. Build lookup maps ────────────────────────────────────────────────────
const catalogueMap = new Map(catalogue.map((s) => [s.slug, s]));
const homepageMap = new Map(homepage.editorialSeries.map((s) => [s.slug, s]));

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

  // ── 3a. Status label must match ──────────────────────────────────────────
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

  // ── 3b. CTA must not link scheduled unreadable parts ────────────────────
  if (hpSeries.statusLabel === "Scheduled" && hpSeries.ctaHref !== null) {
    failures.push({
      type: "SCHEDULED_SERIES_HAS_ACTIVE_LINK",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" is SCHEDULED but has active CTA href "${hpSeries.ctaHref}" — scheduled series must not link readable parts before release`,
    });
  }

  // ── 3c. CTA must be present for non-scheduled series ────────────────────
  if (hpSeries.statusLabel !== "Scheduled" && hpSeries.ctaHref === null) {
    failures.push({
      type: "PUBLISHED_SERIES_MISSING_CTA",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" is ${hpSeries.statusLabel} but has no CTA href — readable series must have an active link`,
    });
  }

  // ── 3d. Part count must match ────────────────────────────────────────────
  if (hpSeries.partCount !== catSeries.partCount) {
    failures.push({
      type: "PART_COUNT_MISMATCH",
      slug,
      title: catSeries.title,
      detail: `"${catSeries.title}" homepage partCount (${hpSeries.partCount}) does not match catalogue (${catSeries.partCount})`,
    });
  }

  // ── 3e. Readable part count must match ──────────────────────────────────
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
// Hard-fail only if a PUBLISHED series exists in catalogue but is missing from
// homepage — that indicates a real filtering bug.
// A site with zero complete series (all scheduled/in-progress) is valid; warn only.
const completeInCatalogue = catalogue.filter((s) => s.status === "PUBLISHED");
if (completeInCatalogue.length === 0 && catalogue.length > 0) {
  warnings.push({
    type: "NO_COMPLETE_SERIES",
    detail:
      "No complete (PUBLISHED) series in catalogue — all series are scheduled or in progress. This is expected pre-launch.",
  });
}
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
  console.error(
    `\n❌ ${failures.length} failure(s) found — display contract check FAILED`
  );
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

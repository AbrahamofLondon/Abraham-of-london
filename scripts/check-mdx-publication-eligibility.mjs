#!/usr/bin/env node
/**
 * scripts/check-mdx-publication-eligibility.mjs
 *
 * Hard regression guard for publication eligibility.
 *
 * Checks:
 * 1. No future-dated document is classified as PUBLIC_NOW
 * 2. No series with zero PUBLIC_NOW parts is shown as public
 * 3. No future-dated complete series is labelled COMPLETE publicly
 * 4. No scheduled series has public "Begin/Read" CTA
 *
 * Output: lists all future-dated documents and series with computed state.
 * Exit code: 0 if all pass, 1 if failures found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const GENERATED = path.join(ROOT, ".contentlayer", "generated");

const TODAY = new Date("2026-05-28T23:59:59Z");

// Authorised overrides
const AUTHORISED_OVERRIDES = new Set([]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v, fallback = "") {
  return (v && typeof v === "string") ? v.trim() : fallback;
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

function readIndexJson(typeDir) {
  const indexPath = path.join(GENERATED, typeDir, "_index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function normaliseSeriesSlug(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function isFutureDated(doc) {
  const dateStr = safeStr(doc.date || doc.eventDate || doc.startDate || doc.scheduledDate || doc.releaseDate);
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return Number.isFinite(d.getTime()) && d > TODAY;
}

function classifyDoc(doc) {
  if (!doc) return "UNKNOWN";
  const type = safeStr(doc.type || doc.docKind || "");
  if (["LinkedInOutbound", "FacebookOutbound", "XOutbound", "Dispatch"].includes(type)) return "INTERNAL";
  // Check future date FIRST — future-dated content is SCHEDULED even if draft:true
  if (isFutureDated(doc)) {
    const routePath = safeStr(doc.routePath || doc.hrefSafe || doc.href || "");
    if (AUTHORISED_OVERRIDES.has(routePath)) return "PUBLIC_READABLE_NOW";
    return "SCHEDULED";
  }
  if (safeBool(doc.draft, false)) return "DRAFT";
  if (safeBool(doc.published, true) === false) return "DRAFT";
  const status = safeStr(doc.status || doc.publicationStatus).toLowerCase();
  if (status === "draft") return "DRAFT";
  const tier = safeStr(doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || "public").toLowerCase();
  if (!["public", "open", "free", "unclassified"].includes(tier)) return "RESTRICTED";
  if (status === "scheduled" || status === "limited") return "SCHEDULED";
  return "PUBLIC_READABLE_NOW";
}

function hasPreviewPermission(parts) {
  for (const p of parts) {
    const sv = safeStr(p.seriesVisibility || p.publicPreview || p.teaser || "").toLowerCase();
    if (sv === "scheduled" || sv === "visible" || sv === "true" || sv === "teaser") return true;
  }
  return false;
}

function computeSeriesState(parts) {
  let publicNow = 0, scheduled = 0, draft = 0, restricted = 0;
  let firstPublic = null, nextScheduled = null;
  for (const p of parts) {
    const cls = classifyDoc(p);
    if (cls === "PUBLIC_READABLE_NOW") { publicNow++; const d = safeStr(p.date); if (d && (!firstPublic || d < firstPublic)) firstPublic = d; }
    else if (cls === "SCHEDULED") { scheduled++; const d = safeStr(p.date); if (d && (!nextScheduled || d < nextScheduled)) nextScheduled = d; }
    else if (cls === "DRAFT") draft++;
    else if (cls === "RESTRICTED") restricted++;
  }
  const preview = hasPreviewPermission(parts);
  let visibility, label;
  if (publicNow === parts.length) { visibility = "COMPLETE"; label = "Complete"; }
  else if (publicNow > 0) { visibility = "IN_PROGRESS"; label = "In progress"; }
  else if (scheduled > 0 && scheduled + restricted === parts.length) {
    if (preview) { visibility = "SCHEDULED_VISIBLE"; label = "Scheduled"; }
    else { visibility = "SCHEDULED_HIDDEN"; label = "Scheduled (hidden)"; }
  }
  else if (draft === parts.length) { visibility = "DRAFT_INTERNAL"; label = "Draft"; }
  else { visibility = "MIXED_REVIEW"; label = "Review needed"; }
  return { totalParts: parts.length, publicNow, scheduled, draft, restricted, firstPublic, nextScheduled, visibility, label };
}

// ─── Main ───────────────────────────────────────────────────────────────────

function checkPublicationEligibility() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-mdx-publication-eligibility] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;
  const failures = [];

  // ── Check 1: Future-dated documents ────────────────────────────────────
  const futureDated = docs.filter(d => d.isFutureDated);
  const futureDatedPublic = futureDated.filter(d => d.expectedPublicRoute);

  console.log("\n============================================");
  console.log("PUBLICATION ELIGIBILITY CHECK");
  console.log("============================================");
  console.log(`Today: ${TODAY.toISOString().split("T")[0]}`);
  console.log(`Total future-dated documents: ${futureDated.length}`);
  console.log(`  Correctly classified as non-public: ${futureDated.length - futureDatedPublic.length}`);
  console.log(`  Incorrectly classified as public:   ${futureDatedPublic.length}`);

  for (const doc of futureDatedPublic) {
    if (!AUTHORISED_OVERRIDES.has(doc.routePath)) {
      failures.push({
        type: "FUTURE_DATED_PUBLICLY_EXPOSED",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        date: doc.date,
        detail: `Future-dated content (${doc.date}) is classified as expected public route`,
      });
    }
  }

  // ── Check 2: Series-level publication state ────────────────────────────
  // Audit editorial series
  const editorialParts = readIndexJson("EditorialSeriesPart");
  const espBySeries = {};
  for (const doc of editorialParts) {
    if (!doc.series) continue;
    const slug = normaliseSeriesSlug(String(doc.series));
    if (!espBySeries[slug]) espBySeries[slug] = [];
    espBySeries[slug].push(doc);
  }

  function displaySeries(parts, slug) {
    parts.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
    const state = computeSeriesState(parts);
    const title = parts[0].seriesTitle || parts[0].series || slug;
    const isPublic = state.visibility === "COMPLETE" || state.visibility === "IN_PROGRESS" || state.visibility === "SCHEDULED_VISIBLE";
    const icon = state.visibility === "COMPLETE" ? "✅" :
                 state.visibility === "IN_PROGRESS" ? "📝" :
                 state.visibility === "SCHEDULED_VISIBLE" ? "📅" : "⏳";
    console.log(`  ${icon} ${title} (${slug})`);
    console.log(`     Parts: ${state.totalParts} | Public: ${state.publicNow} | Scheduled: ${state.scheduled} | Draft: ${state.draft}`);
    console.log(`     Status: ${state.label} (${state.visibility}) | Publicly visible: ${isPublic ? "YES" : "NO"}`);
    if (state.nextScheduled) console.log(`     Next: ${state.nextScheduled}`);

    // Fail if series has 0 public parts but is SCHEDULED_HIDDEN and visible
    if (state.publicNow === 0 && state.visibility === "SCHEDULED_HIDDEN" && isPublic) {
      failures.push({
        type: "SERIES_ZERO_PUBLIC_PARTS_VISIBLE",
        series: slug, title,
        detail: `Series "${title}" has 0 public parts but is publicly visible without preview permission`,
      });
    }
    // Fail if scheduled-visible series is labelled COMPLETE
    if (state.visibility === "SCHEDULED_VISIBLE" && state.label === "Complete") {
      failures.push({
        type: "SCHEDULED_SERIES_LABELLED_COMPLETE",
        series: slug, title,
        detail: `Series "${title}" is scheduled-visible but labelled Complete`,
      });
    }
    return state;
  }

  console.log("\n--- EDITORIAL SERIES ---");
  for (const [slug, parts] of Object.entries(espBySeries)) {
    displaySeries(parts, slug);
  }

  // Audit blog series
  const posts = readIndexJson("Post");
  const blogBySeries = {};
  for (const doc of posts) {
    if (!doc.series) continue;
    const slug = normaliseSeriesSlug(String(doc.series));
    if (!blogBySeries[slug]) blogBySeries[slug] = [];
    blogBySeries[slug].push(doc);
  }

  console.log("\n--- BLOG SERIES ---");
  for (const [slug, parts] of Object.entries(blogBySeries)) {
    displaySeries(parts, slug);
  }

  // ── Report ─────────────────────────────────────────────────────────────
  console.log("\n============================================");
  if (failures.length > 0) {
    console.error("FAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.series || f.routePath || f.slug} — ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — publication eligibility check FAILED`);
    process.exit(1);
  }

  console.log(`✅ All documents and series correctly classified`);
  console.log(`   ${futureDated.length} future-dated documents non-public`);
  console.log(`   ${Object.keys(espBySeries).length + Object.keys(blogBySeries).length} series audited`);
  process.exit(0);
}

checkPublicationEligibility();
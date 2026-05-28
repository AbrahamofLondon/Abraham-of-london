#!/usr/bin/env node
/**
 * scripts/fix-sitemap-future-urls.mjs
 *
 * Removes future-dated, draft, and restricted content URLs from sitemap-0.xml.
 * Scans all public-facing content types via their .contentlayer/generated indexes
 * and uses the shared publication classifier to determine which URLs must not
 * be indexed yet.
 *
 * Run AFTER contentlayer2 build and next-sitemap generation, before deploy.
 *
 * Exit code: 0 if clean, 1 if a regression URL is found after filtering.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITEMAP_PATH = path.join(ROOT, "public", "sitemap-0.xml");

// Use current date at run time so the script stays accurate without manual updates.
const TODAY = new Date();

// Content types whose documents can appear as public URLs in sitemap-0.xml.
// Internal/outbound types (LinkedInOutbound, XOutbound, Dispatch, etc.) are
// excluded because next-sitemap's `exclude` rules already keep them out.
const PUBLIC_CONTENT_TYPES = [
  "Post",
  "Short",
  "Book",
  "Canon",
  "Strategy",
  "Resource",
  "Download",
  "Print",
  "Event",
  "Editorial",
  "EditorialSeriesPart",
  "Lexicon",
  "Vault",
  "VaultBrief",
];

// Regression URLs that must never appear in sitemap-0.xml.
// Add entries here whenever a future-dated URL is confirmed absent.
const REGRESSION_URLS = [
  "/blog/series/the-science-of-inherited-selves/choose-the-ancestral-landscape",
  "/shorts/when-the-burden-changes-address",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function isFutureDated(doc) {
  const dateStr = safeStr(
    doc.date || doc.eventDate || doc.startDate || doc.scheduledDate || doc.releaseDate
  );
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return Number.isFinite(d.getTime()) && d > TODAY;
}

function classifyDoc(doc) {
  if (!doc) return "UNKNOWN";
  const type = safeStr(doc.type || doc.docKind || "");
  if (["LinkedInOutbound", "FacebookOutbound", "XOutbound", "Dispatch"].includes(type))
    return "INTERNAL";
  if (isFutureDated(doc)) return "SCHEDULED";
  if (safeBool(doc.draft, false)) return "DRAFT";
  if (safeBool(doc.published, true) === false) return "DRAFT";
  const status = safeStr(doc.status || doc.publicationStatus).toLowerCase();
  if (status === "draft") return "DRAFT";
  const tier = safeStr(
    doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || "public"
  ).toLowerCase();
  if (!["public", "open", "free", "unclassified"].includes(tier)) return "RESTRICTED";
  if (status === "scheduled" || status === "limited") return "SCHEDULED";
  return "PUBLIC_READABLE_NOW";
}

function readIndexJson(typeDir) {
  const indexPath = path.join(ROOT, ".contentlayer", "generated", typeDir, "_index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function fixSitemap() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error("[fix-sitemap-future-urls] ERROR: public/sitemap-0.xml not found");
    process.exit(1);
  }

  console.log("\n============================================");
  console.log("SITEMAP FUTURE URL FIX");
  console.log("============================================");
  console.log(`Today: ${TODAY.toISOString().split("T")[0]}`);

  // Build the set of non-public URLs across ALL public content types.
  // Each document's URL is derived from its _raw.flattenedPath which maps
  // directly to the public URL path (e.g. "shorts/my-slug" → "/shorts/my-slug").
  const nonPublicUrls = new Set();

  for (const typeName of PUBLIC_CONTENT_TYPES) {
    const docs = readIndexJson(typeName);
    let typeCount = 0;

    for (const doc of docs) {
      const classification = classifyDoc(doc);
      if (classification === "PUBLIC_READABLE_NOW") continue;

      const fp = safeStr(doc._raw?.flattenedPath || "");
      if (!fp) continue;

      // Normalise: strip leading slash if present, then prepend one
      const url = "/" + fp.replace(/^\//, "");
      nonPublicUrls.add(url);
      typeCount++;
      console.log(`  [${typeName}] Non-public: ${url} (${classification}, date: ${doc.date ?? "none"})`);
    }

    if (typeCount > 0) {
      console.log(`  → ${typeCount} non-public ${typeName} URL(s) queued for removal`);
    }
  }

  console.log(`\nTotal non-public URLs to remove: ${nonPublicUrls.size}`);

  // Filter sitemap lines
  const siteUrl = "https://www.abrahamoflondon.org";
  const sitemapContent = fs.readFileSync(SITEMAP_PATH, "utf8");
  const lines = sitemapContent.split("\n");

  let removedCount = 0;
  let keptCount = 0;

  const filteredLines = lines.filter((line) => {
    for (const nonPublicUrl of nonPublicUrls) {
      if (line.includes(`${siteUrl}${nonPublicUrl}`)) {
        removedCount++;
        return false;
      }
    }
    keptCount++;
    return true;
  });

  fs.writeFileSync(SITEMAP_PATH, filteredLines.join("\n"), "utf8");

  console.log(`\nRemoved: ${removedCount} URL(s)`);
  console.log(`Kept:    ${keptCount} line(s)`);

  if (removedCount > 0) {
    console.log(`\n✅ Sitemap fixed — ${removedCount} non-public URL(s) removed`);
  } else {
    console.log(`\n✅ Sitemap is clean — no non-public URLs found`);
  }

  // Regression checks: these URLs must never survive in sitemap-0.xml
  const updatedSitemap = fs.readFileSync(SITEMAP_PATH, "utf8");
  let regressionFailed = false;

  for (const regUrl of REGRESSION_URLS) {
    if (updatedSitemap.includes(regUrl)) {
      console.error(`\n❌ Regression: URL still present in sitemap: ${regUrl}`);
      regressionFailed = true;
    }
  }

  if (regressionFailed) process.exit(1);

  console.log(`\n✅ All ${REGRESSION_URLS.length} regression URL(s) confirmed absent`);
  process.exit(0);
}

fixSitemap();

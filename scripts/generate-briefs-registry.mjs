/**
 * scripts/generate-briefs-registry.mjs
 *
 * Reads the contentlayer-generated Brief _index.json and VaultBrief _index.json,
 * extracts the minimal metadata needed by the App Router briefs page, and writes
 * it to public/system/briefs-registry.json.
 *
 * This JSON is then imported at build time by generateStaticParams and can also
 * be read at runtime (it's in public/) without needing fs access to .contentlayer/.
 *
 * Run as part of the build pipeline: after contentlayer2 build, before next build.
 */

import fs from "fs";
import path from "path";

const GENERATED_ROOT = path.resolve(process.cwd(), ".contentlayer", "generated");
const OUTPUT_PATH = path.resolve(process.cwd(), "public", "system", "briefs-registry.json");

const COLLECTIONS = ["Brief", "VaultBrief"];

function safeString(v, fallback = "") {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function extractBriefMeta(raw) {
  if (!raw || typeof raw !== "object") return null;

  const fp = safeString(raw._raw?.flattenedPath);
  if (!fp) return null;

  // Derive the URL slug from the flattened path
  const parts = fp
    .replace(/^briefs\//, "")
    .replace(/^vault\/briefs\//, "")
    .split("/");
  const slug = parts[parts.length - 1];
  if (!slug) return null;

  // Derive series from slug prefix when not explicit in frontmatter
  const seriesRaw = safeString(raw.series);
  const series = seriesRaw ||
    (slug.startsWith("institutional-alpha") ? "institutional-alpha" :
     slug.startsWith("sovereign-intelligence") ? "sovereign-intelligence" : "");

  return {
    slug,
    flattenedPath: fp,
    series,
    briefId: safeString(raw.briefId) || safeString(raw.institutionalId) || slug.toUpperCase(),
    title: safeString(raw.title) || "Untitled Brief",
    subtitle: safeString(raw.subtitle),
    description: safeString(raw.description),
    summary: safeString(raw.summary) || safeString(raw.description),
    excerpt: safeString(raw.excerpt),
    date: safeString(raw.date),
    lastUpdated: safeString(raw.lastUpdated),
    category: safeString(raw.category),
    tags: safeArray(raw.tags),
    status: safeString(raw.status) || "ACTIVE",
    institutionalId: safeString(raw.institutionalId) || safeString(raw.briefId) || slug.toUpperCase(),
    version: safeString(raw.version) || "1.0.0",
    classification: safeString(raw.classification) || "Unclassified",
    accessTierSafe: safeString(raw.accessTierSafe) || "public",
    requiresAuthSafe: raw.requiresAuth === true || raw.requiresAuthSafe === true,
    publishedSafe: raw.publishedSafe !== false && raw.draft !== true,
    // Publication release fields
    publicationStatus: safeString(raw.publicationStatus) || "",
    publishedAt:       safeString(raw.publishedAt),
    scheduledFor:      safeString(raw.scheduledFor),
    season:            safeString(raw.season),
    sequence:          typeof raw.sequence === "number" ? raw.sequence : 0,
    featured:          raw.featured === true || raw.featured === "true",
    editorialCluster:  safeString(raw.editorialCluster),
    primaryRoute:      safeString(raw.primaryRoute),
    secondaryRoute:    safeString(raw.secondaryRoute),
    relatedCanon:      safeString(raw.relatedCanon),
    innerCircleBridge: safeString(raw.innerCircleBridge),
  };
}

function main() {
  if (!fs.existsSync(GENERATED_ROOT)) {
    throw new Error(
      "[generate-briefs-registry] .contentlayer/generated/ not found. Refusing to overwrite the brief registry with an empty result.",
    );
  }

  const allBriefs = [];
  let loadedCollections = 0;

  for (const collection of COLLECTIONS) {
    const indexPath = path.join(GENERATED_ROOT, collection, "_index.json");
    if (!fs.existsSync(indexPath)) {
      console.warn(`[generate-briefs-registry] ${collection}/_index.json not found. Skipping.`);
      continue;
    }

    try {
      const raw = fs.readFileSync(indexPath, "utf-8");
      const docs = JSON.parse(raw);

      const items = Array.isArray(docs) ? docs : Array.isArray(docs.documents) ? docs.documents : Array.isArray(docs.allDocuments) ? docs.allDocuments : [];
      loadedCollections += 1;

      for (const item of items) {
        const meta = extractBriefMeta(item);
        if (meta) allBriefs.push(meta);
      }

      console.log(`[generate-briefs-registry] Loaded ${items.length} items from ${collection}`);
    } catch (e) {
      console.warn(`[generate-briefs-registry] Failed to parse ${collection}/_index.json:`, e.message);
    }
  }

  // ── Deduplicate by slug ────────────────────────────────────────────────────
  //
  // Both the canonical Brief collection (briefs/<slug>) and the VaultBrief
  // collection (vault/briefs/<slug>) are indexed by contentlayer.  When a brief
  // appears in both, the flattenedPath values differ so a simple Set(flattenedPath)
  // dedup passes both entries through — producing duplicate slugs in the registry.
  //
  // Resolution rule:
  //   1. Prefer the canonical public Brief path (flattenedPath starts with "briefs/")
  //      over any vault mirror (flattenedPath starts with "vault/").
  //   2. When both are vault paths, keep the first one encountered.
  //   3. Final output is sorted by slug for determinism.

  /** @param {string} fp */
  function isVaultPath(fp) {
    return fp.startsWith("vault/");
  }

  /** @type {Map<string, typeof allBriefs[0]>} */
  const slugMap = new Map();
  for (const b of allBriefs) {
    const existing = slugMap.get(b.slug);
    if (!existing) {
      slugMap.set(b.slug, b);
    } else {
      // Both present — prefer the non-vault (canonical) entry
      if (isVaultPath(existing.flattenedPath) && !isVaultPath(b.flattenedPath)) {
        slugMap.set(b.slug, b); // replace vault entry with canonical entry
      }
      // else: existing is already canonical (or both vault) — keep existing
    }
  }

  const duplicatesRemoved = allBriefs.length - slugMap.size;
  if (duplicatesRemoved > 0) {
    console.log(
      `[generate-briefs-registry] Removed ${duplicatesRemoved} duplicate slug mirror${duplicatesRemoved === 1 ? "" : "s"} (vault entries superseded by canonical Brief entries)`,
    );
  }

  // Sort by slug for deterministic output
  const unique = [...slugMap.values()].sort((a, b) =>
    a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0,
  );

  if (loadedCollections === 0) {
    throw new Error(
      "[generate-briefs-registry] No brief collections were available. Refusing to overwrite the brief registry.",
    );
  }

  if (unique.length === 0) {
    throw new Error(
      "[generate-briefs-registry] Generated brief collections were empty. Refusing to overwrite the brief registry.",
    );
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(unique, null, 2), "utf-8");
  console.log(`[generate-briefs-registry] Wrote ${unique.length} briefs to ${OUTPUT_PATH}`);
}

main();

#!/usr/bin/env node
/**
 * scripts/build-mdx-route-manifest.mjs
 *
 * Builds a canonical manifest of every MDX document from Contentlayer
 * generated indexes, with route path, body info, draft/public status,
 * and expected public route flag.
 *
 * Output: reports/mdx-route-manifest.json
 *
 * Run after: pnpm contentlayer2 build
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED = path.join(ROOT, ".contentlayer", "generated");
const OUTPUT = path.join(ROOT, "reports", "mdx-route-manifest.json");

// ─── Collection definitions ──────────────────────────────────────────────────
// Maps Contentlayer type name → { routeBase, pageFile, contentDir }

const COLLECTIONS = {
  Post:                { routeBase: "blog",       pageFile: "pages/blog/[...slug].tsx",       contentDir: "blog" },
  Short:               { routeBase: "shorts",     pageFile: "pages/shorts/[...slug].tsx",     contentDir: "shorts" },
  Editorial:           { routeBase: "editorials", pageFile: "pages/editorials/[slug].tsx",    contentDir: "editorials" },
  EditorialSeriesPart: { routeBase: "editorials/series", pageFile: "pages/editorials/series/[seriesSlug]/[partSlug].tsx", contentDir: "editorial-series" },
  Book:                { routeBase: "books",      pageFile: "pages/books/[slug].tsx",         contentDir: "books" },
  Canon:               { routeBase: "canon",      pageFile: "pages/canon/[slug].tsx",         contentDir: "canon" },
  Brief:               { routeBase: "briefs",     pageFile: "pages/briefs/[slug].tsx",        contentDir: "briefs" },
  VaultBrief:          { routeBase: "vault/briefs", pageFile: "pages/vault/briefs/[slug].tsx", contentDir: "vault/briefs" },
  Intelligence:        { routeBase: "intelligence", pageFile: "pages/intelligence/[slug].tsx", contentDir: "intelligence" },
  Download:            { routeBase: "downloads",  pageFile: "pages/downloads/[...slug].tsx",  contentDir: "downloads" },
  Event:               { routeBase: "events",     pageFile: "pages/events/[slug].tsx",        contentDir: "events" },
  Print:               { routeBase: "prints",     pageFile: "pages/prints/[slug].tsx",        contentDir: "prints" },
  Resource:            { routeBase: "resources",  pageFile: "pages/resources/[...slug].tsx",  contentDir: "resources" },
  Strategy:            { routeBase: "strategy",   pageFile: "pages/strategy/[...slug].tsx",   contentDir: "strategy" },
  Lexicon:             { routeBase: "lexicon",    pageFile: "pages/lexicon/[slug].tsx",       contentDir: "lexicon" },
  Vault:               { routeBase: "vault",      pageFile: "pages/vault/[...slug].tsx",      contentDir: "vault" },
  Playbook:            { routeBase: "playbooks",  pageFile: "pages/playbooks/[slug].tsx",     contentDir: "playbooks" },
};

// Internal types that should NOT have public routes
const INTERNAL_TYPES = new Set([
  "LinkedInOutbound",
  "FacebookOutbound",
  "XOutbound",
  "Dispatch",
]);

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

function getAccessTier(doc) {
  const raw = safeStr(doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || doc.classification || "public");
  const lower = raw.toLowerCase().trim();
  if (["public", "open", "free", "unclassified"].includes(lower)) return "public";
  if (["member", "members", "inner-circle"].includes(lower)) return "member";
  if (["verified", "verified-member"].includes(lower)) return "verified";
  return "restricted";
}

const TODAY = new Date("2026-05-28T23:59:59Z");

function isFutureDated(doc) {
  // Check date field — if it's in the future, content is scheduled, not public now
  const dateStr = safeStr(doc.date || doc.eventDate || doc.startDate || doc.scheduledDate || doc.releaseDate);
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return Number.isFinite(d.getTime()) && d > TODAY;
}

function isPublished(doc) {
  // Use publishedSafe if available (contentlayer computed), else manual check
  if (doc.publishedSafe !== undefined) {
    // Even if publishedSafe is true, check if future-dated
    if (doc.publishedSafe === true && isFutureDated(doc)) return false;
    return doc.publishedSafe === true;
  }
  const published = safeBool(doc.published, true);
  const draft = safeBool(doc.draft, false);
  const result = published && !draft;
  // Even if draft/published look good, check future date
  if (result && isFutureDated(doc)) return false;
  return result;
}

function isPublicNow(doc) {
  // PUBLIC_NOW: not draft, published, not future-dated, public tier
  return isPublished(doc) && getAccessTier(doc) === "public";
}

function getFlattenedPath(doc) {
  return safeStr(doc._raw?.flattenedPath) || safeStr(doc._raw?.sourceFilePath) || safeStr(doc.slugComputed) || safeStr(doc.slug) || "";
}

function getSlug(doc) {
  return safeStr(doc.slugSafe || doc.slug || doc.slugComputed || "");
}

function hasBodyRaw(doc) {
  const raw = doc.body?.raw;
  return typeof raw === "string" && raw.trim().length > 0;
}

function hasBodyCode(doc) {
  const code = doc.body?.code;
  return typeof code === "string" && code.trim().length > 0;
}

function hasContent(doc) {
  const c = doc.content;
  return typeof c === "string" && c.trim().length > 0;
}

function getBodyRawLength(doc) {
  const raw = doc.body?.raw;
  return typeof raw === "string" ? raw.trim().length : 0;
}

function getBodyCodeLength(doc) {
  const code = doc.body?.code;
  return typeof code === "string" ? code.trim().length : 0;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function buildManifest() {
  const manifest = [];
  const errors = [];
  const warnings = [];

  const generatedDirs = fs.readdirSync(GENERATED, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const typeDir of generatedDirs) {
    const docs = readIndexJson(typeDir);

    // Determine collection info
    const collection = COLLECTIONS[typeDir];
    const isInternal = INTERNAL_TYPES.has(typeDir);

    for (const doc of docs) {
      const type = safeStr(doc.type || doc.docKind || typeDir);
      const title = safeStr(doc.titleSafe || doc.title || "(untitled)");
      const slug = getSlug(doc);
      const flattenedPath = getFlattenedPath(doc);
      const draft = safeBool(doc.draft, false);
      const published = safeBool(doc.published, true);
      const isPub = isPublished(doc);
      const tier = getAccessTier(doc);
      const status = safeStr(doc.status || doc.publicationStatus || (isPub ? "published" : "draft"));

      // Determine route path
      let routePath = "";
      let pageFileExpected = "";
      let reasonIfNotPublic = "";

      if (collection && slug) {
        // Special handling for EditorialSeriesPart: route is /editorials/series/[seriesSlug]/[partSlug]
        if (typeDir === "EditorialSeriesPart") {
          const seriesSlug = safeStr(doc.series ? doc.series.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") : "");
          if (seriesSlug) {
            routePath = `/${collection.routeBase}/${seriesSlug}/${slug}`;
          } else {
            routePath = `/${collection.routeBase}/${slug}`;
          }
          pageFileExpected = collection.pageFile;
        }
        // Special handling for Blog (Post) series parts: route is /blog/series/[seriesSlug]/[partSlug]
        else if (typeDir === "Post" && doc.series && doc.seriesOrder != null) {
          const seriesSlug = safeStr(String(doc.series).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, ""));
          if (seriesSlug) {
            routePath = `/blog/series/${seriesSlug}/${slug}`;
            pageFileExpected = "pages/blog/series/[seriesSlug]/[partSlug].tsx";
          } else {
            routePath = `/${collection.routeBase}/${slug}`;
            pageFileExpected = collection.pageFile;
          }
        } else {
          routePath = `/${collection.routeBase}/${slug}`;
          pageFileExpected = collection.pageFile;
        }
      } else if (collection && !slug) {
        routePath = `/${collection.routeBase}/[no-slug]`;
        reasonIfNotPublic = "Missing slug";
      } else if (!isInternal) {
        // Try to infer from flattened path
        const fp = flattenedPath;
        if (fp) {
          const parts = fp.split("/");
          const firstDir = parts[0];
          // Try to find matching collection
          for (const [, info] of Object.entries(COLLECTIONS)) {
            if (info.contentDir === firstDir || fp.startsWith(info.contentDir + "/")) {
              const inferredSlug = parts.slice(firstDir === info.contentDir ? 1 : 0).join("/");
              routePath = `/${info.routeBase}/${inferredSlug}`;
              pageFileExpected = info.pageFile;
              break;
            }
          }
        }
        if (!routePath) {
          routePath = `/uncategorised/${slug || flattenedPath}`;
          reasonIfNotPublic = "Uncategorised document type";
        }
      }

      // Determine if this should be a public route
      // PUBLIC_NOW: not draft, published, not future-dated, public tier
      let expectedPublicRoute = false;
      if (!isInternal && collection && isPub && tier === "public") {
        expectedPublicRoute = true;
      }
      if (!reasonIfNotPublic && !expectedPublicRoute) {
        if (!isPub) {
          if (isFutureDated(doc)) reasonIfNotPublic = "Future-dated (scheduled, not public yet)";
          else reasonIfNotPublic = "Not published (draft or unpublished)";
        } else if (tier !== "public") reasonIfNotPublic = `Tier: ${tier}`;
        else if (!collection) reasonIfNotPublic = "No collection mapping";
      }

      const entry = {
        collection: typeDir,
        type,
        title,
        slug,
        flattenedPath,
        routePath,
        pageFileExpected,
        draft,
        published,
        isPublished: isPub,
        status,
        accessTier: tier,
        hasBodyRaw: hasBodyRaw(doc),
        hasBodyCode: hasBodyCode(doc),
        hasContent: hasContent(doc),
        bodyRawLength: getBodyRawLength(doc),
        bodyCodeLength: getBodyCodeLength(doc),
        expectedPublicRoute,
        reasonIfNotPublic,
        isFutureDated: isFutureDated(doc),
        date: safeStr(doc.date || doc.eventDate || doc.startDate || ""),
        isInternal,
      };

      manifest.push(entry);
    }
  }

  // Sort: public routes first, then by collection
  manifest.sort((a, b) => {
    if (a.expectedPublicRoute !== b.expectedPublicRoute) return a.expectedPublicRoute ? -1 : 1;
    return (a.collection || "").localeCompare(b.collection || "");
  });

  // Summary
  const totalDocs = manifest.length;
  const expectedPublic = manifest.filter(e => e.expectedPublicRoute).length;
  const draftDocs = manifest.filter(e => e.draft).length;
  const publishedDocs = manifest.filter(e => e.isPublished).length;
  const withBody = manifest.filter(e => e.hasBodyRaw || e.hasBodyCode || e.hasContent).length;
  const emptyBody = manifest.filter(e => !e.hasBodyRaw && !e.hasBodyCode && !e.hasContent).length;
  const internalDocs = manifest.filter(e => e.isInternal).length;

  const output = {
    generated: new Date().toISOString(),
    summary: {
      totalDocuments: totalDocs,
      expectedPublicRoutes: expectedPublic,
      draftDocuments: draftDocs,
      publishedDocuments: publishedDocs,
      withBodyContent: withBody,
      emptyBody: emptyBody,
      internalDocuments: internalDocs,
      collections: Object.keys(COLLECTIONS).length,
    },
    collections: Object.fromEntries(
      Object.entries(COLLECTIONS).map(([name, info]) => [
        name,
        {
          ...info,
          documentCount: manifest.filter(e => e.collection === name).length,
          publicCount: manifest.filter(e => e.collection === name && e.expectedPublicRoute).length,
          draftCount: manifest.filter(e => e.collection === name && e.draft).length,
        },
      ])
    ),
    documents: manifest,
    errors,
    warnings,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");
  console.log(`[build-mdx-route-manifest] Wrote ${totalDocs} documents to ${OUTPUT}`);
  console.log(`[build-mdx-route-manifest]   Expected public routes: ${expectedPublic}`);
  console.log(`[build-mdx-route-manifest]   Draft: ${draftDocs}, Published: ${publishedDocs}`);
  console.log(`[build-mdx-route-manifest]   With body: ${withBody}, Empty body: ${emptyBody}`);
  console.log(`[build-mdx-route-manifest]   Internal: ${internalDocs}`);
}

buildManifest();

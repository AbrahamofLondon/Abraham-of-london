// lib/print-utils.ts
// PRODUCTION-SAFE utilities for Contentlayer "prints"

import { allPrints } from "contentlayer/generated";

// Local type so callers aren't coupled to Contentlayer's internal shape.
export interface PrintDocument {
  _id: string;
  title: string;
  slug: string;       // canonical, no leading/trailing slashes
  date: string;       // ISO-ish
  url: string;        // absolute or site-relative path
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  [key: string]: unknown;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* helpers                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const isDev = process.env.NODE_ENV !== "production";

function logDev(...args: unknown[]) {
  if (isDev) console.log(...args);
}

function warnDev(...args: unknown[]) {
  if (isDev) console.warn(...args);
}

function toCanonicalSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[\/\s-]+|[\/\s-]+$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-");
  return s || "";
}

function safeDateMs(d: unknown): number {
  try {
    const ms = new Date(String(d ?? "")).getTime();
    return Number.isFinite(ms) ? ms : 0;
  } catch {
    return 0;
  }
}

function coercePrint(p: any): PrintDocument | null {
  if (!p || typeof p !== "object") return null;

  const rawSlug = p.slug ?? p._raw?.flattenedPath ?? p._id;
  const slug = toCanonicalSlug(rawSlug);
  if (!slug) return null;

  const title = typeof p.title === "string" && p.title.trim() ? p.title.trim() : "Untitled";
  const date = typeof p.date === "string" ? p.date : (p.publishedAt ?? "");
  const url =
    typeof p.url === "string" && p.url
      ? p.url
      : `/print/${slug}`;

  const out: PrintDocument = {
    _id: String(p._id ?? slug),
    title,
    slug,
    date,
    url,
    excerpt: typeof p.excerpt === "string" ? p.excerpt : undefined,
    tags: Array.isArray(p.tags) ? p.tags.map(String) : undefined,
    coverImage: typeof p.coverImage === "string" ? p.coverImage : undefined,
  };

  // Copy any extra fields without overwriting the core ones
  for (const [k, v] of Object.entries(p)) {
    if (!(k in out)) (out as any)[k] = v;
  }

  return out;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* public API                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

/** Get all valid print documents (deduped by slug, newest first). */
export function getAllPrintDocuments(): PrintDocument[] {
  try {
    if (!Array.isArray(allPrints)) {
      warnDev("⚠️ Contentlayer allPrints is not an array; returning empty.");
      return [];
    }

    const seen = new Set<string>();
    const safe: PrintDocument[] = [];

    for (const p of allPrints) {
      const doc = coercePrint(p);
      if (!doc) {
        warnDev("🚫 Skipping invalid print record:", p);
        continue;
      }
      if (seen.has(doc.slug)) {
        warnDev(`🚨 Duplicate slug skipped: ${doc.slug}`);
        continue;
      }
      seen.add(doc.slug);
      safe.push(doc);
    }

    // Sort newest first by date (fallback to _id time if needed)
    safe.sort((a, b) => safeDateMs(b.date || b._id) - safeDateMs(a.date || a._id));

    logDev(`✅ getAllPrintDocuments(): ${safe.length} unique prints`);
    return safe;
  } catch (err) {
    console.error("💥 getAllPrintDocuments() failed:", err);
    return [];
  }
}

/** Slugs for static generation (canonical, deduped). */
export function getAllPrintSlugs(): string[] {
  try {
    const slugs = getAllPrintDocuments().map((d) => d.slug).filter(Boolean);
    logDev(`🖨️ getAllPrintSlugs(): ${slugs.length}`);
    return slugs;
  } catch (err) {
    console.error("💥 getAllPrintSlugs() failed:", err);
    return [];
  }
}

/** Fetch a single print by slug (canonicalised). */
export function getPrintDocumentBySlug(slug: string): PrintDocument | null {
  try {
    const key = toCanonicalSlug(slug);
    if (!key || key === "untitled") {
      warnDev(`⚠️ Invalid or disallowed slug: "${slug}"`);
      return null;
    }
    const match = getAllPrintDocuments().find((d) => d.slug === key) || null;
    if (!match) warnDev(`🔍 No print found for slug "${key}"`);
    return match;
  } catch (err) {
    console.error(`💥 getPrintDocumentBySlug("${slug}") failed:`, err);
    return null;
  }
}

/** Next.js-style path objects, e.g., for older pages router or helpers. */
export function getPrintPaths(): { params: { slug: string } }[] {
  try {
    const paths = getAllPrintSlugs().map((slug) => ({ params: { slug } }));
    logDev(`🛣️ getPrintPaths(): ${paths.length}`);
    return paths;
  } catch (err) {
    console.error("💥 getPrintPaths() failed:", err);
    return [];
  }
}
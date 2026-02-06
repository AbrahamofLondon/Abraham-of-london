// lib/content/shared.ts — CLIENT-SAFE SHARED CONTENT UTILITIES
// Shared utilities used across Pages Router + App Router.
// MUST remain client-safe (no fs, no server-only imports).

export type DocKind =
  | "blog"
  | "book"
  | "canon"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "short"
  | "strategy"
  | "unknown";

export type AccessLevel = "free" | "member" | "architect" | "inner-circle" | "inner-circle-elite";

type AnyDoc = Record<string, any>;

/**
 * Institutional Slug Normalizer
 */
export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

/**
 * ✅ REQUIRED BY BUILD: joinHref
 * Combines multiple segments into a clean, normalized URL path.
 */
export function joinHref(...args: (string | undefined | null)[]): string {
  const parts = args
    .filter((arg): arg is string => typeof arg === 'string' && arg.length > 0)
    .map(part => normalizeSlug(part));
  
  return "/" + parts.join("/");
}

export function isDraftContent(doc: AnyDoc): boolean {
  return Boolean(doc?.draft || doc?.isDraft || doc?.published === false);
}

/**
 * Check if a document is published (not a draft and has publish date)
 */
export function isPublished(doc: AnyDoc): boolean {
  if (isDraftContent(doc)) return false;
  
  const publishDate = doc?.publishedAt || doc?.date;
  if (publishDate) {
    const pubDate = new Date(publishDate);
    const now = new Date();
    return pubDate <= now;
  }
  
  // If no publish date, assume published unless marked as draft
  return !isDraftContent(doc);
}

/**
 * Get the access level (tier) for a document
 */
export function getAccessLevel(doc: AnyDoc): AccessLevel {
  const tier = doc?.tier || doc?.access || doc?.accessLevel || 'free';
  
  switch (String(tier).toLowerCase()) {
    case 'member':
    case 'premium':
      return 'member';
    case 'architect':
    case 'enterprise':
      return 'architect';
    case 'inner-circle':
    case 'innercircle':
      return 'inner-circle';
    case 'inner-circle-elite':
    case 'elite':
      return 'inner-circle-elite';
    default:
      return 'free';
  }
}

export function getDocKind(doc: AnyDoc): DocKind {
  const t = String(doc?.type || "").toLowerCase();

  if (t.includes("post") || t.includes("blog")) return "blog";
  if (t.includes("book")) return "book";
  if (t.includes("canon")) return "canon";
  if (t.includes("download")) return "download";
  if (t.includes("event")) return "event";
  if (t.includes("print")) return "print";
  if (t.includes("resource")) return "resource";
  if (t.includes("short")) return "short";
  if (t.includes("strategy")) return "strategy";

  const slug = normalizeSlug(String(doc?.slug || doc?._raw?.flattenedPath || ""));
  if (slug.startsWith("blog/")) return "blog";
  if (slug.startsWith("books/")) return "book";
  if (slug.startsWith("canon/")) return "canon";
  if (slug.startsWith("downloads/")) return "download";
  if (slug.startsWith("events/")) return "event";
  if (slug.startsWith("prints/")) return "print";
  if (slug.startsWith("resources/")) return "resource";
  if (slug.startsWith("shorts/")) return "short";
  if (slug.startsWith("strategy/")) return "strategy";

  return "unknown";
}

export function getDocHref(doc: AnyDoc): string {
  const explicit = doc?.href || doc?.url || doc?.permalink;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();

  const kind = getDocKind(doc);
  const rawSlug = normalizeSlug(
    String(doc?.slug || doc?._raw?.flattenedPath || doc?._id || "")
  );

  const buildSafePath = (prefix: string, slug: string) => {
    const cleanPrefix = prefix.replace(/^\/+/, "").replace(/\/+$/, "");
    if (slug.startsWith(cleanPrefix + "/")) return `/${slug}`;
    return `/${cleanPrefix}/${slug}`;
  };

  switch (kind) {
    case "blog": return buildSafePath("blog", rawSlug);
    case "book": return buildSafePath("books", rawSlug);
    case "canon": return buildSafePath("canon", rawSlug);
    case "download": return buildSafePath("downloads", rawSlug);
    case "event": return buildSafePath("events", rawSlug);
    case "print": return buildSafePath("prints", rawSlug);
    case "resource": return buildSafePath("resources", rawSlug);
    case "short": return buildSafePath("shorts", rawSlug);
    case "strategy": return buildSafePath("strategy", rawSlug);
    default:
      return rawSlug.includes("/") ? `/${rawSlug}` : `/content/${rawSlug}`;
  }
}

export function sanitizeData<T>(input: T): T {
  return JSON.parse(
    JSON.stringify(input, (_k, v) => (v === undefined ? null : v))
  );
}

export function toUiDoc<T extends Record<string, any>>(doc: T): T {
  return doc;
}

export function resolveDocCoverImage(doc: any): string | null {
  return doc?.coverImage ?? doc?.image ?? null;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  if (doc?.downloadUrl) return doc.downloadUrl;
  if (doc?.slug) return `/downloads/${normalizeSlug(String(doc.slug))}`;
  return null;
}
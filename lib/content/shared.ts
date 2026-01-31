// lib/content/shared.ts — CLIENT-SAFE SHARED CONTENT UTILITIES
/**
 * Shared utilities used across Pages Router + App Router.
 * MUST remain client-safe (no fs, no server-only imports).
 *
 * This file intentionally provides:
 * - normalizeSlug
 * - getDocKind
 * - getDocHref
 * - isDraftContent
 * - small safe helpers (sanitizeData/toUiDoc/resolve images)
 */

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

type AnyDoc = Record<string, any>;

export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

export function isDraftContent(doc: AnyDoc): boolean {
  // conservative: if any draft-like flag is true, treat as draft
  return Boolean(doc?.draft || doc?.isDraft || doc?.published === false);
}

export function getDocKind(doc: AnyDoc): DocKind {
  // Prefer explicit `type`
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

  // fallbacks by common fields
  const slug = String(doc?.slug || doc?._raw?.flattenedPath || "");
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
  // Allow explicit href override in frontmatter/data
  const explicit = doc?.href || doc?.url || doc?.permalink;
  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();

  const kind = getDocKind(doc);

  // Slug priority: explicit slug -> raw flattenedPath -> id-like fallback
  const slug =
    normalizeSlug(String(doc?.slug || "")) ||
    normalizeSlug(String(doc?._raw?.flattenedPath || "")) ||
    normalizeSlug(String(doc?._id || ""));

  // If slug already includes section prefix, keep it
  if (slug.includes("/")) return `/${slug}`;

  switch (kind) {
    case "blog":
      return `/blog/${slug}`;
    case "book":
      return `/books/${slug}`;
    case "canon":
      return `/canon/${slug}`;
    case "download":
      return `/downloads/${slug}`;
    case "event":
      return `/events/${slug}`;
    case "print":
      return `/prints/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    case "short":
      return `/shorts/${slug}`;
    case "strategy":
      return `/strategy/${slug}`;
    default:
      // very last resort: generic content route (keeps site alive)
      return `/content/${slug}`;
  }
}

// ------- small safe helpers you already had -------

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
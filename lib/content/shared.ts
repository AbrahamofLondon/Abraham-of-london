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

export type AccessLevel =
  | "free"
  | "member"
  | "architect"
  | "inner-circle"
  | "inner-circle-elite";

type AnyDoc = Record<string, any>;

/**
 * Institutional Slug Normalizer
 * - strips leading/trailing slashes
 * - collapses multiple slashes
 */
export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

/**
 * joinHref — HARD-LOCKED (idempotent)
 * Combines segments into a clean URL, avoiding double-prefixes like:
 *   joinHref("books", "books/the-x")  -> "/books/the-x"
 *   joinHref("canon", "/canon/vol-i") -> "/canon/vol-i"
 */
export function joinHref(...args: (string | undefined | null)[]): string {
  const raw = args
    .filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    .map((a) => normalizeSlug(a));

  if (raw.length === 0) return "/";

  const parts: string[] = [];

  for (let i = 0; i < raw.length; i++) {
    const curr = raw[i];
    const prev = parts[parts.length - 1];

    // Skip exact duplicates: ["books","books"] => ["books"]
    if (prev && curr === prev) continue;

    // If current already contains prev as prefix: ["books","books/the-x"] => keep only "books/the-x"
    if (prev && (curr === prev || curr.startsWith(`${prev}/`))) {
      parts.pop();
      parts.push(curr);
      continue;
    }

    // If prev already contains current as prefix, keep prev (rare)
    if (prev && (prev === curr || prev.startsWith(`${curr}/`))) {
      continue;
    }

    parts.push(curr);
  }

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
  return true;
}

/**
 * Get the access level (tier) for a document
 */
export function getAccessLevel(doc: AnyDoc): AccessLevel {
  const tier = doc?.tier || doc?.access || doc?.accessLevel || "free";

  switch (String(tier).toLowerCase()) {
    case "member":
    case "premium":
      return "member";
    case "architect":
    case "enterprise":
      return "architect";
    case "inner-circle":
    case "innercircle":
      return "inner-circle";
    case "inner-circle-elite":
    case "elite":
      return "inner-circle-elite";
    default:
      return "free";
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

/**
 * getDocHref — HARDENED
 * - honors explicit href/url/permalink
 * - otherwise builds a canonical route without double-prefixing
 */
export function getDocHref(doc: AnyDoc): string {
  const explicit = doc?.href || doc?.url || doc?.permalink;
  if (typeof explicit === "string" && explicit.trim()) {
    const e = explicit.trim();
    return e.startsWith("/") ? e : `/${e}`;
  }

  const kind = getDocKind(doc);

  // Prefer slug; fallback to flattenedPath; then id
  const rawSlug = normalizeSlug(
    String(doc?.slug || doc?._raw?.flattenedPath || doc?._id || "")
  );

  // For Contentlayer docs, flattenedPath often already includes collection prefix.
  // We do NOT want /books/books/x or /canon/canon/x etc.
  const stripPrefix = (prefix: string, slug: string) => {
    const p = normalizeSlug(prefix);
    const s = normalizeSlug(slug);
    return s === p ? "" : s.startsWith(`${p}/`) ? s.slice(p.length + 1) : s;
  };

  switch (kind) {
    case "blog":
      return joinHref("blog", stripPrefix("blog", rawSlug));
    case "book":
      return joinHref("books", stripPrefix("books", rawSlug));
    case "canon":
      return joinHref("canon", stripPrefix("canon", rawSlug));
    case "download":
      return joinHref("downloads", stripPrefix("downloads", rawSlug));
    case "event":
      return joinHref("events", stripPrefix("events", rawSlug));
    case "print":
      return joinHref("prints", stripPrefix("prints", rawSlug));
    case "resource":
      return joinHref("resources", stripPrefix("resources", rawSlug));
    case "short":
      return joinHref("shorts", stripPrefix("shorts", rawSlug));
    case "strategy":
      return joinHref("strategy", stripPrefix("strategy", rawSlug));
    default:
      // If already nested, use it as-is; otherwise put in /content
      return rawSlug.includes("/") ? `/${rawSlug}` : joinHref("content", rawSlug);
  }
}

export function sanitizeData<T>(input: T): T {
  return JSON.parse(JSON.stringify(input, (_k, v) => (v === undefined ? null : v)));
}

export function toUiDoc<T extends Record<string, any>>(doc: T): T {
  return doc;
}

export function resolveDocCoverImage(doc: any): string | null {
  return doc?.coverImage ?? doc?.image ?? null;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  if (doc?.downloadUrl) return doc.downloadUrl;
  if (doc?.slug) return joinHref("downloads", normalizeSlug(String(doc.slug)));
  return null;
}
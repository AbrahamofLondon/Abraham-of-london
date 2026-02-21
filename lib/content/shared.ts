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
 * normalizeSlug
 * Institutional Slug Normalizer (idempotent)
 * - trims whitespace
 * - converts backslashes to slashes
 * - strips leading/trailing slashes
 * - collapses multiple slashes
 */
export function normalizeSlug(input: string): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

/**
 * normalizeHref
 * - ensures leading slash
 * - collapses multiple slashes
 * - preserves "/" root
 */
export function normalizeHref(input: string): string {
  const s = normalizeSlug(input);
  if (!s) return "/";
  return "/" + s;
}

/**
 * stripCollectionPrefix (generic)
 * Safely strips a known collection prefix from a slug/path.
 * Examples:
 * - stripCollectionPrefix("canon", "canon/vol-i") -> "vol-i"
 * - stripCollectionPrefix("canon", "/canon/vol-i") -> "vol-i"
 * - stripCollectionPrefix("canon", "vol-i") -> "vol-i"
 * - stripCollectionPrefix("canon", "canon") -> ""
 */
export function stripCollectionPrefix(prefix: string, slug: string): string {
  const p = normalizeSlug(prefix);
  let s = normalizeSlug(slug);

  if (!p) return s;

  // Remove repeated prefixes: canon/canon/x => x
  while (s.toLowerCase() === p.toLowerCase() || s.toLowerCase().startsWith(`${p.toLowerCase()}/`)) {
    if (s.toLowerCase() === p.toLowerCase()) return "";
    s = s.slice(p.length + 1);
    s = normalizeSlug(s);
  }

  return s;
}

/**
 * joinHref — HARD-LOCKED (idempotent, prefix-safe)
 *
 * Goals:
 *  - Never produce // or backslashes
 *  - Never duplicate collection prefixes when given mixed inputs:
 *      joinHref("canon", "canon/vol-i") -> "/canon/vol-i"
 *      joinHref("canon", "/canon/vol-i") -> "/canon/vol-i"
 *      joinHref("/canon", "vol-i") -> "/canon/vol-i"
 *  - If a later segment already contains earlier segments, keep the later, normalized:
 *      joinHref("books", "books/the-x") -> "/books/the-x"
 */
export function joinHref(...args: (string | undefined | null)[]): string {
  const raw = args
    .filter((a): a is string => typeof a === "string" && a.trim().length > 0)
    .map((a) => normalizeSlug(a))
    .filter(Boolean);

  if (raw.length === 0) return "/";

  const parts: string[] = [];

  for (const curr of raw) {
    if (!curr) continue;

    // If curr is absolute-ish already like "canon/vol-i" and we already have "canon",
    // we want to drop the earlier "canon" and keep curr.
    const prev = parts[parts.length - 1];

    if (!prev) {
      parts.push(curr);
      continue;
    }

    const prevLower = prev.toLowerCase();
    const currLower = curr.toLowerCase();

    // Exact duplicate
    if (currLower === prevLower) continue;

    // curr already contains prev prefix: ["canon", "canon/vol-i"]
    if (currLower.startsWith(prevLower + "/")) {
      parts.pop();
      parts.push(curr);
      continue;
    }

    // prev already contains curr prefix (rare): ["canon/vol-i","canon"]
    if (prevLower.startsWith(currLower + "/") || prevLower === currLower) {
      continue;
    }

    parts.push(curr);
  }

  // Join, collapse any accidental doubles, and force leading slash
  const joined = parts.join("/").replace(/\/{2,}/g, "/");
  return joined ? "/" + joined : "/";
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
 * getDocHref — HARDENED (project-wide)
 * - honors explicit href/url/permalink
 * - otherwise builds a canonical route without double-prefixing
 * - always returns a normalized href with a single leading slash
 */
export function getDocHref(doc: AnyDoc): string {
  const explicit = doc?.href || doc?.url || doc?.permalink;
  if (typeof explicit === "string" && explicit.trim()) {
    // IMPORTANT: normalize explicit paths too (prevents //canon//canon)
    return normalizeHref(explicit.trim());
  }

  const kind = getDocKind(doc);

  // Prefer slug; fallback to flattenedPath; then id
  const rawSlug = normalizeSlug(String(doc?.slug || doc?._raw?.flattenedPath || doc?._id || ""));

  switch (kind) {
    case "blog":
      return joinHref("blog", stripCollectionPrefix("blog", rawSlug));
    case "book":
      return joinHref("books", stripCollectionPrefix("books", rawSlug));
    case "canon":
      return joinHref("canon", stripCollectionPrefix("canon", rawSlug));
    case "download":
      return joinHref("downloads", stripCollectionPrefix("downloads", rawSlug));
    case "event":
      return joinHref("events", stripCollectionPrefix("events", rawSlug));
    case "print":
      return joinHref("prints", stripCollectionPrefix("prints", rawSlug));
    case "resource":
      return joinHref("resources", stripCollectionPrefix("resources", rawSlug));
    case "short":
      return joinHref("shorts", stripCollectionPrefix("shorts", rawSlug));
    case "strategy":
      return joinHref("strategy", stripCollectionPrefix("strategy", rawSlug));
    default:
      // If already nested, use it as-is; otherwise put in /content
      return rawSlug.includes("/") ? normalizeHref(rawSlug) : joinHref("content", rawSlug);
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
  if (doc?.downloadUrl) return String(doc.downloadUrl);
  if (doc?.slug) return joinHref("downloads", normalizeSlug(String(doc.slug)));
  return null;
}
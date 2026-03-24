/**
 * lib/content/canonical.ts
 * 
 * Canonical slug contract for all content documents.
 * 
 * Every content document must expose these three fields at ingestion time:
 * - collectionSlug: full collection-qualified slug, no leading slash
 * - urlSlug: bare public slug, no leading slash
 * - href: final public URL
 * 
 * This is the single source of truth for all slug handling across the project.
 */

export type CanonicalSlugFields = {
  collection: string;
  collectionSlug: string;
  urlSlug: string;
  href: string;
};

/**
 * Normalize a path string to a consistent format:
 * - No leading/trailing slashes
 * - Forward slashes only
 * - No .md or .mdx extensions
 * - No duplicate slashes
 */
export function normalizePath(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/");
}

/**
 * Strip the collection prefix from a slug if present
 */
export function stripCollectionPrefix(input: string, collection: string): string {
  const normalized = normalizePath(input);
  const prefix = `${collection}/`;
  return normalized.toLowerCase().startsWith(prefix)
    ? normalized.slice(prefix.length)
    : normalized;
}

/**
 * Check if a path contains a content/ prefix and strip it
 */
export function stripContentPrefix(input: string): string {
  const normalized = normalizePath(input);
  return normalized.toLowerCase().startsWith("content/")
    ? normalized.slice("content/".length)
    : normalized;
}

/**
 * Build canonical slug fields from a raw slug-like value and collection name
 */
export function buildCanonicalSlugFields(
  collection: string,
  rawSlugLike: unknown,
): CanonicalSlugFields | null {
  const raw = normalizePath(rawSlugLike);
  if (!raw) return null;

  const withoutContent = stripContentPrefix(raw);
  const urlSlug = stripCollectionPrefix(withoutContent, collection);

  if (!urlSlug) return null;

  return {
    collection,
    collectionSlug: `${collection}/${urlSlug}`,
    urlSlug,
    href: `/${collection}/${urlSlug}`,
  };
}

/**
 * Validate that a document has proper canonical slug fields
 */
export function hasValidCanonicalSlugs(doc: any): boolean {
  return (
    doc &&
    typeof doc.collection === "string" &&
    typeof doc.collectionSlug === "string" &&
    typeof doc.urlSlug === "string" &&
    typeof doc.href === "string" &&
    doc.href.startsWith("/") &&
    !doc.collectionSlug.startsWith("/") &&
    !doc.urlSlug.startsWith("/")
  );
}

/**
 * Get the collection name from a document based on its path or kind
 */
export function inferCollectionFromDoc(doc: any): string | null {
  // Try explicit collection field first
  if (doc?.collection && typeof doc.collection === "string") {
    return doc.collection;
  }

  // Try kind-based inference
  const kind = doc?.kind || doc?.docKind || doc?.type;
  if (kind === "short") return "shorts";
  if (kind === "brief" || kind === "dispatch" || kind === "intelligence") return "briefs";
  if (kind === "post") return "blog";
  if (kind === "canon") return "canon";
  if (kind === "book") return "books";
  if (kind === "event") return "events";
  if (kind === "download") return "downloads";
  if (kind === "print") return "prints";
  if (kind === "resource") return "resources";
  if (kind === "strategy") return "strategy";
  if (kind === "lexicon") return "lexicon";
  if (kind === "vault") return "vault";

  // Try path-based inference
  const path = doc?._raw?.flattenedPath || doc?.slug || "";
  const normalized = normalizePath(path);
  
  if (normalized.startsWith("shorts/")) return "shorts";
  if (normalized.startsWith("briefs/")) return "briefs";
  if (normalized.startsWith("blog/") || normalized.startsWith("posts/")) return "blog";
  if (normalized.startsWith("canon/")) return "canon";
  if (normalized.startsWith("books/")) return "books";
  if (normalized.startsWith("events/")) return "events";
  if (normalized.startsWith("downloads/")) return "downloads";
  if (normalized.startsWith("prints/")) return "prints";
  if (normalized.startsWith("resources/")) return "resources";
  if (normalized.startsWith("strategy/")) return "strategy";
  if (normalized.startsWith("lexicon/")) return "lexicon";
  if (normalized.startsWith("vault/")) return "vault";

  return null;
}
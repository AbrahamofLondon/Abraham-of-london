// lib/routing/slug.ts

export type ContentKind =
  | "books"
  | "canon"
  | "downloads"
  | "resources"
  | "prints"
  | "briefs"
  | "intelligence"
  | "shorts";

export const VALID_CONTENT_KINDS: ContentKind[] = [
  "books",
  "canon",
  "downloads",
  "resources",
  "prints",
  "briefs",
  "intelligence",
  "shorts",
];

// Keep slug characters sane (URL-safe-ish)
// We allow "/" for nested slugs, but block obvious filesystem & HTML breakers.
const ILLEGAL_SLUG_CHARS = /[<>:"\\|?*\u0000-\u001F]/g;

function stripSlashes(s: string) {
  return s.replace(/^\/+/, "").replace(/\/+$/, "");
}

function stripKnownKindPrefix(s: string) {
  const kinds = VALID_CONTENT_KINDS.join("|");
  const re = new RegExp(`^(${kinds})\\/`, "i");
  return s.replace(re, "");
}

/**
 * Normalize a doc slug/path:
 * - accepts "canon/foo", "/canon/foo/", "foo"
 * - strips leading/trailing slashes
 * - strips known kind prefixes
 * - removes .md/.mdx
 */
export function normalizeDocSlug(input?: string): string {
  if (!input) return "";
  let s = String(input).trim();
  if (!s) return "";

  s = stripSlashes(s);
  s = s.replace(/\.(md|mdx)$/i, "");
  s = stripKnownKindPrefix(s);

  s = s.replace(/\/{2,}/g, "/"); // collapse accidental doubles
  s = s.replace(ILLEGAL_SLUG_CHARS, "");
  s = stripSlashes(s);

  return s;
}

/**
 * Build a route for a given kind + slug:
 * - slug can be bare ("foo") or prefixed ("canon/foo") or full "/canon/foo"
 */
export function buildRoute(kind: ContentKind, slug: string): string | undefined {
  if (!VALID_CONTENT_KINDS.includes(kind)) return undefined;
  const clean = normalizeDocSlug(slug);
  if (!clean) return undefined;
  return `/${kind}/${clean}`;
}

/**
 * Extract slug from a full path:
 * "/canon/foo/bar" -> "foo/bar"
 * "/foo" -> undefined (no kind segment)
 */
export function extractSlugFromPath(path: string): string | undefined {
  const p = stripSlashes(String(path || ""));
  const parts = p.split("/");
  if (parts.length < 2) return undefined;

  const kind = parts[0] as ContentKind;
  if (!VALID_CONTENT_KINDS.includes(kind)) return undefined;

  const rest = parts.slice(1).join("/");
  const normalized = normalizeDocSlug(rest);
  return normalized || undefined;
}

/**
 * Validate slug is non-empty after normalization and contains no illegal chars.
 */
export function isValidSlug(slug: string): boolean {
  const normalized = normalizeDocSlug(slug);
  if (!normalized) return false;
  return !ILLEGAL_SLUG_CHARS.test(normalized);
}
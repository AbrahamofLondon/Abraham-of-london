/**
 * lib/content/public-content-resolver.ts
 *
 * Central, family-aware resolver for public content routes.
 *
 * This is a thin facade over the already-healthy data layer
 * (`@/lib/content/server` → `@/lib/contentlayer-helper` → `_index.json`
 * + `@/lib/content/canonical`). It does NOT re-implement loading or slug
 * generation; it consolidates the rules that public routes must all share:
 *
 *   - Only published (non-draft, non-future) documents are returned.
 *   - Restricted / member-only documents are never exposed on public routes.
 *   - Legacy slug forms (prefixed, with/without leading slash, raw file path)
 *     all resolve to the same canonical document.
 *   - Exact family match is preferred; legacy fallback only for public docs.
 *
 * Server-only module. Do not import from client components.
 */

import {
  getPublishedPosts,
  getPublishedBooks,
  getPublishedBriefs,
  getPublishedIntelligence,
  getAllPlaybooks,
  getAllEditorials,
  isPublished,
  type ContentDoc,
} from "@/lib/content/server";

// ─────────────────────────────────────────────────────────────────────────────
// FAMILIES
// ─────────────────────────────────────────────────────────────────────────────

export type ContentFamily =
  | "blog"
  | "books"
  | "playbooks"
  | "editorials"
  | "library"
  | "intelligence"
  | "briefs";

// Route base segment for each family (used to build hrefs / static paths).
const FAMILY_ROUTE_BASE: Record<ContentFamily, string> = {
  blog: "blog",
  books: "books",
  playbooks: "playbooks",
  editorials: "editorials",
  library: "library",
  intelligence: "intelligence",
  briefs: "briefs",
};

// Known path/slug prefixes that must be stripped to reach a bare slug.
// Mirrors the prefixes already handled across the individual route files so
// every family resolves legacy URLs identically.
const KNOWN_PREFIXES = [
  "blog",
  "blogs",
  "post",
  "posts",
  "article",
  "articles",
  "editorial",
  "editorials",
  "book",
  "books",
  "playbook",
  "playbooks",
  "library",
  "content",
  "public",
  "restricted",
  "member",
  "members",
  "intelligence",
  "brief",
  "briefs",
  "vault",
];

// ─────────────────────────────────────────────────────────────────────────────
// SLUG NORMALISATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a slug-like value: forward slashes only, no leading/trailing
 * slashes, no .md/.mdx extension, no duplicate slashes, lower-cased.
 */
export function normalizeSlug(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/")
    .toLowerCase();
}

/**
 * Repeatedly strip any known collection/access prefix from the front of a slug
 * until a bare slug remains. Handles e.g. `content/blog/foo`, `/restricted/foo`,
 * `books/foo`, etc.
 */
export function stripKnownPrefixes(input: unknown): string {
  let s = normalizeSlug(input);
  if (!s || s.includes("..")) return "";

  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of KNOWN_PREFIXES) {
      const p = `${prefix}/`;
      if (s.startsWith(p)) {
        s = normalizeSlug(s.slice(p.length));
        changed = true;
        break;
      }
    }
  }

  if (!s || s.includes("..")) return "";
  return s;
}

/**
 * Every slug-like identity a document can legitimately be matched on, in
 * canonical (prefix-stripped) form. Used for legacy URL resolution.
 */
export function getDocumentSlugCandidates(doc: ContentDoc | null | undefined): string[] {
  if (!doc) return [];
  const anyDoc = doc as any;

  const sources = [
    anyDoc.urlSlug,
    anyDoc.slug,
    anyDoc.slugComputed,
    anyDoc.collectionSlug,
    anyDoc.href,
    anyDoc.canonical,
    anyDoc?._raw?.flattenedPath,
    anyDoc?._raw?.sourceFilePath,
    anyDoc?._raw?.sourceFileName,
  ];

  const out = new Set<string>();
  for (const src of sources) {
    if (typeof src !== "string") continue;
    const bare = stripKnownPrefixes(src);
    if (bare) out.add(bare);
  }
  return [...out];
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A document is public when its access tier resolves to "public" and it does
 * not require auth. Restricted/member/verified/top-secret are never public.
 */
export function isPublicDoc(doc: ContentDoc | null | undefined): boolean {
  if (!doc) return false;
  const anyDoc = doc as any;

  if (anyDoc.requiresAuthSafe === true) return false;
  if (anyDoc.requiresAuth === true) return false;

  const tier = String(
    anyDoc.accessTierSafe ??
      anyDoc.accessLevel ??
      anyDoc.accessTier ??
      anyDoc.tier ??
      anyDoc.classification ??
      "public",
  )
    .trim()
    .toLowerCase();

  if (!tier) return true;
  return tier === "public" || tier === "open" || tier === "free" || tier === "unclassified";
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY LOADERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Raw published documents for a family (before the public-only filter).
 * `library` is intentionally not a Contentlayer family — it is served by the
 * PDF library subsystem (`@/lib/library/library-index`) — so this returns [].
 */
function loadPublishedFamily(family: ContentFamily): ContentDoc[] {
  switch (family) {
    case "blog":
      return getPublishedPosts();
    case "books":
      return getPublishedBooks();
    case "briefs":
      return getPublishedBriefs();
    case "intelligence":
      return getPublishedIntelligence();
    case "playbooks":
      return getAllPlaybooks().filter(isPublished);
    case "editorials":
      return getAllEditorials().filter(isPublished);
    case "library":
      return [];
    default:
      return [];
  }
}

/**
 * Public, published documents for a family. This is what index pages must
 * count and iterate.
 */
export function resolvePublicDocumentsByFamily(family: ContentFamily): ContentDoc[] {
  return loadPublishedFamily(family).filter(isPublicDoc);
}

/**
 * Resolve a single public document in a family by any legacy or canonical slug.
 * Returns null if no public, published, matching document exists.
 */
export function resolvePublicDocumentBySlug(
  family: ContentFamily,
  slug: unknown,
): ContentDoc | null {
  const needle = stripKnownPrefixes(slug);
  if (!needle) return null;

  const docs = resolvePublicDocumentsByFamily(family);

  // Exact family match first (canonical urlSlug).
  const exact = docs.find((doc) => stripKnownPrefixes((doc as any).urlSlug) === needle);
  if (exact) return exact;

  // Legacy fallback: any candidate identity, public docs only.
  return (
    docs.find((doc) => getDocumentSlugCandidates(doc).includes(needle)) || null
  );
}

/**
 * Next.js getStaticPaths entries for a family. Single-segment families use a
 * string slug; blog uses a catch-all (string[]) to preserve nested legacy URLs.
 */
export function getStaticPathsForFamily(family: ContentFamily): {
  paths: Array<{ params: Record<string, string | string[]> }>;
  fallback: "blocking";
} {
  const docs = resolvePublicDocumentsByFamily(family);
  const catchAll = family === "blog";

  const seen = new Set<string>();
  const paths: Array<{ params: Record<string, string | string[]> }> = [];

  for (const doc of docs) {
    const bare = stripKnownPrefixes((doc as any).urlSlug) || getDocumentSlugCandidates(doc)[0];
    if (!bare || seen.has(bare)) continue;
    seen.add(bare);
    paths.push({
      params: { slug: catchAll ? bare.split("/") : bare },
    });
  }

  return { paths, fallback: "blocking" };
}

/** Public href for a family + bare slug. */
export function familyHref(family: ContentFamily, bareSlug: string): string {
  const base = FAMILY_ROUTE_BASE[family];
  const slug = stripKnownPrefixes(bareSlug);
  return slug ? `/${base}/${slug}` : `/${base}`;
}

export const PUBLIC_CONTENT_FAMILIES: ContentFamily[] = [
  "blog",
  "books",
  "playbooks",
  "editorials",
  "intelligence",
  "briefs",
];

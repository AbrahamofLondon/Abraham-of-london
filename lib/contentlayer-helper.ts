/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type DocKind =
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "canon"
  | "short"
  | "unknown";

export type ContentDoc = any;

/* -------------------------------------------------------------------------- */
/* Routing                                                                    */
/* -------------------------------------------------------------------------- */

const KIND_URL_MAP: Record<DocKind, string> = {
  post: "/blog",
  book: "/books",
  canon: "/canon",
  download: "/downloads",
  event: "/events",
  print: "/prints",
  short: "/shorts",
  resource: "/resources",
  strategy: "/strategy",
  unknown: "/content",
};

const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";
const SHORT_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function pickArray(name: string): ContentDoc[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

const cleanStr = (v: unknown) => String(v ?? "").trim();
const cleanLower = (v: unknown) => cleanStr(v).toLowerCase();
const trimTrailingSlashes = (s: string) => s.replace(/\/+$/, "");
const trimLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/**
 * Canonical slug normalizer.
 * Accepts:
 *  - "my-post"
 *  - "/blog/my-post"
 *  - "blog/my-post/"
 *  - "https://www.site.com/blog/my-post"
 *  - "/my-post"
 * Returns:
 *  - "my-post"
 */
function toCanonicalSlug(input: unknown): string {
  let s = cleanStr(input);
  if (!s) return "";

  // Strip query/hash
  s = s.split("#")[0]?.split("?")[0] ?? s;

  // Strip protocol + domain if present
  // e.g. https://www.abrahamoflondon.org/blog/my-post -> /blog/my-post
  s = s.replace(/^https?:\/\/[^/]+/i, "");

  // Normalise slashes + casing
  s = trimTrailingSlashes(cleanLower(s));
  s = trimLeadingSlashes(s);

  if (!s) return "";

  // If slug contains folders (blog/xxx), take last segment
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

/* -------------------------------------------------------------------------- */
/* Collections                                                                */
/* -------------------------------------------------------------------------- */

export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

/* Aliases (legacy safety) */
export { allCanons as allCanon, allPosts as allPost };

/* -------------------------------------------------------------------------- */
/* Draft / Publish                                                            */
/* -------------------------------------------------------------------------- */

export const isDraft = (doc: ContentDoc): boolean =>
  doc?.draft === true || cleanStr(doc?._raw?.sourceFileName).startsWith("_");

export const isPublished = (doc: ContentDoc): boolean => !isDraft(doc);

/* -------------------------------------------------------------------------- */
/* Kind detection (matches your Contentlayer doc names)                       */
/* -------------------------------------------------------------------------- */

export function getDocKind(doc: ContentDoc): DocKind {
  // In Contentlayer, doc._type is usually the document name (e.g. "Post").
  // Some configs might also expose doc.type.
  const raw = cleanLower(doc?._type ?? doc?.type);

  switch (raw) {
    case "post":
      return "post";
    case "book":
      return "book";
    case "canon":
      return "canon";
    case "short":
      return "short";
    case "download":
      return "download";
    case "resource":
      return "resource";
    case "event":
      return "event";
    case "print":
      return "print";
    case "strategy":
      return "strategy";
    default:
      return "unknown";
  }
}

/* -------------------------------------------------------------------------- */
/* Slug normalisation                                                         */
/* -------------------------------------------------------------------------- */

export function normalizeSlug(doc: ContentDoc): string {
  if (!doc) return "";

  // explicit slug wins
  const explicit = toCanonicalSlug(doc.slug);
  if (explicit) return explicit;

  // fallback to flattenedPath (e.g. "blog/christianity-not-extremism")
  const fp = cleanStr(doc?._raw?.flattenedPath);
  if (!fp) return "";

  const fpClean = trimTrailingSlashes(cleanLower(fp));
  const parts = fpClean.split("/").filter(Boolean);
  if (parts.length === 0) return "";

  const last = parts[parts.length - 1];
  const slug = last === "index" ? parts[parts.length - 2] ?? "" : last;

  return toCanonicalSlug(slug);
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

export function getAccessLevel(
  doc: ContentDoc,
): "public" | "inner-circle" | "private" {
  const v = cleanLower(doc?.accessLevel);
  if (v === "inner-circle" || v === "private" || v === "public") return v;
  // Default public so you don't accidentally hide most docs.
  return "public";
}

export function isPublic(doc: ContentDoc): boolean {
  return getAccessLevel(doc) === "public";
}

/* -------------------------------------------------------------------------- */
/* URLs                                                                       */
/* -------------------------------------------------------------------------- */

export function getDocHref(doc: ContentDoc): string {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);

  const base = KIND_URL_MAP[kind] ?? "/content";
  return slug ? `${base}/${slug}` : base;
}

export function getShortUrl(doc: ContentDoc): string {
  return getDocHref(doc);
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

export function resolveDocCoverImage(doc: ContentDoc): string {
  const explicit = cleanStr(doc?.coverImage || doc?.image || doc?.cover);
  if (explicit) return ensureLeadingSlash(explicit);

  return getDocKind(doc) === "short"
    ? SHORT_GLOBAL_FALLBACK
    : GLOBAL_FALLBACK_IMAGE;
}

/**
 * Normalises download urls:
 * - Prefer explicit public paths (/assets/downloads/...)
 * - If legacy /downloads/... is found, rewrite to /assets/downloads/...
 */
export function resolveDocDownloadUrl(doc: ContentDoc): string | null {
  const raw =
    cleanStr(doc?.downloadUrl) ||
    cleanStr(doc?.fileUrl) ||
    cleanStr(doc?.pdfPath) ||
    cleanStr(doc?.file) ||
    cleanStr(doc?.downloadFile);

  if (!raw) return null;

  const url = ensureLeadingSlash(raw);

  // Rewrite legacy path
  if (url.startsWith("/downloads/")) {
    return url.replace(/^\/downloads\//, "/assets/downloads/");
  }

  return url;
}

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

export const getAllContentlayerDocs = (): ContentDoc[] =>
  [
    ...allPosts,
    ...allBooks,
    ...allDownloads,
    ...allEvents,
    ...allPrints,
    ...allResources,
    ...allStrategies,
    ...allCanons,
    ...allShorts,
  ].filter(Boolean);

export const getPublishedDocuments = (): ContentDoc[] =>
  getAllContentlayerDocs().filter(isPublished);

export function getPublishedDocumentsByType(
  kind: DocKind,
  limit?: number,
): ContentDoc[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort(
      (a, b) =>
        new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime(),
    );

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

/* -------------------------------------------------------------------------- */
/* Named Queries                                                              */
/* -------------------------------------------------------------------------- */

export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

export function getRecentShorts(limit = 3): ContentDoc[] {
  return getPublishedShorts().slice(0, Math.max(0, limit));
}

/* Canon convenience */
export const getPublicCanons = (): ContentDoc[] =>
  getAllCanons().filter((d) => isPublished(d) && isPublic(d));

/* -------------------------------------------------------------------------- */
/* By Slug                                                                    */
/* -------------------------------------------------------------------------- */

const cleanMatch = (s: string) => toCanonicalSlug(s);

export const getPostBySlug = (s: string) =>
  getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getBookBySlug = (s: string) =>
  getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getCanonBySlug = (s: string) =>
  getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getShortBySlug = (s: string) =>
  getPublishedShorts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getDownloadBySlug = (s: string) =>
  getAllDownloads().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getResourceBySlug = (s: string) =>
  getAllResources().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getEventBySlug = (s: string) =>
  getAllEvents().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getPrintBySlug = (s: string) =>
  getAllPrints().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getStrategyBySlug = (s: string) =>
  getAllStrategies().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

/* -------------------------------------------------------------------------- */
/* Build Guard                                                                */
/* -------------------------------------------------------------------------- */

export function assertContentlayerHasDocs(where: string) {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(
      `[Critical Build Error] No Contentlayer documents found at ${where}`,
    );
  }
}
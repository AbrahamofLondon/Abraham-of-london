// lib/contentlayer-helper.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "@/lib/contentlayer";

/* -------------------------------------------------------------------------- */
/* Core types                                                                 */
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

export type AccessLevel =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

type GeneratedArrays = {
  allPosts?: unknown;
  allBooks?: unknown;
  allDownloads?: unknown;
  allEvents?: unknown;
  allPrints?: unknown;
  allResources?: unknown;
  allStrategies?: unknown;
  allCanons?: unknown;
  allShorts?: unknown;
};

type RawMeta = { flattenedPath?: string; sourceFileName?: string };

export type ContentDoc = {
  _type?: string;
  type?: string;

  _raw?: RawMeta;

  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  date?: string | Date | null;

  slug?: string | null;
  canonicalUrl?: string | null;

  url?: string | null; // computed canonical route
  href?: string | null; // CTA only

  draft?: boolean;
  featured?: boolean;

  accessLevel?: string | null;
  lockMessage?: string | null;

  tags?: unknown;

  coverImage?: string | null;
  coverimage?: string | null;
  normalizedCoverImage?: string | null; // computed

  readTime?: string | null;
  readtime?: string | null;
  readingTime?: string | null;
  normalizedReadTime?: string | null; // computed

  canonicalPdfHref?: string | null;

  body?: { raw?: string; code?: string } | null;
  content?: string | null;

  // allow arbitrary frontmatter passthrough
  [key: string]: unknown;
};

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const KIND_URL_MAP: Record<DocKind, string> = {
  post: "/blog",
  book: "/books",
  download: "/downloads",
  event: "/events",
  print: "/prints",
  resource: "/resources",
  strategy: "/strategy",
  canon: "/canon",
  short: "/shorts",
  unknown: "/content",
};

const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

/**
 * NOTE:
 * Keep this as a single, real file path — never a directory.
 * This allows any downstream code to treat it as a final image, not something to scan.
 */
const SHORT_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

/**
 * Your themed covers live here:
 * /public/assets/images/shorts/themes/*.jpg  ->  "/assets/images/shorts/themes/*.jpg"
 *
 * Use tag/category signals to pick a theme deterministically.
 * No filesystem scanning. No randomness. No Windows EPERM traps.
 */
const SHORT_THEME_COVERS: Record<string, string> = {
  default: "/assets/images/shorts/themes/default-cover.jpg",
  faith: "/assets/images/shorts/themes/faith.jpg",
  gentle: "/assets/images/shorts/themes/gentle.jpg",
  "hard-truths": "/assets/images/shorts/themes/hard-truths.jpg",
  "inner-life": "/assets/images/shorts/themes/inner-life.jpg",
  "outer-life": "/assets/images/shorts/themes/outer-life.jpg",
  purpose: "/assets/images/shorts/themes/purpose.jpg",
  relationships: "/assets/images/shorts/themes/relationships.jpg",
};

/* -------------------------------------------------------------------------- */
/* Small utilities                                                            */
/* -------------------------------------------------------------------------- */

const cleanStr = (v: unknown) => String(v ?? "").trim();
const cleanLower = (v: unknown) => cleanStr(v).toLowerCase();

const trimLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
const trimTrailingSlashes = (s: string) => s.replace(/\/+$/, "");
const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/** Normalize internal paths: leading slash, forward slashes, no query/hash. */
function normalizeInternalPath(input: unknown): string {
  let s = cleanStr(input);
  if (!s) return "";

  // allow remote passthrough (for download URLs etc.)
  if (/^https?:\/\//i.test(s)) return s;

  // strip query/hash
  s = stripQueryAndHash(s);

  // normalize slashes
  s = s.replace(/\\/g, "/");

  // trim spaces + enforce internal
  s = ensureLeadingSlash(s);

  // collapse accidental doubles (keep protocol-safe already handled above)
  s = s.replace(/\/{2,}/g, "/");

  return s;
}

function stripQueryAndHash(s: string): string {
  return s.split("#")[0]?.split("?")[0] ?? s;
}

function isValidInternalUrl(u: string): boolean {
  return u.startsWith("/") && !u.startsWith("//");
}

/**
 * Canonical slug = last segment only (used ONLY where pages expect [slug].tsx).
 * For Resources Catch-All ([...slug]) you should use doc.url (computed) instead.
 */
function toCanonicalSlug(input: unknown): string {
  let s = cleanStr(input);
  if (!s) return "";
  s = stripQueryAndHash(s);
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = trimTrailingSlashes(cleanLower(s));
  s = trimLeadingSlashes(s);
  if (!s) return "";
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

function pickArray<K extends keyof GeneratedArrays>(name: K): ContentDoc[] {
  const v = (generated as any as GeneratedArrays)[name];
  return Array.isArray(v) ? (v as ContentDoc[]) : [];
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

/* -------------------------------------------------------------------------- */
/* Draft / Publish                                                            */
/* -------------------------------------------------------------------------- */

export const isDraftContent = (doc: ContentDoc): boolean =>
  doc?.draft === true || cleanStr(doc?._raw?.sourceFileName).startsWith("_");

export const isPublishedContent = (doc: ContentDoc): boolean => !isDraftContent(doc);

export const getPublishedDocuments = (): ContentDoc[] =>
  getAllContentlayerDocs().filter(isPublishedContent);

/* -------------------------------------------------------------------------- */
/* Kind detection                                                             */
/* -------------------------------------------------------------------------- */

export function getDocKind(doc: ContentDoc): DocKind {
  const raw = cleanLower(doc?._type ?? doc?.type);
  switch (raw) {
    case "post":
      return "post";
    case "book":
      return "book";
    case "download":
      return "download";
    case "event":
      return "event";
    case "print":
      return "print";
    case "resource":
      return "resource";
    case "strategy":
      return "strategy";
    case "canon":
      return "canon";
    case "short":
      return "short";
    default:
      return "unknown";
  }
}

/* -------------------------------------------------------------------------- */
/* Slug normalization                                                         */
/* -------------------------------------------------------------------------- */

export function normalizeSlug(doc: ContentDoc): string {
  if (!doc) return "";

  const explicit = toCanonicalSlug(doc.slug);
  if (explicit) return explicit;

  const fp = cleanStr(doc?._raw?.flattenedPath);
  if (!fp) return "";

  const fpClean = trimTrailingSlashes(cleanLower(fp));
  const parts = fpClean.split("/").filter(Boolean);
  if (!parts.length) return "";

  const last = parts[parts.length - 1];
  const slug = last === "index" ? parts[parts.length - 2] ?? "" : last;

  return toCanonicalSlug(slug);
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

export function getAccessLevel(doc: ContentDoc): AccessLevel {
  const v = cleanLower(doc?.accessLevel);
  switch (v) {
    case "public":
    case "inner-circle":
    case "inner-circle-plus":
    case "inner-circle-elite":
    case "private":
      return v;
    default:
      return "public";
  }
}

export function isPublic(doc: ContentDoc): boolean {
  return getAccessLevel(doc) === "public";
}

/* -------------------------------------------------------------------------- */
/* URL routing                                                                */
/* -------------------------------------------------------------------------- */

export function getDocHref(doc: ContentDoc): string {
  const computedUrl = cleanStr(doc?.url);
  if (computedUrl && isValidInternalUrl(computedUrl)) return normalizeInternalPath(computedUrl);

  const kind = getDocKind(doc);
  const base = KIND_URL_MAP[kind] ?? "/content";

  const slug = normalizeSlug(doc);
  return slug ? `${base}/${slug}` : base;
}

export function getDocCanonicalUrlPath(doc: ContentDoc): string {
  return getDocHref(doc);
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

function coerceTags(doc: ContentDoc): string[] {
  const t = doc?.tags;
  if (Array.isArray(t)) return (t as any[]).map((x) => cleanLower(x)).filter(Boolean);
  return [];
}

/**
 * Deterministic theme selection for Shorts.
 * Order of precedence:
 * 1) explicit coverImage / normalizedCoverImage
 * 2) theme inferred from tags/category-like fields
 * 3) SHORT_THEME_COVERS.default (if present)
 * 4) SHORT_GLOBAL_FALLBACK
 */
function resolveShortCover(doc: ContentDoc): string {
  // computed first
  const normalized = normalizeInternalPath(doc?.normalizedCoverImage);
  if (normalized && isValidInternalUrl(normalized)) return normalized;

  // raw variants
  const explicit = normalizeInternalPath(
    doc?.coverImage || doc?.coverimage || (doc as any)?.image || (doc as any)?.cover
  );
  if (explicit && isValidInternalUrl(explicit)) return explicit;

  // infer theme from tags
  const tags = coerceTags(doc);

  // quick signal extraction from common fields
  const themeHint = cleanLower((doc as any)?.theme || (doc as any)?.category || "");

  const candidates = [themeHint, ...tags].filter(Boolean);

  // map common phrases to known keys
  const normalizeThemeKey = (k: string) => {
    const s = cleanLower(k)
      .replace(/\s+/g, "-")
      .replace(/_/g, "-")
      .replace(/[^\w-]/g, "");

    if (s.includes("hard") && s.includes("truth")) return "hard-truths";
    if (s.includes("inner") && s.includes("life")) return "inner-life";
    if (s.includes("outer") && s.includes("life")) return "outer-life";
    if (s.includes("relationship")) return "relationships";
    if (s.includes("faith") || s.includes("scripture") || s.includes("theology")) return "faith";
    if (s.includes("purpose") || s.includes("calling") || s.includes("destiny")) return "purpose";
    if (s.includes("gentle") || s.includes("soft") || s.includes("comfort")) return "gentle";
    return s;
  };

  for (const c of candidates) {
    const key = normalizeThemeKey(c);
    const cover = SHORT_THEME_COVERS[key];
    if (cover) return cover;
  }

  return SHORT_THEME_COVERS.default || SHORT_GLOBAL_FALLBACK;
}

export function resolveDocCoverImage(doc: ContentDoc): string {
  const kind = getDocKind(doc);

  if (kind === "short") {
    // ✅ no FS scanning, deterministic theme assignment
    return normalizeInternalPath(resolveShortCover(doc)) || SHORT_GLOBAL_FALLBACK;
  }

  const normalized = normalizeInternalPath(doc?.normalizedCoverImage);
  if (normalized && isValidInternalUrl(normalized)) return normalized;

  const explicit = normalizeInternalPath(
    doc?.coverImage || doc?.coverimage || (doc as any)?.image || (doc as any)?.cover
  );
  if (explicit && isValidInternalUrl(explicit)) return explicit;

  return GLOBAL_FALLBACK_IMAGE;
}

export function resolveDocReadTime(doc: ContentDoc): string | null {
  const normalized = cleanStr(doc?.normalizedReadTime);
  if (normalized) return normalized;

  const raw =
    cleanStr(doc?.readTime) || cleanStr(doc?.readtime) || cleanStr(doc?.readingTime);

  return raw || null;
}

/* -------------------------------------------------------------------------- */
/* Download URLs (no FS checks here)                                          */
/* -------------------------------------------------------------------------- */

export function resolveDocDownloadUrl(doc: ContentDoc): string | null {
  const canonical = cleanStr(doc?.canonicalPdfHref);
  if (canonical) return normalizeInternalPath(canonical);

  const raw =
    cleanStr((doc as any)?.downloadUrl) ||
    cleanStr((doc as any)?.fileUrl) ||
    cleanStr((doc as any)?.pdfPath) ||
    cleanStr((doc as any)?.file) ||
    cleanStr((doc as any)?.downloadFile);

  if (!raw) return null;

  // allow remote
  if (/^https?:\/\//i.test(raw)) return raw;

  const url = normalizeInternalPath(raw);

  // normalize legacy "/downloads/foo.pdf" -> "/assets/downloads/foo.pdf"
  if (url.startsWith("/downloads/")) {
    return url.replace(/^\/downloads\//, "/assets/downloads/");
  }

  return url;
}

export function resolveDocDownloadHref(doc: ContentDoc): string | null {
  const direct = resolveDocDownloadUrl(doc);
  if (!direct) return null;

  if (getAccessLevel(doc) === "public") return direct;

  const slug = normalizeSlug(doc);
  if (!slug) return null;

  return `/api/downloads/${encodeURIComponent(slug)}`;
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

function safeTime(doc: ContentDoc): number {
  const v = doc?.date;
  try {
    const t = v ? new Date(v as any).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): ContentDoc[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => safeTime(b) - safeTime(a));

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

/* By Slug: last-segment match only */
const cleanMatch = (s: string) => toCanonicalSlug(s);

export const getPostBySlug = (s: string) =>
  getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getBookBySlug = (s: string) =>
  getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

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

export const getCanonBySlug = (s: string) =>
  getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getShortBySlug = (s: string) =>
  getPublishedShorts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

function safeDateIso(input: unknown): string | null {
  try {
    const d = new Date(String(input));
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0] ?? null;
  } catch {
    return null;
  }
}

export function getCardPropsForDocument(doc: ContentDoc): {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  href: string;
  coverImage: string;
  tags: string[];
  date: string | null;
  kind: DocKind;
  accessLevel: AccessLevel;
  downloadHref: string | null;
  readTime: string | null;
} {
  const title = cleanStr(doc?.title) || "Untitled";
  const excerpt = cleanStr(doc?.excerpt) || null;
  const description = cleanStr(doc?.description) || null;

  return {
    slug: normalizeSlug(doc),
    title,
    excerpt,
    description,
    href: getDocHref(doc),
    coverImage: resolveDocCoverImage(doc),
    tags: Array.isArray(doc?.tags)
      ? (doc.tags as any[]).map((t) => cleanStr(t)).filter(Boolean)
      : [],
    date: doc?.date ? safeDateIso(doc.date) : null,
    kind: getDocKind(doc),
    accessLevel: getAccessLevel(doc),
    downloadHref: getDocKind(doc) === "download" ? resolveDocDownloadHref(doc) : null,
    readTime: resolveDocReadTime(doc),
  };
}

/* -------------------------------------------------------------------------- */
/* Critical build guard                                                       */
/* -------------------------------------------------------------------------- */

export function assertContentlayerHasDocs(where: string) {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(`[Critical Build Error] No Contentlayer documents found at ${where}`);
  }
}
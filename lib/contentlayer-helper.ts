/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer-helper.ts
// SINGLE SOURCE OF TRUTH for Contentlayer docs, URLs, and card props.
// ✅ prefers doc.url (computedFields) to prevent dead links
// ✅ published-only getters (prevents “listed-but-404”)
// ✅ Shorts covers: theme-driven + global fallback
// ✅ Canon covers: filename conventions in /public/assets/images/canon

import * as generated from "contentlayer/generated";

// --------------------------------------------
// Types
// --------------------------------------------

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

export interface ContentlayerCardProps {
  type: string;
  slug: string;
  title: string;
  href: string;

  description?: string | null;
  excerpt?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;

  image?: string | null;
  tags?: string[];

  category?: string | null;
  author?: string | null;
  featured?: boolean;

  downloadUrl?: string | null;

  coverAspect?: string | null;
  coverFit?: string | null;
}

// --------------------------------------------
// Small utils
// --------------------------------------------

function pickArrayExport(...names: string[]): any[] {
  for (const n of names) {
    const v = (generated as any)[n];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function toBool(v: any): boolean {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") return v.trim().toLowerCase() === "true";
  return false;
}

function safeDateValue(v: any): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  try {
    if (v instanceof Date) return v.toISOString();
  } catch {}
  return null;
}

function isNonEmptyString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toCleanPath(s: string): string {
  const v = String(s ?? "").trim();
  if (!v) return "";
  return v.startsWith("/") ? v : `/${v}`;
}

// --------------------------------------------
// SHORTS COVER POLICY (your Option 4)
// --------------------------------------------

const SHORTS_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

const SHORT_THEME_COVERS: Record<string, string> = {
  "inner-life": "/assets/images/shorts/inner-life.jpg",
  "outer-life": "/assets/images/shorts/outer-life.jpg",
  "hard-truths": "/assets/images/shorts/hard-truths.jpg",
  gentle: "/assets/images/shorts/gentle.jpg",
  purpose: "/assets/images/shorts/purpose.jpg",
  relationships: "/assets/images/shorts/relationships.jpg",
  faith: "/assets/images/shorts/faith.jpg",
};

const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

// --------------------------------------------
// CANON COVER POLICY
// Your folder: /public/assets/images/canon/*.jpg
// We resolve missing Canon covers by conventions + a small map.
// --------------------------------------------

const CANON_GLOBAL_FALLBACK = "/assets/images/canon/volume-x-cover.jpg";

// Map “known canon slugs” to your actual filenames (from your screenshot)
const CANON_COVER_MAP: Record<string, string> = {
  "canon-introduction-letter": "/assets/images/canon/canon-intro-letter-cover.jpg",
  "canon-campaign": "/assets/images/canon/canon-campaign-cover.jpg",
  "canon-resources": "/assets/images/canon/canon-resources.jpg",
  "the-builders-catechism": "/assets/images/canon/builders-catechism-cover.jpg",
};

// Heuristic: try /assets/images/canon/{slug}.jpg or a “volume” rewrite.
// This is safe even if the file doesn’t exist: Next/Image will 404 the asset,
// but it won’t break routing. (Your goal here is to stop missing covers.)
function resolveCanonCoverByConvention(slug: string): string {
  const s = slug.toLowerCase();

  if (CANON_COVER_MAP[s]) return CANON_COVER_MAP[s];

  // direct: /canon slug → /assets/images/canon/slug.jpg
  // (works if you keep filenames aligned with slugs)
  const direct = `/assets/images/canon/${s}.jpg`;

  // common rewrite: volume-... → vol-...
  const volRewrite = s.startsWith("volume-")
    ? `/assets/images/canon/${s.replace(/^volume-/, "vol-")}.jpg`
    : "";

  // If you want to be stricter later, you can remove `direct`
  // and keep only explicit coverImage + CANON_COVER_MAP.
  return volRewrite || direct || CANON_GLOBAL_FALLBACK;
}

// --------------------------------------------
// Collections (exports your app expects)
// --------------------------------------------

export const allPosts = pickArrayExport("allPosts", "allPost");
export const allBooks = pickArrayExport("allBooks", "allBook");
export const allDownloads = pickArrayExport("allDownloads", "allDownload");
export const allEvents = pickArrayExport("allEvents", "allEvent");
export const allPrints = pickArrayExport("allPrints", "allPrint");
export const allResources = pickArrayExport("allResources", "allResource");
export const allStrategies = pickArrayExport("allStrategies", "allStrategy");
export const allCanons = pickArrayExport("allCanons", "allCanon");
export const allShorts = pickArrayExport("allShorts", "allShort");

// --------------------------------------------
// Status helpers
// --------------------------------------------

export const isDraft = (doc: any): boolean => toBool(doc?.draft);
export const isPublished = (doc: any): boolean => !isDraft(doc);

// --------------------------------------------
// Kind / slug / URL
// --------------------------------------------

export function getDocKind(doc: any): DocKind {
  const t = String(doc?.type ?? doc?._type ?? "").trim();
  switch (t) {
    case "Post":
      return "post";
    case "Book":
      return "book";
    case "Download":
      return "download";
    case "Event":
      return "event";
    case "Print":
      return "print";
    case "Resource":
      return "resource";
    case "Strategy":
      return "strategy";
    case "Canon":
      return "canon";
    case "Short":
      return "short";
    default:
      return "unknown";
  }
}

export function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  const s = isNonEmptyString(doc.slug) ? doc.slug.trim() : "";
  if (s) return s.toLowerCase();

  const fp = isNonEmptyString(doc?._raw?.flattenedPath)
    ? String(doc._raw.flattenedPath)
    : "";

  if (fp) {
    const cleaned = fp
      .replace(
        /^(content\/)?(blog|books|downloads|events|prints|resources|strategy|canon|shorts)\//,
        ""
      )
      .replace(/\/index$/, "");
    if (cleaned) return cleaned.trim().toLowerCase();
  }

  const title = isNonEmptyString(doc.title) ? doc.title.trim() : "";
  if (title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
  }

  return "untitled";
}

/**
 * IMPORTANT:
 * ✅ 1) doc.url (computedFields) wins
 * ✅ 2) doc.href override wins
 * ✅ 3) reconstruct fallback
 */
export function getDocHref(doc: any): string {
  if (isNonEmptyString(doc?.url)) return toCleanPath(doc.url);
  if (isNonEmptyString(doc?.href)) return toCleanPath(doc.href);

  const slug = normalizeSlug(doc);
  switch (getDocKind(doc)) {
    case "post":
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
    case "short":
      return `/shorts/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    case "strategy":
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

// --------------------------------------------
// Image / download helpers
// --------------------------------------------

export function resolveDocCoverImage(doc: any): string {
  if (isNonEmptyString(doc?.coverImage)) return doc.coverImage.trim();
  if (isNonEmptyString(doc?.image)) return doc.image.trim();

  const kind = getDocKind(doc);

  if (kind === "short") {
    const theme = String(doc?.theme ?? "").trim().toLowerCase();
    return SHORT_THEME_COVERS[theme] ?? SHORTS_GLOBAL_FALLBACK;
  }

  if (kind === "canon") {
    const slug = normalizeSlug(doc);
    return resolveCanonCoverByConvention(slug);
  }

  return GLOBAL_FALLBACK_IMAGE;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  const url =
    (isNonEmptyString(doc?.downloadUrl) && doc.downloadUrl.trim()) ||
    (isNonEmptyString(doc?.fileUrl) && doc.fileUrl.trim()) ||
    (isNonEmptyString(doc?.pdfPath) && doc.pdfPath.trim()) ||
    (isNonEmptyString(doc?.file) && doc.file.trim()) ||
    "";
  return url ? String(url) : null;
}

// --------------------------------------------
// SAFE getters (published-only is the default truth)
// --------------------------------------------

export const getAllContentlayerDocs = (): any[] =>
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

export const getPublishedDocuments = (): any[] =>
  getAllContentlayerDocs().filter(isPublished);

export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) {
    throw new Error(
      `[Contentlayer] 0 documents at "${where}". Contentlayer2 build likely did not run before Next build.`
    );
  }
}

// Canonical per-type published getters
export const getPublishedPosts = (): any[] => allPosts.filter(isPublished);
export const getAllBooks = (): any[] => allBooks.filter(isPublished);
export const getAllCanons = (): any[] => allCanons.filter(isPublished);
export const getAllDownloads = (): any[] => allDownloads.filter(isPublished);
export const getAllEvents = (): any[] => allEvents.filter(isPublished);
export const getAllPrints = (): any[] => allPrints.filter(isPublished);
export const getAllResources = (): any[] => allResources.filter(isPublished);
export const getAllStrategies = (): any[] => allStrategies.filter(isPublished);

// Shorts: published + published flag (optional)
export const getPublishedShorts = (): any[] =>
  allShorts.filter((d) => isPublished(d) && (d?.published == null || toBool(d?.published)));

// --------------------------------------------
// Lookups
// --------------------------------------------

const norm = (s: string) => String(s ?? "").trim().toLowerCase();

export function findDocByKindAndSlug(kind: DocKind, slug: string): any | null {
  const s = norm(slug);

  const pool =
    kind === "post"
      ? getPublishedPosts()
      : kind === "book"
      ? getAllBooks()
      : kind === "canon"
      ? getAllCanons()
      : kind === "download"
      ? getAllDownloads()
      : kind === "event"
      ? getAllEvents()
      : kind === "print"
      ? getAllPrints()
      : kind === "resource"
      ? getAllResources()
      : kind === "strategy"
      ? getAllStrategies()
      : kind === "short"
      ? getPublishedShorts()
      : getPublishedDocuments();

  // First: match by computed url’s tail segment
  const byUrl = pool.find((d) => {
    const href = getDocHref(d);
    return href.endsWith(`/${s}`) || href === `/${s}`;
  });
  if (byUrl) return byUrl;

  // Second: match by normalized slug
  return pool.find((d) => normalizeSlug(d) === s) ?? null;
}

export function getCardPropsForDocument(doc: any): ContentlayerCardProps {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);

  return {
    type: kind,
    slug,
    title: String(doc?.title ?? "Untitled"),
    href: getDocHref(doc),

    description: doc?.description ?? doc?.summary ?? null,
    excerpt: doc?.excerpt ?? null,
    subtitle: doc?.subtitle ?? null,
    date: safeDateValue(doc?.date) ?? (doc?.date ? String(doc.date) : null),
    readTime: doc?.readTime ?? doc?.readtime ?? null,

    image: resolveDocCoverImage(doc),
    tags: Array.isArray(doc?.tags) ? doc.tags : [],

    category: doc?.category ?? null,
    author: doc?.author ?? null,
    featured: toBool(doc?.featured),

    downloadUrl: resolveDocDownloadUrl(doc),

    coverAspect: doc?.coverAspect ?? null,
    coverFit: doc?.coverFit ?? null,
  };
}
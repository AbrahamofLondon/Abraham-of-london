/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer-helper.ts
// SINGLE SOURCE OF TRUTH for Contentlayer docs, URLs, and card props.
// ✅ ESM-safe
// ✅ Next-safe
// ✅ Contentlayer2-safe
// ✅ Resilient to generated export naming (singular/plural)
// ✅ Avoids TDZ by not executing helper logic at module scope
// ✅ URL/TRUTH: prefers doc.url computed field to avoid dead links
// ✅ Shorts covers: theme-driven + global fallback /assets/images/shorts/cover.jpg

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
  type: string; // lowercase DocKind
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
// Internal helpers
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
  } catch {
    // ignore
  }
  return null;
}

function toCleanPath(s: string): string {
  const v = String(s ?? "").trim();
  if (!v) return "";
  return v.startsWith("/") ? v : `/${v}`;
}

function isNonEmptyString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// --------------------------------------------
// SHORTS COVER POLICY (Option 4)
// --------------------------------------------
// Global fallback for shorts:
const SHORTS_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

// Theme → cover mapping (you requested these exact themes)
const SHORT_THEME_COVERS: Record<string, string> = {
  "inner-life": "/assets/images/shorts/inner-life.jpg",
  "outer-life": "/assets/images/shorts/outer-life.jpg",
  "hard-truths": "/assets/images/shorts/hard-truths.jpg",
  gentle: "/assets/images/shorts/gentle.jpg",
  purpose: "/assets/images/shorts/purpose.jpg",
  relationships: "/assets/images/shorts/relationships.jpg",
  faith: "/assets/images/shorts/faith.jpg",
};

// Non-shorts fallback (keep your current site fallback)
const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

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
// Doc kind / slug / URL helpers
// --------------------------------------------

export function getDocKind(doc: any): DocKind {
  // Prefer Contentlayer’s internal type info when available
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
    // Remove known base folders; preserve nesting for resources if any
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
 * SITE ROUTES:
 * - Posts:      /blog/[slug]
 * - Books:      /books/[slug]
 * - Canon:      /canon/[slug]
 * - Downloads:  /downloads/[slug]
 * - Events:     /events/[slug]
 * - Prints:     /prints/[slug]
 * - Shorts:     /shorts/[slug]
 * - Resources:  /resources/[...slug]
 * - Strategy:   /strategy/[slug]
 * - Fallback:   /content/[slug]
 *
 * IMPORTANT:
 * ✅ First choice: doc.url (computedFields from contentlayer.config.ts)
 * ✅ Second: doc.href (author override)
 * ✅ Third: reconstruction fallback
 */
export function getDocHref(doc: any): string {
  // 0) Contentlayer computed URL wins
  if (isNonEmptyString(doc?.url)) return toCleanPath(doc.url);

  // 1) Author override wins
  if (isNonEmptyString(doc?.href)) return toCleanPath(doc.href);

  // 2) Reconstruct
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  switch (kind) {
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
      return `/resources/${slug}`; // supports nested via slug containing "/"
    case "strategy":
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

export const getShortUrl = (short: any): string => getDocHref(short);

// --------------------------------------------
// Image / download helpers
// --------------------------------------------

export function resolveDocCoverImage(doc: any): string {
  // Explicit cover wins (all types)
  if (isNonEmptyString(doc?.coverImage)) return doc.coverImage.trim();
  if (isNonEmptyString(doc?.image)) return doc.image.trim();

  // Shorts: theme-driven
  if (getDocKind(doc) === "short") {
    const theme = String(doc?.theme ?? "").trim().toLowerCase();
    return SHORT_THEME_COVERS[theme] ?? SHORTS_GLOBAL_FALLBACK;
  }

  // Non-shorts fallback
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
// SAFE getters (computed at call-time)
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

export const getFeaturedDocuments = (): any[] =>
  getPublishedDocuments().filter((doc) => toBool(doc?.featured));

// These are function-backed exports (avoid import-time computation)
export const allDocuments = getAllContentlayerDocs;
export const allContent = getAllContentlayerDocs;
export const allPublished = getPublishedDocuments;

// --------------------------------------------
// Guard
// --------------------------------------------

export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) {
    throw new Error(
      `[Contentlayer] 0 documents at "${where}". ` +
        `Contentlayer2 build likely did not run (or produced nothing) before Next build.`
    );
  }
}

export const isContentlayerLoaded = (): boolean =>
  getAllContentlayerDocs().length > 0;

// --------------------------------------------
// Buckets
// --------------------------------------------

export function getPublishedDocumentsByType(): Record<DocKind, any[]> {
  const published = getPublishedDocuments();

  const buckets: Record<DocKind, any[]> = {
    post: [],
    book: [],
    download: [],
    event: [],
    print: [],
    resource: [],
    strategy: [],
    canon: [],
    short: [],
    unknown: [],
  };

  for (const doc of published) buckets[getDocKind(doc)].push(doc);

  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k].sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  });

  return buckets;
}

// Individual getters expected by routes/pages
export const getPublishedPosts = (): any[] => allPosts.filter(isPublished);
export const getPublishedShorts = (): any[] =>
  allShorts.filter((d) => isPublished(d) && (d?.published == null || toBool(d?.published)));

export const getAllBooks = (): any[] => allBooks.filter(isPublished);
export const getAllCanons = (): any[] => allCanons.filter(isPublished);
export const getAllDownloads = (): any[] => allDownloads.filter(isPublished);
export const getAllEvents = (): any[] => allEvents.filter(isPublished);
export const getAllPrints = (): any[] => allPrints.filter(isPublished);
export const getAllResources = (): any[] => allResources.filter(isPublished);
export const getAllStrategies = (): any[] => allStrategies.filter(isPublished);

// By-slug getters (slug-only convenience)
const norm = (s: string) => String(s ?? "").trim().toLowerCase();

export const getPostBySlug = (slug: string): any | undefined =>
  getPublishedPosts().find((d) => normalizeSlug(d) === norm(slug));

export const getShortBySlug = (slug: string): any | undefined =>
  getPublishedShorts().find((d) => normalizeSlug(d) === norm(slug));

export const getBookBySlug = (slug: string): any | undefined =>
  getAllBooks().find((d) => normalizeSlug(d) === norm(slug));

export const getCanonBySlug = (slug: string): any | undefined =>
  getAllCanons().find((d) => normalizeSlug(d) === norm(slug));

export const getDocumentBySlug = (slug: string): any | undefined =>
  getAllContentlayerDocs().find((d) => normalizeSlug(d) === norm(slug));

export const getDocByHref = (href: string): any | undefined => {
  const h = toCleanPath(href);
  return getAllContentlayerDocs().find((d) => getDocHref(d) === h);
};

export const getBySlugAndKind = (slug: string, kind: DocKind): any | undefined =>
  getPublishedDocumentsByType()[kind]?.find((d) => normalizeSlug(d) === norm(slug));

// Type guards
export const isPost = (doc: any): boolean => getDocKind(doc) === "post";
export const isBook = (doc: any): boolean => getDocKind(doc) === "book";
export const isDownload = (doc: any): boolean => getDocKind(doc) === "download";
export const isEvent = (doc: any): boolean => getDocKind(doc) === "event";
export const isPrint = (doc: any): boolean => getDocKind(doc) === "print";
export const isResource = (doc: any): boolean => getDocKind(doc) === "resource";
export const isStrategy = (doc: any): boolean => getDocKind(doc) === "strategy";
export const isCanon = (doc: any): boolean => getDocKind(doc) === "canon";
export const isShort = (doc: any): boolean => getDocKind(doc) === "short";

// Cards
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

// Shorts helpers
export const getRecentShorts = (limit: number = 3): any[] => {
  const shorts = getPublishedShorts();
  return shorts
    .slice()
    .sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
};

export const getFeaturedShorts = (limit: number = 3): any[] => {
  const shorts = getPublishedShorts();
  return shorts
    .filter((s) => toBool(s?.featured))
    .slice()
    .sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
};
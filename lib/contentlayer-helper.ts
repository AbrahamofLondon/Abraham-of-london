/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer-helper.ts
// SINGLE SOURCE OF TRUTH for Contentlayer docs, URLs, and card props.
// ✅ ESM-safe (project is "type": "module")
// ✅ Next-safe (no require hacks)
// ✅ Contentlayer2-safe (uses contentlayer/generated output)
// ✅ Exports ALL names your codebase expects

import {
  allPosts as _allPosts,
  allBooks as _allBooks,
  allDownloads as _allDownloads,
  allEvents as _allEvents,
  allPrints as _allPrints,
  allResources as _allResources,
  allStrategies as _allStrategies,
  allCanons as _allCanons,
  allShorts as _allShorts,
} from "contentlayer/generated";

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
  | "short";

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
// Collections (exports your app expects)
// --------------------------------------------

export const allPosts = Array.isArray(_allPosts) ? _allPosts : [];
export const allBooks = Array.isArray(_allBooks) ? _allBooks : [];
export const allDownloads = Array.isArray(_allDownloads) ? _allDownloads : [];
export const allEvents = Array.isArray(_allEvents) ? _allEvents : [];
export const allPrints = Array.isArray(_allPrints) ? _allPrints : [];
export const allResources = Array.isArray(_allResources) ? _allResources : [];
export const allStrategies = Array.isArray(_allStrategies) ? _allStrategies : [];
export const allCanons = Array.isArray(_allCanons) ? _allCanons : [];
export const allShorts = Array.isArray(_allShorts) ? _allShorts : [];

// Some code expects “allDocuments / allContent / allPublished”
export const allDocuments: any[] = [
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

export const allContent: any[] = [...allDocuments];
export const allPublished: any[] = allDocuments.filter((d) => !isDraft(d));

// --------------------------------------------
// Build-time guard: fail loudly if content is missing
// --------------------------------------------

export function assertContentlayerHasDocs(where: string) {
  if (allDocuments.length === 0) {
    throw new Error(
      `[Contentlayer] 0 documents at "${where}". ` +
        `This means contentlayer2 build did not run (or produced nothing) before Next build.`
    );
  }
}

// --------------------------------------------
// Status helpers
// --------------------------------------------

export const isContentlayerLoaded = (): boolean => allDocuments.length > 0;

export const isDraft = (doc: any): boolean => {
  const d = doc?.draft;
  if (d === true || d === "true") return true;
  if (d === false || d === "false" || d == null) return false;
  return false;
};

export const isPublished = (doc: any): boolean => !isDraft(doc);

// --------------------------------------------
// Kind / slug / URL helpers
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
      return "post";
  }
}

export function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  const s = typeof doc.slug === "string" ? doc.slug.trim() : "";
  if (s) return s.toLowerCase();

  const fp =
    typeof doc?._raw?.flattenedPath === "string" ? doc._raw.flattenedPath : "";
  if (fp) {
    const parts = fp.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const pick = last === "index" ? parts[parts.length - 2] : last;
    if (pick) return String(pick).trim().toLowerCase();
  }

  const title = typeof doc.title === "string" ? doc.title.trim() : "";
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
 * SITE ROUTES (matches what you showed):
 * - Posts:      /blog/[slug]
 * - Books:      /books/[slug]
 * - Canon:      /canon/[slug]
 * - Downloads:  /downloads/[slug]
 * - Events:     /events/[slug]
 * - Prints:     /prints/[slug]
 * - Shorts:     /shorts/[slug]
 * - Resources:  /resources/[...slug]
 * - Strategy:   /strategy/[slug]
 * - ReadingRoom: /content/[slug] fallback
 */
export function getDocHref(doc: any): string {
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  switch (kind) {
    case "post":
      return `/blog/${slug}`;
    case "short":
      return `/shorts/${slug}`;
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

const FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

export function resolveDocCoverImage(doc: any): string {
  const img =
    (typeof doc?.coverImage === "string" && doc.coverImage.trim()) ||
    (typeof doc?.image === "string" && doc.image.trim()) ||
    "";
  return img ? String(img) : FALLBACK_IMAGE;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  const url =
    (typeof doc?.downloadUrl === "string" && doc.downloadUrl.trim()) ||
    (typeof doc?.fileUrl === "string" && doc.fileUrl.trim()) ||
    (typeof doc?.pdfPath === "string" && doc.pdfPath.trim()) ||
    "";
  return url ? String(url) : null;
}

// --------------------------------------------
// Safe getters
// --------------------------------------------

export const getAllContentlayerDocs = (): any[] => allDocuments;

export const getPublishedDocuments = (): any[] => allDocuments.filter(isPublished);

export const getFeaturedDocuments = (): any[] =>
  getPublishedDocuments().filter((doc) => doc?.featured === true || doc?.featured === "true");

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
export const getPublishedShorts = (): any[] => allShorts.filter(isPublished);

export const getAllBooks = (): any[] => allBooks.filter(isPublished);
export const getAllCanons = (): any[] => allCanons.filter(isPublished);
export const getAllDownloads = (): any[] => allDownloads.filter(isPublished);
export const getAllEvents = (): any[] => allEvents.filter(isPublished);
export const getAllPrints = (): any[] => allPrints.filter(isPublished);
export const getAllResources = (): any[] => allResources.filter(isPublished);
export const getAllStrategies = (): any[] => allStrategies.filter(isPublished);

// By-slug getters
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

export const getDocByHref = (href: string): any | undefined =>
  getAllContentlayerDocs().find((d) => getDocHref(d) === href);

export const getBySlugAndKind = (slug: string, kind: DocKind): any | undefined =>
  getPublishedDocumentsByType()[kind].find((d) => normalizeSlug(d) === norm(slug));

// --------------------------------------------
// Type guards (compat)
// --------------------------------------------

export const isPost = (doc: any): boolean => getDocKind(doc) === "post";
export const isBook = (doc: any): boolean => getDocKind(doc) === "book";
export const isDownload = (doc: any): boolean => getDocKind(doc) === "download";
export const isEvent = (doc: any): boolean => getDocKind(doc) === "event";
export const isPrint = (doc: any): boolean => getDocKind(doc) === "print";
export const isResource = (doc: any): boolean => getDocKind(doc) === "resource";
export const isStrategy = (doc: any): boolean => getDocKind(doc) === "strategy";
export const isCanon = (doc: any): boolean => getDocKind(doc) === "canon";
export const isShort = (doc: any): boolean => getDocKind(doc) === "short";

// --------------------------------------------
// Cards
// --------------------------------------------

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
    date: doc?.date ?? null,
    readTime: doc?.readTime ?? doc?.readtime ?? null,

    image: resolveDocCoverImage(doc),
    tags: Array.isArray(doc?.tags) ? doc.tags : [],

    category: doc?.category ?? null,
    author: doc?.author ?? null,
    featured: doc?.featured === true,

    downloadUrl: resolveDocDownloadUrl(doc),

    coverAspect: doc?.coverAspect ?? null,
    coverFit: doc?.coverFit ?? null,
  };
}

// --------------------------------------------
// Shorts helpers used by index pages
// --------------------------------------------

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
    .filter((s) => s?.featured === true || s?.featured === "true")
    .slice()
    .sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
};
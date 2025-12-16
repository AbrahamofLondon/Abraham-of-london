/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer-helper.ts
// SINGLE SOURCE OF TRUTH for Contentlayer docs, URLs, and card props.
// Works with Contentlayer2 (.contentlayer/generated) and classic contentlayer/generated.

import path from "path";

// ============================================
// 1) Types (UI kinds are lowercase)
// ============================================

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

  // for smart cards
  coverAspect?: string | null;
  coverFit?: string | null;
}

// ============================================
// 2) Robust generated loader (Contentlayer + Contentlayer2)
// ============================================

type Generated = Record<string, any>;

function tryRequire(id: string): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(id);
  } catch {
    return null;
  }
}

function loadGenerated(): Generated {
  // 1) Sometimes works
  const a = tryRequire("contentlayer/generated");
  if (a) return a as Generated;

  // 2) Contentlayer2 common output
  const b = tryRequire(path.join(process.cwd(), ".contentlayer", "generated"));
  if (b) return b as Generated;

  // 3) Explicit file fallbacks
  const c = tryRequire(
    path.join(process.cwd(), ".contentlayer", "generated", "index.js")
  );
  if (c) return c as Generated;

  const d = tryRequire(
    path.join(process.cwd(), ".contentlayer", "generated", "index.cjs")
  );
  if (d) return d as Generated;

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[contentlayer-helper] Could not load generated exports from known locations."
    );
  }
  return {};
}

const gen = loadGenerated();

function asArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// ============================================
// 3) Collections (EXPORTS your app expects)
// ============================================

export const allPosts = asArray(gen.allPosts);
export const allBooks = asArray(gen.allBooks);
export const allDownloads = asArray(gen.allDownloads);
export const allEvents = asArray(gen.allEvents);
export const allPrints = asArray(gen.allPrints);
export const allResources = asArray(gen.allResources);
export const allStrategies = asArray(gen.allStrategies);
export const allCanons = asArray(gen.allCanons);
export const allShorts = asArray(gen.allShorts);

export const allDocuments: any[] = (() => {
  const docs = asArray(gen.allDocuments);
  if (docs.length) return docs;

  // Fallback: merge everything
  return [
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
})();

export const allContent: any[] = [...allDocuments];
export const allPublished: any[] = allDocuments.filter((d) => !isDraft(d));

// ============================================
// 4) Status helpers
// ============================================

export const isContentlayerLoaded = (): boolean => {
  // If content exists, we are loaded.
  return allDocuments.length > 0;
};

// Bulletproof draft detection (supports boolean/string)
export const isDraft = (doc: any): boolean => {
  const d = doc?.draft;
  if (d === true || d === "true") return true;
  if (d === false || d === "false" || d == null) return false;
  return false;
};

export const isPublished = (doc: any): boolean => !isDraft(doc);

// ============================================
// 5) Kind / slug / URL helpers (SINGLE SOURCE OF TRUTH)
// ============================================

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
      // Don’t lie; default to post only if unknown
      return "post";
  }
}

export function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  const s = typeof doc.slug === "string" ? doc.slug.trim() : "";
  if (s) return s.toLowerCase();

  const fp = typeof doc?._raw?.flattenedPath === "string" ? doc._raw.flattenedPath : "";
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
 * SITE ROUTES (your stated structure):
 * - Posts:      /blog/[slug]
 * - Books:      /books/[slug]
 * - Canon:      /canon/[slug]
 * - Downloads:  /downloads/[slug]
 * - Events:     /events/[slug]
 * - Prints:     /prints/[slug]
 * - Shorts:     /shorts/[slug]
 * - Resources:  /resources/[...slug]   (you have that route)
 * - Strategy:   /strategy/[slug]        (if you have it) OR /content
 * - ReadingRoom: /content/[slug]        (fallback home)
 */
export function getDocHref(doc: any): string {
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  switch (kind) {
    case "post":
      return `/blog/${slug}`; // ✅ per your instruction
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
      // your route is /resources/[...slug] but you often use single slugs
      return `/resources/${slug}`;
    case "strategy":
      // if you have /strategy/[slug] keep it
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

export const getShortUrl = (short: any): string => getDocHref(short);

// ============================================
// 6) Image / download helpers (cards “fit intelligently”)
// ============================================

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
    (typeof doc?.downloadFile === "string" && doc.downloadFile.trim()) ||
    "";

  return url ? String(url) : null;
}

// ============================================
// 7) Safe getters
// ============================================

export const getAllContentlayerDocs = (): any[] => {
  return allDocuments;
};

export const getPublishedDocuments = (): any[] => {
  return allDocuments.filter(isPublished);
};

export const getFeaturedDocuments = (): any[] => {
  return getPublishedDocuments().filter((doc) => doc?.featured === true || doc?.featured === "true");
};

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

  for (const doc of published) {
    buckets[getDocKind(doc)].push(doc);
  }

  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k].sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  });

  return buckets;
}

// Individual “getAllX” exports expected by your codebase
export const getPublishedPosts = (): any[] => asArray(allPosts).filter(isPublished);
export const getPublishedShorts = (): any[] => asArray(allShorts).filter(isPublished);

export const getAllBooks = (): any[] => asArray(allBooks).filter(isPublished);
export const getAllCanons = (): any[] => asArray(allCanons).filter(isPublished);
export const getAllDownloads = (): any[] => asArray(allDownloads).filter(isPublished);
export const getAllEvents = (): any[] => asArray(allEvents).filter(isPublished);
export const getAllPrints = (): any[] => asArray(allPrints).filter(isPublished);
export const getAllResources = (): any[] => asArray(allResources).filter(isPublished);
export const getAllStrategies = (): any[] => asArray(allStrategies).filter(isPublished);

// By-slug getters
export const getPostBySlug = (slug: string): any | undefined =>
  getPublishedPosts().find((d) => normalizeSlug(d) === String(slug).trim().toLowerCase());

export const getShortBySlug = (slug: string): any | undefined =>
  getPublishedShorts().find((d) => normalizeSlug(d) === String(slug).trim().toLowerCase());

export const getBookBySlug = (slug: string): any | undefined =>
  getAllBooks().find((d) => normalizeSlug(d) === String(slug).trim().toLowerCase());

export const getCanonBySlug = (slug: string): any | undefined =>
  getAllCanons().find((d) => normalizeSlug(d) === String(slug).trim().toLowerCase());

export const getDocumentBySlug = (slug: string): any | undefined =>
  getAllContentlayerDocs().find((d) => normalizeSlug(d) === String(slug).trim().toLowerCase());

// Doc-by-href (useful for debugging)
export const getDocByHref = (href: string): any | undefined =>
  getAllContentlayerDocs().find((d) => getDocHref(d) === href);

// Convenience
export const getBySlugAndKind = (slug: string, kind: DocKind): any | undefined =>
  getPublishedDocumentsByType()[kind].find((d) => normalizeSlug(d) === String(slug).trim().toLowerCase());

// ============================================
// 8) Type guards (for compatibility)
// ============================================

export const isPost = (doc: any): boolean => getDocKind(doc) === "post";
export const isBook = (doc: any): boolean => getDocKind(doc) === "book";
export const isDownload = (doc: any): boolean => getDocKind(doc) === "download";
export const isEvent = (doc: any): boolean => getDocKind(doc) === "event";
export const isPrint = (doc: any): boolean => getDocKind(doc) === "print";
export const isResource = (doc: any): boolean => getDocKind(doc) === "resource";
export const isStrategy = (doc: any): boolean => getDocKind(doc) === "strategy";
export const isCanon = (doc: any): boolean => getDocKind(doc) === "canon";
export const isShort = (doc: any): boolean => getDocKind(doc) === "short";

// ============================================
// 9) Cards
// ============================================

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

    // Pass-through for intelligent card sizing
    coverAspect: doc?.coverAspect ?? null,
    coverFit: doc?.coverFit ?? null,
  };
}

// ============================================
// 10) Shorts helpers used by index pages
// ============================================

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
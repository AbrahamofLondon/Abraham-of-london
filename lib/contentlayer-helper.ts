/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer-helper.ts
// SINGLE SOURCE OF TRUTH for Contentlayer docs, URLs, and card props.
// ✅ ESM-safe
// ✅ Next-safe
// ✅ Contentlayer2-safe
// ✅ Backwards-compatible exports for lib/imports.ts + legacy pages
// ✅ getPublishedDocumentsByType is a FUNCTION (type, limit?) to satisfy /content prerender

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

// If your generated types exist, you can use them.
// If not, this falls back safely to any.
export type DocumentTypes = (typeof generated extends any
  ? any
  : any);

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

function isNonEmptyString(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
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

// --------------------------------------------
// SHORTS COVER POLICY (theme → cover)
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

// ---- Legacy aliases some codebases use
export const allEssays = allPosts; // IMPORTANT: essays == posts in your site
export const allCanon = allCanons; // common accidental singular alias

// --------------------------------------------
// Status helpers
// --------------------------------------------

export const isDraft = (doc: any): boolean => toBool(doc?.draft);
export const isPublished = (doc: any): boolean => !isDraft(doc);

// --------------------------------------------
// Doc kind / slug / URL helpers
// --------------------------------------------

export function getDocKind(doc: any): DocKind {
  const t = String(doc?.type ?? doc?._type ?? doc?._raw?.sourceFileDir ?? "").trim();

  // Prefer explicit contentlayer _type/type where available
  const explicit = String(doc?.type ?? doc?._type ?? "").trim();
  switch (explicit) {
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
  }

  // Fallback: infer from source folder
  const dir = t.toLowerCase();
  if (dir.includes("blog") || dir.includes("post") || dir.includes("essays")) return "post";
  if (dir.includes("books")) return "book";
  if (dir.includes("downloads")) return "download";
  if (dir.includes("events")) return "event";
  if (dir.includes("prints")) return "print";
  if (dir.includes("resources")) return "resource";
  if (dir.includes("strategy")) return "strategy";
  if (dir.includes("canon")) return "canon";
  if (dir.includes("shorts")) return "short";

  return "unknown";
}

export function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  if (isNonEmptyString(doc.slug)) return doc.slug.trim().toLowerCase();

  const fp = isNonEmptyString(doc?._raw?.flattenedPath) ? String(doc._raw.flattenedPath) : "";
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
 * ✅ First choice: doc.url (computedFields in contentlayer config)
 * ✅ Second: doc.href (manual override)
 * ✅ Third: reconstruction fallback (by kind)
 */
export function getDocHref(doc: any): string {
  if (isNonEmptyString(doc?.url)) return toCleanPath(doc.url);
  if (isNonEmptyString(doc?.href)) return toCleanPath(doc.href);

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
      return `/resources/${slug}`;
    case "strategy":
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

// Legacy URL helpers (expected by older code)
export const getEssayUrl = (docOrSlug: any): string =>
  typeof docOrSlug === "string" ? `/blog/${docOrSlug}` : getDocHref(docOrSlug);

export const getShortUrl = (docOrSlug: any): string =>
  typeof docOrSlug === "string" ? `/shorts/${docOrSlug}` : getDocHref(docOrSlug);

// --------------------------------------------
// Image / download helpers
// --------------------------------------------

export function resolveDocCoverImage(doc: any): string {
  // Explicit cover wins
  if (isNonEmptyString(doc?.coverImage)) return doc.coverImage.trim();
  if (isNonEmptyString(doc?.image)) return doc.image.trim();

  // Shorts: theme-driven
  if (getDocKind(doc) === "short") {
    const theme = String(doc?.theme ?? "").trim().toLowerCase();
    return SHORT_THEME_COVERS[theme] ?? SHORTS_GLOBAL_FALLBACK;
  }

  // Default fallback
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
// SAFE getters (call-time computed)
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

export const getAllDocuments = getAllContentlayerDocs; // legacy alias

export const getPublishedDocuments = (): any[] => getAllContentlayerDocs().filter(isPublished);

// Legacy names some files use
export const allDocuments = getAllContentlayerDocs;
export const allContent = getAllContentlayerDocs;
export const allPublished = getPublishedDocuments;

export const isContentlayerLoaded = (): boolean => getAllContentlayerDocs().length > 0;

export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) {
    throw new Error(
      `[Contentlayer] 0 documents at "${where}". Contentlayer2 likely produced nothing before Next build.`
    );
  }
}

// --------------------------------------------
// ✅ CRITICAL FIX: getPublishedDocumentsByType is a FUNCTION
// --------------------------------------------

type GeneratedTypeName =
  | "Post"
  | "Book"
  | "Download"
  | "Event"
  | "Print"
  | "Resource"
  | "Strategy"
  | "Canon"
  | "Short"
  | string;

function toGeneratedTypeName(kind: DocKind): GeneratedTypeName {
  switch (kind) {
    case "post":
      return "Post";
    case "book":
      return "Book";
    case "download":
      return "Download";
    case "event":
      return "Event";
    case "print":
      return "Print";
    case "resource":
      return "Resource";
    case "strategy":
      return "Strategy";
    case "canon":
      return "Canon";
    case "short":
      return "Short";
    default:
      return "Unknown";
  }
}

/**
 * Function signature required by /content + /debug/content:
 * getPublishedDocumentsByType(type, limit?)
 *
 * Accepts:
 * - DocKind ("post", "canon", etc)
 * - Generated _type ("Post", "Canon", etc)
 */
export function getPublishedDocumentsByType(type: DocKind | GeneratedTypeName, limit?: number): any[] {
  const wanted =
    typeof type === "string" && type.length > 0
      ? (type as string)
      : "Unknown";

  const wantedKinds = new Set<DocKind>();
  const lower = wanted.toLowerCase();

  // map doc kinds
  if (
    ["post","book","download","event","print","resource","strategy","canon","short","unknown"].includes(lower)
  ) {
    wantedKinds.add(lower as DocKind);
  } else {
    // map generated _type names
    switch (wanted) {
      case "Post":
        wantedKinds.add("post");
        break;
      case "Book":
        wantedKinds.add("book");
        break;
      case "Download":
        wantedKinds.add("download");
        break;
      case "Event":
        wantedKinds.add("event");
        break;
      case "Print":
        wantedKinds.add("print");
        break;
      case "Resource":
        wantedKinds.add("resource");
        break;
      case "Strategy":
        wantedKinds.add("strategy");
        break;
      case "Canon":
        wantedKinds.add("canon");
        break;
      case "Short":
        wantedKinds.add("short");
        break;
      default:
        wantedKinds.add("unknown");
        break;
    }
  }

  const items = getPublishedDocuments()
    .filter((d) => wantedKinds.has(getDocKind(d)))
    .slice()
    .sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

// If you still want the “bucket map” behavior, keep it under a different name:
export function getPublishedDocumentsByTypeMap(): Record<DocKind, any[]> {
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

  for (const doc of getPublishedDocuments()) buckets[getDocKind(doc)].push(doc);

  for (const k of Object.keys(buckets) as DocKind[]) {
    buckets[k].sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  }

  return buckets;
}

// --------------------------------------------
// Document-type getters (used across your pages)
// --------------------------------------------

export const getPublishedPosts = (): any[] => getPublishedDocumentsByType("post");
export const getPublishedShorts = (): any[] => getPublishedDocumentsByType("short");

export const getAllBooks = (): any[] => getPublishedDocumentsByType("book");
export const getAllCanons = (): any[] => getPublishedDocumentsByType("canon");
export const getAllDownloads = (): any[] => getPublishedDocumentsByType("download");
export const getAllEvents = (): any[] => getPublishedDocumentsByType("event");
export const getAllPrints = (): any[] => getPublishedDocumentsByType("print");
export const getAllResources = (): any[] => getPublishedDocumentsByType("resource");
export const getAllStrategies = (): any[] => getPublishedDocumentsByType("strategy");

// Legacy alias your Events page already uses
export { getAllEvents as getEvents };

// --------------------------------------------
// By-slug getters
// --------------------------------------------

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

// --------------------------------------------
// Type guards (compat)
// --------------------------------------------

export const isPost = (doc: any): boolean => getDocKind(doc) === "post";
export const isEssay = isPost; // legacy alias
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

// --------------------------------------------
// Shorts helpers
// --------------------------------------------

export const getRecentShorts = (limit: number = 5): any[] =>
  getPublishedDocumentsByType("short", limit);

export const getFeaturedShorts = (limit: number = 5): any[] =>
  getPublishedDocuments()
    .filter((d) => getDocKind(d) === "short" && toBool(d?.featured))
    .slice()
    .sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);

// =============================================================================
// COMPATIBILITY LAYER (required by lib/imports.ts + legacy pages)
// Do NOT delete unless you update lib/imports.ts and all pages accordingly.
// =============================================================================

// ---- Type aliases expected by lib/imports.ts
export type AnyDoc = any;
export type ContentlayerDocument = any;

export type PostDocument = any;
export type ShortDocument = any;
export type BookDocument = any;
export type DownloadDocument = any;
export type EventDocument = any;
export type PrintDocument = any;
export type ResourceDocument = any;
export type StrategyDocument = any;

// ---- Function aliases expected by lib/imports.ts

/**
 * getDocumentsByType(type, limit?)  (legacy name)
 * Uses getPublishedDocumentsByType under the hood.
 */
export function getDocumentsByType(type: any, limit?: number): any[] {
  return getPublishedDocumentsByType(type, limit);
}

/**
 * getBySlugAndKind(slug, kind) (legacy)
 * Uses normalizeSlug + getDocKind over published docs.
 */
export function getBySlugAndKind(slug: string, kind: any): any | undefined {
  const s = String(slug ?? "").trim().toLowerCase();
  const k = String(kind ?? "").trim().toLowerCase();

  return getPublishedDocuments().find((d) => {
    return normalizeSlug(d) === s && String(getDocKind(d)).toLowerCase() === k;
  });
}
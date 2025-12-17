/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer-helper.ts
// SINGLE SOURCE OF TRUTH for Contentlayer docs, URLs, and card props.
// ✅ Fixed: Trailing slash normalization to prevent 404s
// ✅ Fixed: Slug consistency between file-path and frontmatter

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

export type DocumentTypes = (typeof generated extends any ? any : any);

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
  const withLeading = v.startsWith("/") ? v : `/${v}`;
  // For comparison logic, we keep it consistent.
  return withLeading;
}

// --------------------------------------------
// SHORTS COVER POLICY
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
// Collections
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

export const allEssays = allPosts; 
export const allCanon = allCanons;

// --------------------------------------------
// Status helpers
// --------------------------------------------

export const isDraft = (doc: any): boolean => toBool(doc?.draft);
export const isPublished = (doc: any): boolean => !isDraft(doc);

// --------------------------------------------
// Doc kind / slug / URL helpers
// --------------------------------------------

export function getDocKind(doc: any): DocKind {
  const explicit = String(doc?.type ?? doc?._type ?? "").trim();
  switch (explicit) {
    case "Post": return "post";
    case "Book": return "book";
    case "Download": return "download";
    case "Event": return "event";
    case "Print": return "print";
    case "Resource": return "resource";
    case "Strategy": return "strategy";
    case "Canon": return "canon";
    case "Short": return "short";
  }

  const t = String(doc?._raw?.sourceFileDir ?? "").toLowerCase();
  if (t.includes("blog") || t.includes("post") || t.includes("essays")) return "post";
  if (t.includes("books")) return "book";
  if (t.includes("downloads")) return "download";
  if (t.includes("events")) return "event";
  if (t.includes("prints")) return "print";
  if (t.includes("resources")) return "resource";
  if (t.includes("strategy")) return "strategy";
  if (t.includes("canon")) return "canon";
  if (t.includes("shorts")) return "short";

  return "unknown";
}

/**
 * Normalizes slug by stripping directory prefixes and trailing slashes.
 * Crucial for matching [slug].tsx params.
 */
export function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  // 1. Check explicit slug field
  if (isNonEmptyString(doc.slug)) {
    return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  }

  // 2. Use flattenedPath (best for auto-routing)
  const fp = isNonEmptyString(doc?._raw?.flattenedPath) ? String(doc._raw.flattenedPath) : "";
  if (fp) {
    const cleaned = fp
      .replace(/^(content\/)?(blog|books|downloads|events|prints|resources|strategy|canon|shorts)\//, "")
      .replace(/\/index$/, "")
      .replace(/\/$/, "");

    if (cleaned) return cleaned.trim().toLowerCase();
  }

  // 3. Fallback to title as kebab-case
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

export function getDocHref(doc: any): string {
  if (isNonEmptyString(doc?.url)) return toCleanPath(doc.url);
  if (isNonEmptyString(doc?.href)) return toCleanPath(doc.href);

  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  // Note: These paths should match your folder structure in /pages
  switch (kind) {
    case "post": return `/blog/${slug}`;
    case "book": return `/books/${slug}`;
    case "canon": return `/canon/${slug}`;
    case "download": return `/downloads/${slug}`;
    case "event": return `/events/${slug}`;
    case "print": return `/prints/${slug}`;
    case "short": return `/shorts/${slug}`;
    case "resource": return `/resources/${slug}`;
    case "strategy": return `/strategy/${slug}`;
    default: return `/content/${slug}`;
  }
}

export const getEssayUrl = (docOrSlug: any): string =>
  typeof docOrSlug === "string" ? `/blog/${docOrSlug}` : getDocHref(docOrSlug);

// --------------------------------------------
// Image / download helpers
// --------------------------------------------

export function resolveDocCoverImage(doc: any): string {
  if (isNonEmptyString(doc?.coverImage)) return doc.coverImage.trim();
  if (isNonEmptyString(doc?.image)) return doc.image.trim();

  if (getDocKind(doc) === "short") {
    const theme = String(doc?.theme ?? "").trim().toLowerCase();
    return SHORT_THEME_COVERS[theme] ?? SHORTS_GLOBAL_FALLBACK;
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
// SAFE getters
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

export function getPublishedDocumentsByType(type: DocKind | string, limit?: number): any[] {
  const lowerType = type.toLowerCase();
  
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === lowerType || d.type?.toLowerCase() === lowerType)
    .sort((a, b) => {
      const da = a?.date ? new Date(a.date).getTime() : 0;
      const db = b?.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

// --------------------------------------------
// Document-type specific getters
// --------------------------------------------

export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getEvents = getAllEvents;

// --------------------------------------------
// By-slug getters
// --------------------------------------------

const norm = (s: string) => String(s ?? "").trim().toLowerCase().replace(/\/$/, "");

export const getPostBySlug = (slug: string) =>
  getPublishedPosts().find((d) => normalizeSlug(d) === norm(slug));

export const getCanonBySlug = (slug: string) =>
  getAllCanons().find((d) => normalizeSlug(d) === norm(slug));

export const getDocByHref = (href: string): any | undefined => {
  const h = norm(href);
  return getAllContentlayerDocs().find((d) => norm(getDocHref(d)) === h);
};

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
    date: safeDateValue(doc?.date),
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
// Compatibility Exports
// --------------------------------------------
export const allDocuments = getAllContentlayerDocs;
export const allPublished = getPublishedDocuments;
export function getDocumentsByType(type: any, limit?: number) {
  return getPublishedDocumentsByType(type, limit);
}
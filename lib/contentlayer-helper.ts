/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/contentlayer-helper.ts
 * * THE CORE ENGINE for Contentlayer document handling.
 * - Centralized logic for slug normalization, URL generation, and status checking.
 * - Robust error handling to prevent build-time crashes.
 * - Unified getter functions for all 9 content types.
 */

import * as generated from "contentlayer/generated";

// --- Types ---

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

// --- Internal Configuration & Maps ---

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

const SHORTS_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";
const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";

const SHORT_THEME_COVERS: Record<string, string> = {
  "inner-life": "/assets/images/shorts/inner-life.jpg",
  "outer-life": "/assets/images/shorts/outer-life.jpg",
  "hard-truths": "/assets/images/shorts/hard-truths.jpg",
  gentle: "/assets/images/shorts/gentle.jpg",
  purpose: "/assets/images/shorts/purpose.jpg",
  relationships: "/assets/images/shorts/relationships.jpg",
  faith: "/assets/images/shorts/faith.jpg",
};

// --- Array Safe-Extractors ---

function pickArray(name: string): any[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

// Collections (Exporting raw arrays for direct use)
export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

// Alias support
export const allEssays = allPosts;
export const allCanon = allCanons;

// --- Logic & Normalization ---

export const isDraft = (doc: any): boolean => {
  if (!doc) return true;
  const draft = doc.draft;
  if (typeof draft === "boolean") return draft;
  if (typeof draft === "string") return draft.trim().toLowerCase() === "true";
  return false;
};

export const isPublished = (doc: any): boolean => !isDraft(doc);

/**
 * Determines document kind with fallback logic.
 */
export function getDocKind(doc: any): DocKind {
  if (!doc) return "unknown";
  
  // 1. Check explicit Contentlayer type
  const type = (doc.type || doc._type || "").toLowerCase();
  if (KIND_URL_MAP[type as DocKind]) return type as DocKind;

  // 2. Fallback: Check source directory
  const dir = (doc._raw?.sourceFileDir || "").toLowerCase();
  if (dir.includes("blog") || dir.includes("post")) return "post";
  if (dir.includes("strategy")) return "strategy";
  if (dir.includes("canon")) return "canon";
  
  // Try to match directory name to Map
  const match = Object.keys(KIND_URL_MAP).find((k) => dir.includes(k));
  return (match as DocKind) || "unknown";
}

/**
 * Unified Slug Generator.
 * Strips folder prefixes, handles "index" files, and cleans strings.
 */
export function normalizeSlug(doc: any): string {
  if (!doc) return "";

  // 1. Manual slug override in frontmatter
  if (doc.slug && typeof doc.slug === "string") {
    return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  }

  // 2. Derived from file path
  const fp = doc._raw?.flattenedPath || "";
  if (fp) {
    const parts = fp.split("/");
    const last = parts[parts.length - 1];
    const slug = last === "index" ? parts[parts.length - 2] : last;
    if (slug) return slug.toLowerCase();
  }

  // 3. Last resort: Kebab-case the title
  return (doc.title || "untitled")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

/**
 * Universal URL Resolver.
 * Connects normalization logic to the KIND_URL_MAP.
 */
export function getDocHref(doc: any): string {
  if (!doc) return "/";
  if (doc.url && typeof doc.url === "string") return doc.url.startsWith("/") ? doc.url : `/${doc.url}`;
  if (doc.href && typeof doc.href === "string") return doc.href.startsWith("/") ? doc.href : `/${doc.href}`;

  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  const base = KIND_URL_MAP[kind] || "/content";

  return `${base}/${slug}`;
}

// --- Image & Metadata Helpers ---

export function resolveDocCoverImage(doc: any): string {
  if (!doc) return GLOBAL_FALLBACK_IMAGE;
  const explicit = doc.coverImage || doc.image;
  if (explicit && typeof explicit === "string") return explicit.trim();

  if (getDocKind(doc) === "short") {
    const theme = (doc.theme || "").trim().toLowerCase();
    return SHORT_THEME_COVERS[theme] || SHORTS_GLOBAL_FALLBACK;
  }
  
  return GLOBAL_FALLBACK_IMAGE;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  const val = doc.downloadUrl || doc.fileUrl || doc.pdfPath || doc.file;
  return (typeof val === "string" && val.trim()) ? val.trim() : null;
}

// --- Getter Engine ---

export const getAllContentlayerDocs = (): any[] => {
  return [
    ...allPosts, ...allBooks, ...allDownloads, ...allEvents, 
    ...allPrints, ...allResources, ...allStrategies, 
    ...allCanons, ...allShorts
  ].filter(Boolean);
};

export const getPublishedDocuments = () => getAllContentlayerDocs().filter(isPublished);

/**
 * The Robust Fetcher.
 * Filter by kind, sort by date (newest first), and apply limit.
 */
export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

  return limit ? items.slice(0, limit) : items;
}

// --- Production Named Getters ---

export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");
export const getAllPrints = () => getPublishedDocumentsByType("print");

// --- By-Slug Search Engine ---

const cleanMatch = (s: string) => (s || "").trim().toLowerCase().replace(/\/$/, "");

export const getPostBySlug = (s: string) => getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getCanonBySlug = (s: string) => getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getStrategyBySlug = (s: string) => getAllStrategies().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getResourceBySlug = (s: string) => getAllResources().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getBookBySlug = (s: string) => getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getShortBySlug = (s: string) => getPublishedShorts().find((d) => normalizeSlug(d) === cleanMatch(s));

export const getDocByHref = (href: string) => {
  const target = cleanMatch(href);
  return getAllContentlayerDocs().find((d) => cleanMatch(getDocHref(d)) === target);
};

// --- UI Utilities ---

export function getCardPropsForDocument(doc: any): ContentlayerCardProps {
  return {
    type: getDocKind(doc),
    slug: normalizeSlug(doc),
    title: doc.title || "Untitled",
    href: getDocHref(doc),
    description: doc.description || doc.summary || null,
    excerpt: doc.excerpt || null,
    subtitle: doc.subtitle || null,
    date: doc.date ? String(doc.date) : null,
    readTime: doc.readTime || doc.readtime || null,
    image: resolveDocCoverImage(doc),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    category: doc.category || null,
    author: doc.author || null,
    featured: !!doc.featured,
    downloadUrl: resolveDocDownloadUrl(doc),
    coverAspect: doc.coverAspect || null,
    coverFit: doc.coverFit || null,
  };
}

// --- Build Safety Checks ---

export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) {
    throw new Error(`[Contentlayer Build Error] 0 documents found in "${where}". Ensure Contentlayer generation ran successfully.`);
  }
}

// --- Legacy & Global Compatibility ---
export const allDocuments = getAllContentlayerDocs;
export const allPublished = getPublishedDocuments;
export const getEvents = getAllEvents;

export function getDocumentsByType(type: any, limit?: number) {
  const kind = (typeof type === "string" ? type.toLowerCase() : "") as DocKind;
  return getPublishedDocumentsByType(kind, limit);
}
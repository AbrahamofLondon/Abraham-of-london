/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/contentlayer-helper.ts
 * THE CORE ENGINE for Contentlayer document handling.
 * - Resilient Named Exports for Next.js Prerendering.
 * - Robust error handling for slug matching and date sorting.
 */

import * as generated from "contentlayer/generated";

// --- Types ---

export type DocKind =
  | "post" | "book" | "download" | "event" | "print" 
  | "resource" | "strategy" | "canon" | "short" | "unknown";

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

// --- Maps ---

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

// --- Collection Safe-Extractors ---

function pickArray(name: string): any[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

export const allEssays = allPosts;
export const allCanon = allCanons;

// --- Logic & Normalization ---

export const isDraft = (doc: any): boolean => {
  if (!doc) return true;
  return doc.draft === true || String(doc.draft).toLowerCase() === "true";
};

export const isPublished = (doc: any): boolean => !isDraft(doc);

export function getDocKind(doc: any): DocKind {
  if (!doc) return "unknown";
  const type = (doc.type || doc._type || "").toLowerCase();
  if (KIND_URL_MAP[type as DocKind]) return type as DocKind;
  const dir = (doc._raw?.sourceFileDir || "").toLowerCase();
  const match = Object.keys(KIND_URL_MAP).find((k) => dir.includes(k));
  return (match as DocKind) || "unknown";
}

export function normalizeSlug(doc: any): string {
  if (!doc) return "";
  if (doc.slug && typeof doc.slug === "string") {
    return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  }
  const fp = doc._raw?.flattenedPath || "";
  const parts = fp.split("/");
  const last = parts[parts.length - 1];
  return (last === "index" ? parts[parts.length - 2] : last) || "untitled";
}

export function getDocHref(doc: any): string {
  if (!doc) return "/";
  if (doc.url && typeof doc.url === "string") return doc.url;
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  return `${KIND_URL_MAP[kind]}/${slug}`;
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

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return limit ? items.slice(0, limit) : items;
}

// --- Resilient Named Exports (Fixes Build Errors) ---

export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getAllPrints = () => getPublishedDocumentsByType("print");

/** Fixes build error: getRecentShorts */
export const getRecentShorts = (limit = 3) => getPublishedDocumentsByType("short", limit);

/** Fixes build error: getShortUrl */
export const getShortUrl = (short: any) => `/shorts/${normalizeSlug(short)}`;

// --- By-Slug Search Engine ---

const cleanMatch = (s: string) => (s || "").trim().toLowerCase().replace(/\/$/, "");

export const getPostBySlug = (s: string) => getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getCanonBySlug = (s: string) => getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getStrategyBySlug = (s: string) => getAllStrategies().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getResourceBySlug = (s: string) => getAllResources().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getBookBySlug = (s: string) => getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s));
export const getShortBySlug = (s: string) => getPublishedDocumentsByType("short").find((d) => normalizeSlug(d) === cleanMatch(s));

/** Fixes build error: getPrintBySlug */
export const getPrintBySlug = (s: string) => getAllPrints().find((d) => normalizeSlug(d) === cleanMatch(s));

// --- Safety & Utility ---

export function assertContentlayerHasDocs(where: string) {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(`[Contentlayer] 0 documents found in ${where}. Check CI configuration.`);
  }
}

export function getCardPropsForDocument(doc: any): ContentlayerCardProps {
  return {
    type: getDocKind(doc),
    slug: normalizeSlug(doc),
    title: doc.title || "Untitled",
    href: getDocHref(doc),
    description: doc.description || doc.excerpt || null,
    date: doc.date ? String(doc.date) : null,
    image: doc.coverImage || doc.image || GLOBAL_FALLBACK_IMAGE,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    featured: !!doc.featured,
  };
}
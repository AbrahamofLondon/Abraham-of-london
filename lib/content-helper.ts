/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CONTENT HELPER (single-source, zero duplicate exports)
 * - Re-exports REAL ContentLayer data access
 * - Re-exports client-safe utilities
 * - Provides stable aliases your codebase expects
 * - Provides ONE default export: ContentHelper
 */

// ===================== REAL DATA ACCESS (ContentLayer) =====================
import {
  getAllDocuments,
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPublishedCanons,
  getPublishedShorts,
  coerceShortTheme,
} from "./contentlayer/data";

// ===================== CLIENT-SAFE UTILITIES =====================
import {
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
  // aliases requested by older code
  getDocHref as getDocumentHref,
  getDocKind as getDocumentKind,
} from "./content/shared";

// ===================== TYPES (flexible / non-breaking) =====================
export type ContentDoc = any;
export type DocKind = string;

type Post = any;
type Book = any;
type Download = any;
type Event = any;
type Print = any;
type Resource = any;
type Strategy = any;
type Canon = any;
type Short = any;

export type { Post, Book, Download, Event, Print, Resource, Strategy, Canon, Short };

// ===================== SMALL UI HELPERS (safe everywhere) =====================
export function formatDocumentDate(dateString?: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(date);
  } catch {
    return String(dateString);
  }
}

export function getReadingTime(content?: string): number {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getExcerpt(content: string, maxLength: number = 160): string {
  if (!content) return "";

  const plain = content
    .replace(/[#*`\[\]]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).trim() + "…";
}

export function createDocumentUrl(slug: string, type?: string): string {
  const normalized = normalizeSlug(slug);
  if (!normalized) return "/";

  switch (type) {
    case "book":
      return `/books/${normalized}`;
    case "canon":
      return `/canon/${normalized}`;
    case "download":
      return `/downloads/${normalized}`;
    case "post":
      return `/blog/${normalized}`;
    case "print":
      return `/prints/${normalized}`;
    case "resource":
      return `/resources/${normalized}`;
    case "strategy":
      return `/strategy/${normalized}`;
    case "event":
      return `/events/${normalized}`;
    case "short":
      return `/shorts/${normalized}`;
    default:
      return `/${normalized}`;
  }
}

// ===================== CANONICAL EXPORTS (one time) =====================
// Client-safe utilities
export {
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
  getDocumentHref,
  getDocumentKind,
};

// Real contentlayer functions
export {
  getAllDocuments,
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPublishedCanons,
  getPublishedShorts,
  coerceShortTheme,
};

// ===================== ALIASES (back-compat) =====================
// Old code expects these names:
export const getDocBySlug = getDocumentBySlug;
export const getPostBySlugWithContent = getPostBySlug;

// Collections (consistent names used across the project)
export const getAllPosts = getPublishedPosts;
export const getAllBooks = getPublishedBooks;
export const getAllDownloads = getPublishedDownloads;
export const getAllEvents = getPublishedEvents;
export const getAllPrints = getPublishedPrints;
export const getAllResources = getPublishedResources;
export const getAllStrategies = getPublishedStrategies;
export const getAllCanons = getPublishedCanons;
export const getAllShorts = getPublishedShorts;

// Server selector bridges (keep the names stable)
export const getServerAllBooks = getPublishedBooks;
export const getServerAllCanons = getPublishedCanons;

export function getServerBookBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return getPublishedBooks().find((b: any) => normalizeSlug(b?.slug || b?.slugAsParams || "") === s) || null;
}

export function getServerCanonBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return getPublishedCanons().find((c: any) => normalizeSlug(c?.slug || c?.slugAsParams || "") === s) || null;
}

// Misc “future buckets” (safe stubs)
export const getAllArticles = (): any[] => [];
export const getAllGuides = (): any[] => [];
export const getAllTutorials = (): any[] => [];
export const getAllCaseStudies = (): any[] => [];
export const getAllWhitepapers = (): any[] => [];
export const getAllReports = (): any[] => [];
export const getAllNewsletters = (): any[] => [];
export const getAllSermons = (): any[] => [];
export const getAllDevotionals = (): any[] => [];
export const getAllPrayers = (): any[] => [];
export const getAllTestimonies = (): any[] => [];
export const getAllPodcasts = (): any[] => [];
export const getAllVideos = (): any[] => [];
export const getAllCourses = (): any[] => [];
export const getAllLessons = (): any[] => [];

// Old name your SEO/content tooling expects
export const getAllContentlayerDocs = getAllDocuments;

// ===================== SINGLE DEFAULT EXPORT (no duplicates) =====================
export const ContentHelper = {
  // utilities
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
  getDocumentHref,
  getDocumentKind,

  // ui helpers
  formatDocumentDate,
  getReadingTime,
  getExcerpt,
  createDocumentUrl,

  // contentlayer access
  getAllDocuments,
  getDocumentBySlug,
  getDocBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,

  // published collections
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPublishedCanons,
  getPublishedShorts,

  // canonical “getAllX” names
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  getAllCanons,
  getAllShorts,

  // themes / coercions
  coerceShortTheme,

  // bridges
  getServerAllBooks,
  getServerAllCanons,
  getServerBookBySlug,
  getServerCanonBySlug,

  // misc
  getAllContentlayerDocs,
} as const;

export default ContentHelper;
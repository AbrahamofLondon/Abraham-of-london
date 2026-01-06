/* lib/contentlayer-helper.ts - CANONICAL, SINGLE SOURCE OF TRUTH (NAMED EXPORTS ONLY) */

import type { DocumentTypes } from "contentlayer/generated";
import {
  allDocuments as rawAllDocuments,
  allPosts as rawAllPosts,
  allBooks as rawAllBooks,
  allDownloads as rawAllDownloads,
  allEvents as rawAllEvents,
  allShorts as rawAllShorts,
  allCanons as rawAllCanons,
  allResources as rawAllResources,
  allPrints as rawAllPrints,
  allStrategies as rawAllStrategies,
} from "contentlayer/generated";

export { assertContentlayerHasDocs, isContentlayerLoaded } from "./contentlayer-guards";

/** Broad doc type used across legacy pages/components */
export type ContentDoc = DocumentTypes & {
  slug?: string;
  draft?: boolean;
  date?: string | null;
  tier?: string | null;
  accessLevel?: string | null;
  coverImage?: string | null;
  downloadUrl?: string | null;
  fileUrl?: string | null;
  _raw?: any;
  type?: string;
  _type?: string;
};

export type DocKind =
  | "post"
  | "book"
  | "download"
  | "event"
  | "short"
  | "canon"
  | "resource"
  | "print"
  | "strategy"
  | "document"
  | string;

/** Hard guarantees for legacy imports (keep until you implement real logic) */
export const assertPublicAssetsForDownloadsAndResources = () => true;
export const recordContentView = () => true;

// -------------------------
// Slug + sorting utilities
// -------------------------
export const normalizeSlug = (input: any) =>
  (input ?? "")
    .toString()
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const safeDateMs = (v: any) => {
  const t = new Date(v ?? "").getTime();
  return Number.isFinite(t) ? t : 0;
};

const byDateDesc = (a: any, b: any) => safeDateMs(b?.date) - safeDateMs(a?.date);

export const isDraftContent = (doc: any) => !!doc?.draft;
export const isDraft = isDraftContent;

export const sanitizeData = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return null as any;
  return JSON.parse(JSON.stringify(obj, (_, value) => (value === undefined ? null : value)));
};

// -------------------------
// Simple accessors
// -------------------------
export const getAccessLevel = (doc: any) => doc?.accessLevel || doc?.tier || "public";

export const resolveDocCoverImage = (doc: any) => doc?.coverImage || "/assets/images/placeholder.jpg";

export const resolveDocDownloadUrl = (doc: any) => doc?.downloadUrl || doc?.fileUrl || "";
export const resolveDocDownloadHref = resolveDocDownloadUrl;

export const getDownloadSizeLabel = (sizeInBytes: number): string => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) return "—";
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

// -------------------------
// Internal helpers
// -------------------------
const docSlugOf = (d: any) =>
  normalizeSlug(
    d?.slug ||
      d?._raw?.flattenedPath ||
      d?._raw?.sourceFileName?.replace(/\.mdx?$/, "") ||
      ""
  );

/**
 * Prefer folder-derived kind (stable in contentlayer2):
 * blog/*, books/*, canon/*, downloads/*, events/*, prints/*, resources/*, shorts/*, strategy/*
 */
export const getDocKind = (doc: any): DocKind => {
  const fp = String(doc?._raw?.flattenedPath ?? "");
  if (fp.startsWith("blog/")) return "post";
  if (fp.startsWith("books/")) return "book";
  if (fp.startsWith("canon/")) return "canon";
  if (fp.startsWith("downloads/")) return "download";
  if (fp.startsWith("events/")) return "event";
  if (fp.startsWith("prints/")) return "print";
  if (fp.startsWith("resources/")) return "resource";
  if (fp.startsWith("shorts/")) return "short";
  if (fp.startsWith("strategy/")) return "strategy";

  // fallback (legacy)
  return (doc?.type || doc?._type || "document") as DocKind;
};

export const getDocHref = (doc: any) => {
  const slug = docSlugOf(doc);
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
    case "short":
      return `/shorts/${slug}`;
    case "print":
      return `/prints/${slug}`;
    case "strategy":
      return `/strategy/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    default:
      return `/content/${slug}`;
  }
};

export const toUiDoc = (doc: any) => ({
  ...doc,
  slug: docSlugOf(doc),
  href: getDocHref(doc),
  kind: getDocKind(doc),
  coverImage: resolveDocCoverImage(doc),
  accessLevel: getAccessLevel(doc),
});

// -------------------------
// Collection getters (raw -> filtered)
// -------------------------
const filterPublished = (docs: any[]) => (Array.isArray(docs) ? docs : []).filter((d) => d && !d.draft);

export const getAllDocuments = (): ContentDoc[] => filterPublished(rawAllDocuments as any[]) as ContentDoc[];
export const getAllPosts = (): ContentDoc[] => filterPublished(rawAllPosts as any[]) as ContentDoc[];
export const getAllBooks = (): ContentDoc[] => filterPublished(rawAllBooks as any[]) as ContentDoc[];
export const getAllDownloads = (): ContentDoc[] => filterPublished(rawAllDownloads as any[]) as ContentDoc[];
export const getAllEvents = (): ContentDoc[] => filterPublished(rawAllEvents as any[]) as ContentDoc[];
export const getAllShorts = (): ContentDoc[] => filterPublished(rawAllShorts as any[]) as ContentDoc[];
export const getAllCanons = (): ContentDoc[] => filterPublished(rawAllCanons as any[]) as ContentDoc[];
export const getAllResources = (): ContentDoc[] => filterPublished(rawAllResources as any[]) as ContentDoc[];
export const getAllPrints = (): ContentDoc[] => filterPublished(rawAllPrints as any[]) as ContentDoc[];
export const getAllStrategies = (): ContentDoc[] => filterPublished(rawAllStrategies as any[]) as ContentDoc[];

export const getAllContentlayerDocs = getAllDocuments;

// Legacy “extra buckets” (safe empty)
export const getAllArticles = () => [] as ContentDoc[];
export const getAllGuides = () => [] as ContentDoc[];
export const getAllTutorials = () => [] as ContentDoc[];
export const getAllCaseStudies = () => [] as ContentDoc[];
export const getAllCourses = () => [] as ContentDoc[];
export const getAllDevotionals = () => [] as ContentDoc[];
export const getAllLessons = () => [] as ContentDoc[];
export const getAllNewsletters = () => [] as ContentDoc[];
export const getAllPodcasts = () => [] as ContentDoc[];
export const getAllPrayers = () => [] as ContentDoc[];

// -------------------------
// Stable “arrays” (LAZY) — avoids import-time freezing
// -------------------------
export const allDocuments = () => getAllDocuments();
export const allPosts = () => getAllPosts();
export const allBooks = () => getAllBooks();
export const allDownloads = () => getAllDownloads();
export const allEvents = () => getAllEvents();
export const allShorts = () => getAllShorts();
export const allCanons = () => getAllCanons();
export const allResources = () => getAllResources();
export const allPrints = () => getAllPrints();
export const allStrategies = () => getAllStrategies();

// -------------------------
// Slug lookup
// -------------------------
export const getDocumentBySlug = (slug: string) => {
  const s = normalizeSlug(slug);
  const docs = getAllDocuments();
  return (docs.find((d: any) => docSlugOf(d) === s) as ContentDoc) || null;
};

// Type-specific getters (legacy)
export const getPostBySlug = getDocumentBySlug;
export const getBookBySlug = getDocumentBySlug;
export const getDownloadBySlug = getDocumentBySlug;
export const getEventBySlug = getDocumentBySlug;
export const getShortBySlug = getDocumentBySlug;
export const getCanonBySlug = getDocumentBySlug;
export const getResourceBySlug = getDocumentBySlug;
export const getPrintBySlug = getDocumentBySlug;
export const getStrategyBySlug = getDocumentBySlug;

// “Server” aliases (back-compat)
export const getServerAllPosts = getAllPosts;
export const getServerPostBySlug = getPostBySlug;
export const getServerAllBooks = getAllBooks;
export const getServerBookBySlug = getBookBySlug;
export const getServerAllDownloads = getAllDownloads;
export const getServerDownloadBySlug = getDownloadBySlug;
export const getServerAllEvents = getAllEvents;
export const getServerEventBySlug = getEventBySlug;
export const getServerAllShorts = getAllShorts;
export const getServerShortBySlug = getShortBySlug;
export const getServerAllCanons = getAllCanons;
export const getServerCanonBySlug = getCanonBySlug;
export const getServerAllResources = getAllResources;
export const getServerResourceBySlug = getResourceBySlug;
export const getServerAllDocuments = getAllDocuments;
export const getServerDocumentBySlug = getDocumentBySlug;
export const getServerAllPrints = getAllPrints;
export const getServerAllStrategies = getAllStrategies;

// -------------------------
// Published helpers
// -------------------------
export const getPublishedDocuments = (docs: any[] = getAllDocuments()) =>
  filterPublished(docs as any[]).slice().sort(byDateDesc);

export const getPublishedPosts = () => getPublishedDocuments(getAllPosts());
export const getPublishedBooks = () => getPublishedDocuments(getAllBooks());
export const getPublishedDownloads = () => getPublishedDocuments(getAllDownloads());
export const getPublishedEvents = () => getPublishedDocuments(getAllEvents());
export const getPublishedShorts = () => getPublishedDocuments(getAllShorts());
export const getPublishedCanons = () => getPublishedDocuments(getAllCanons());
export const getPublishedResources = () => getPublishedDocuments(getAllResources());

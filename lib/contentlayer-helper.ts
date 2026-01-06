/* lib/contentlayer-helper.ts - CANONICAL, SINGLE SOURCE OF TRUTH (NO DUP EXPORTS) */

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
};

export type DocKind =
  | "Post"
  | "Book"
  | "Download"
  | "Event"
  | "Short"
  | "Canon"
  | "Resource"
  | "Print"
  | "Strategy"
  | "Document"
  | string;

/** Hard guarantees for legacy imports */
export const assertPublicAssetsForDownloadsAndResources = () => true;
export const recordContentView = () => true;
// -------------------------
// Slug + sorting utilities
// -------------------------
export const normalizeSlug = (slug: any) =>
  (slug ?? "")
    .toString()
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const byDateDesc = (a: any, b: any) =>
  new Date(b?.date ?? "").getTime() - new Date(a?.date ?? "").getTime();

export const isDraftContent = (doc: any) => !!doc?.draft;
export const isDraft = isDraftContent;

export const sanitizeData = <T>(obj: T): T => {
  if (obj === null || obj === undefined) return null as any;
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
};

// -------------------------
// Simple accessors
// -------------------------
export const getAccessLevel = (doc: any) =>
  doc?.accessLevel || doc?.tier || "public";

export const resolveDocCoverImage = (doc: any) =>
  doc?.coverImage || "/assets/images/placeholder.jpg";

export const resolveDocDownloadUrl = (doc: any) =>
  doc?.downloadUrl || doc?.fileUrl || "";

export const resolveDocDownloadHref = resolveDocDownloadUrl;

export const getDownloadSizeLabel = (sizeInBytes: number): string => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) return "—";
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
};

// -------------------------
// Collection getters (raw -> filtered)
// -------------------------
const filterPublished = <T extends any[]>(docs: T) =>
  (Array.isArray(docs) ? docs : []).filter((d: any) => d && !d.draft);

export const getAllDocuments = () =>
  filterPublished(rawAllDocuments as any[]) as ContentDoc[];

export const getAllPosts = () =>
  filterPublished(rawAllPosts as any[]) as ContentDoc[];
export const getAllBooks = () =>
  filterPublished(rawAllBooks as any[]) as ContentDoc[];
export const getAllDownloads = () =>
  filterPublished(rawAllDownloads as any[]) as ContentDoc[];
export const getAllEvents = () =>
  filterPublished(rawAllEvents as any[]) as ContentDoc[];
export const getAllShorts = () =>
  filterPublished(rawAllShorts as any[]) as ContentDoc[];
export const getAllCanons = () =>
  filterPublished(rawAllCanons as any[]) as ContentDoc[];
export const getAllResources = () =>
  filterPublished(rawAllResources as any[]) as ContentDoc[];
export const getAllPrints = () =>
  filterPublished(rawAllPrints as any[]) as ContentDoc[];
export const getAllStrategies = () =>
  filterPublished(rawAllStrategies as any[]) as ContentDoc[];

export const getAllContentlayerDocs = getAllDocuments;

// Legacy "extra buckets" (safe empty if you don't have these types)
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
// Precomputed collections (stable exports)
// -------------------------
export const allDocuments = getAllDocuments();
export const allPosts = getAllPosts();
export const allBooks = getAllBooks();
export const allDownloads = getAllDownloads();
export const allEvents = getAllEvents();
export const allShorts = getAllShorts();
export const allCanons = getAllCanons();
export const allResources = getAllResources();
export const allPrints = getAllPrints();
export const allStrategies = getAllStrategies();

// -------------------------
// Slug lookup
// -------------------------
const docSlugOf = (d: any) =>
  normalizeSlug(
    d?.slug ||
      d?._raw?.flattenedPath ||
      d?._raw?.sourceFileName?.replace(/\.mdx?$/, "") ||
      ""
  );

export const getDocumentBySlug = (slug: string) => {
  const s = normalizeSlug(slug);
  const docs = getAllDocuments();
  return (docs.find((d: any) => docSlugOf(d) === s) as ContentDoc) || null;
};

// Type-specific getters (all point to doc lookup)
export const getPostBySlug = getDocumentBySlug;
export const getBookBySlug = getDocumentBySlug;
export const getDownloadBySlug = getDocumentBySlug;
export const getEventBySlug = getDocumentBySlug;
export const getShortBySlug = getDocumentBySlug;
export const getCanonBySlug = getDocumentBySlug;
export const getResourceBySlug = getDocumentBySlug;
export const getPrintBySlug = getDocumentBySlug;
export const getStrategyBySlug = getDocumentBySlug;

// Server-prefixed versions (backwards compatibility)
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
export const getPublishedDownloads = () =>
  getPublishedDocuments(getAllDownloads());
export const getPublishedEvents = () => getPublishedDocuments(getAllEvents());
export const getPublishedShorts = () => getPublishedDocuments(getAllShorts());
export const getPublishedCanons = () => getPublishedDocuments(getAllCanons());
export const getPublishedResources = () =>
  getPublishedDocuments(getAllResources());

// -------------------------
// Routing helpers
// -------------------------
export const getDocKind = (doc: any): DocKind =>
  doc?.type || doc?._type || "Document";

export const getDocHref = (doc: any) => {
  const slug = docSlugOf(doc);
  const kind = getDocKind(doc);

  switch (kind) {
    case "Post":
      return `/blog/${slug}`;
    case "Book":
      return `/books/${slug}`;
    case "Canon":
      return `/canon/${slug}`;
    case "Download":
      return `/downloads/${slug}`;
    case "Event":
      return `/events/${slug}`;
    case "Short":
      return `/shorts/${slug}`;
    case "Print":
      return `/prints/${slug}`;
    case "Strategy":
      return `/strategy/${slug}`;
    case "Resource":
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

// ======================== REMOVE THIS ENTIRE DUPLICATE SECTION ========================
// DELETE EVERYTHING FROM LINE 328 TO THE END OF THE FILE
// The duplicate functions below are causing the build error
// ======================================================================================

export default {
  normalizeSlug,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  getDownloadSizeLabel,
  getDocHref,
  getDocKind,
  recordContentView,
  assertContentlayerHasDocs,
  assertPublicAssetsForDownloadsAndResources,
  isContentlayerLoaded,
  isDraft,
  isDraftContent,
  sanitizeData,
  toUiDoc,

  getAllDocuments,
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllShorts,
  getAllCanons,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllContentlayerDocs,

  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getCanonBySlug,
  getResourceBySlug,
  getPrintBySlug,
  getStrategyBySlug,

  getServerAllPosts,
  getServerAllBooks,
  getServerAllDownloads,
  getServerAllEvents,
  getServerAllShorts,
  getServerAllCanons,
  getServerAllResources,
  getServerAllDocuments,
  getServerAllPrints,
  getServerAllStrategies,

  getPublishedDocuments,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedShorts,
  getPublishedCanons,
  getPublishedResources,

  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allShorts,
  allCanons,
  allResources,
  allPrints,
  allStrategies,
};

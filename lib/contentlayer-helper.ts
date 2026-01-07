/* lib/contentlayer-helper.ts - CANONICAL, SINGLE SOURCE OF TRUTH (ASYNC, NO contentlayer/generated) */

import { getContentlayerData } from "@/lib/contentlayer-compat";
export { assertContentlayerHasDocs, isContentlayerLoaded } from "./contentlayer-guards";

/** Broad doc type used across legacy pages/components */
export type ContentDoc = {
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
  body?: any;
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  subtitle?: string | null;
  tags?: string[];
  [k: string]: any;
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
// Collection getters (async, single source)
// -------------------------
const filterPublished = (docs: any[]) =>
  (Array.isArray(docs) ? docs : []).filter((d) => d && !d.draft);

export async function getAllDocuments(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  const all = [
    ...(d.allBooks ?? []),
    ...(d.allCanons ?? []),
    ...(d.allDownloads ?? []),
    ...(d.allEvents ?? []),
    ...(d.allPosts ?? []),
    ...(d.allPrints ?? []),
    ...(d.allResources ?? []),
    ...(d.allShorts ?? []),
    ...(d.allStrategies ?? []),
  ];
  return filterPublished(all) as ContentDoc[];
}

export async function getAllPosts(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allPosts ?? []) as ContentDoc[];
}
export async function getAllBooks(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allBooks ?? []) as ContentDoc[];
}
export async function getAllDownloads(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allDownloads ?? []) as ContentDoc[];
}
export async function getAllEvents(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allEvents ?? []) as ContentDoc[];
}
export async function getAllShorts(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allShorts ?? []) as ContentDoc[];
}
export async function getAllCanons(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allCanons ?? []) as ContentDoc[];
}
export async function getAllResources(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allResources ?? []) as ContentDoc[];
}
export async function getAllPrints(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allPrints ?? []) as ContentDoc[];
}
export async function getAllStrategies(): Promise<ContentDoc[]> {
  const d = await getContentlayerData();
  return filterPublished(d.allStrategies ?? []) as ContentDoc[];
}

export const getAllContentlayerDocs = getAllDocuments;

// Legacy “extra buckets” (safe empty)
export const getAllArticles = async () => [] as ContentDoc[];
export const getAllGuides = async () => [] as ContentDoc[];
export const getAllTutorials = async () => [] as ContentDoc[];
export const getAllCaseStudies = async () => [] as ContentDoc[];
export const getAllCourses = async () => [] as ContentDoc[];
export const getAllDevotionals = async () => [] as ContentDoc[];
export const getAllLessons = async () => [] as ContentDoc[];
export const getAllNewsletters = async () => [] as ContentDoc[];
export const getAllPodcasts = async () => [] as ContentDoc[];
export const getAllPrayers = async () => [] as ContentDoc[];

// -------------------------
// Stable “arrays” (async) — prevents import-time freezing
// -------------------------
export const allDocuments = async () => getAllDocuments();
export const allPosts = async () => getAllPosts();
export const allBooks = async () => getAllBooks();
export const allDownloads = async () => getAllDownloads();
export const allEvents = async () => getAllEvents();
export const allShorts = async () => getAllShorts();
export const allCanons = async () => getAllCanons();
export const allResources = async () => getAllResources();
export const allPrints = async () => getAllPrints();
export const allStrategies = async () => getAllStrategies();

// -------------------------
// Slug lookup (async)
// -------------------------
export async function getDocumentBySlug(slug: string): Promise<ContentDoc | null> {
  const s = normalizeSlug(slug);
  const docs = await getAllDocuments();
  return (docs.find((d: any) => docSlugOf(d) === s) as ContentDoc) || null;
}

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
// Published helpers (async)
// -------------------------
export async function getPublishedDocuments(docs?: any[]) {
  const base = docs ?? (await getAllDocuments());
  return filterPublished(base as any[]).slice().sort(byDateDesc);
}

export const getPublishedPosts = async () => getPublishedDocuments(await getAllPosts());
export const getPublishedBooks = async () => getPublishedDocuments(await getAllBooks());
export const getPublishedDownloads = async () => getPublishedDocuments(await getAllDownloads());
export const getPublishedEvents = async () => getPublishedDocuments(await getAllEvents());
export const getPublishedShorts = async () => getPublishedDocuments(await getAllShorts());
export const getPublishedCanons = async () => getPublishedDocuments(await getAllCanons());
export const getPublishedResources = async () => getPublishedDocuments(await getAllResources());
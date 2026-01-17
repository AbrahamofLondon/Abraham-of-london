/**
 * lib/contentlayer-compat.ts — SINGLE SOURCE OF TRUTH (Pages Router, SYNC-FIRST)
 *
 * This is the client-safe version that delegates to server-only logic
 */

export interface DocBase {
  _id?: string;
  _raw?: {
    sourceFilePath?: string;
    sourceFileName?: string;
    sourceFileDir?: string;
    contentType?: string;
    flattenedPath?: string;
  };
  type?: string;
  title?: string;
  slug?: string;
  date?: string;
  updated?: string;
  author?: string;
  description?: string;
  excerpt?: string;
  draft?: boolean;
  published?: boolean;
  tags?: string[];
  category?: string;
  coverImage?: string;
  featured?: boolean;
  accessLevel?: string;
  tier?: string;
  requiresAuth?: boolean;
  subtitle?: string | null;
  readTime?: string | null;
  volume?: string | null;
  body?: {
    raw?: string;
    code?: string;
  };
  fileUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  fileFormat?: string;
  requiresEmail?: boolean;
  [k: string]: any;
}

type GeneratedShape = {
  allDocuments: DocBase[];
  allPosts: DocBase[];
  allBooks: DocBase[];
  allCanons: DocBase[];
  allDownloads: DocBase[];
  allShorts: DocBase[];
  allEvents: DocBase[];
  allPrints: DocBase[];
  allResources: DocBase[];
  allStrategies: DocBase[];
};

const FALLBACK: GeneratedShape = {
  allDocuments: [],
  allPosts: [],
  allBooks: [],
  allCanons: [],
  allDownloads: [],
  allShorts: [],
  allEvents: [],
  allPrints: [],
  allResources: [],
  allStrategies: [],
};

// Client-side fallback data
let DATA: GeneratedShape = FALLBACK;
let LOADED = false;

// Server-side data loading - will only execute on server
async function loadServerData(): Promise<GeneratedShape> {
  // Only import server module on server
  if (typeof window === 'undefined') {
    try {
      const { getContentlayerData, getAllDocumentsSync } = await import('./contentlayer-compat.server');
      const serverData = await getContentlayerData();
      
      return {
        allDocuments: getAllDocumentsSync(serverData),
        allPosts: serverData.allPosts || [],
        allBooks: serverData.allBooks || [],
        allCanons: serverData.allCanons || [],
        allDownloads: serverData.allDownloads || [],
        allShorts: serverData.allShorts || [],
        allEvents: serverData.allEvents || [],
        allPrints: serverData.allPrints || [],
        allResources: serverData.allResources || [],
        allStrategies: serverData.allStrategies || [],
      };
    } catch (error) {
      console.warn('[Contentlayer] Failed to load server data:', error);
      return FALLBACK;
    }
  }
  return FALLBACK;
}

// Initialize data (async, only works on server)
if (typeof window === 'undefined') {
  loadServerData().then(serverData => {
    DATA = serverData;
    LOADED = true;
    console.log(`[Contentlayer] Loaded server data: ${DATA.allDocuments.length} documents`);
  }).catch(() => {
    // Keep fallback data
    LOADED = false;
  });
}

/** SYNC getter — Pages Router safe (client-side returns fallback) */
export function getContentlayerData(): GeneratedShape {
  return DATA;
}

/** Status helpers */
export function isContentlayerLoaded(): boolean {
  return LOADED;
}

export function assertContentlayerHasDocs(data?: GeneratedShape): boolean {
  const d = data ?? DATA;
  const total = d.allDocuments?.length ?? 0;
  return total > 0;
}

/** Slug utils */
export function normalizeSlug(input: any): string {
  return (input ?? "")
    .toString()
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function slugOf(doc: DocBase | any): string {
  return normalizeSlug(
    doc?.slug ||
      doc?._raw?.flattenedPath ||
      doc?._raw?.sourceFileName?.replace(/\.mdx?$/, "") ||
      ""
  );
}

/** Kind logic: folder-derived, stable */
export type DocKind =
  | "post"
  | "book"
  | "canon"
  | "download"
  | "event"
  | "short"
  | "print"
  | "resource"
  | "strategy"
  | "document"
  | string;

export function getDocKind(doc: DocBase | any): DocKind {
  const fp = String(doc?._raw?.flattenedPath ?? "");
  if (fp.startsWith("blog/")) return "post";
  if (fp.startsWith("books/")) return "book";
  if (fp.startsWith("canon/")) return "canon";
  if (fp.startsWith("downloads/")) return "download";
  if (fp.startsWith("events/")) return "event";
  if (fp.startsWith("shorts/")) return "short";
  if (fp.startsWith("prints/")) return "print";
  if (fp.startsWith("resources/")) return "resource";
  if (fp.startsWith("strategy/")) return "strategy";

  return (doc?.type || doc?._type || "document") as DocKind;
}

export function getDocHref(doc: DocBase | any): string {
  const s = slugOf(doc);
  const k = getDocKind(doc);
  if (!s) return "/";

  switch (k) {
    case "post":
      return `/blog/${s}`;
    case "book":
      return `/books/${s}`;
    case "canon":
      return `/canon/${s}`;
    case "download":
      return `/downloads/${s}`;
    case "event":
      return `/events/${s}`;
    case "short":
      return `/shorts/${s}`;
    case "print":
      return `/prints/${s}`;
    case "strategy":
      return `/strategy/${s}`;
    case "resource":
      return `/resources/${s}`;
    default:
      return `/content/${s}`;
  }
}

export function getAccessLevel(doc: DocBase | any): string {
  return String(doc?.accessLevel || doc?.tier || "public").trim().toLowerCase();
}

/**
 * Draft logic:
 * - `draft: true` => draft
 * - `published: false` => draft/unpublished
 * Everything else => published
 */
export function isDraftContent(doc: DocBase | any): boolean {
  if (!doc) return true;
  if (doc?.draft === true) return true;
  if (doc?.published === false) return true;
  return false;
}

export function isPublished(doc: DocBase | any): boolean {
  return !isDraftContent(doc);
}

/** Media resolvers */
export function resolveDocCoverImage(doc: DocBase | any): string | null {
  return (doc?.coverImage || doc?.featuredImage || doc?.image || null) as string | null;
}

export function resolveDocDownloadUrl(doc: DocBase | any): string | null {
  return (doc?.downloadUrl || doc?.fileUrl || doc?.downloadFile || null) as string | null;
}

/** UI normalizer */
export function toUiDoc<T extends DocBase>(doc: T): T & {
  slug: string;
  href: string;
  kind: DocKind;
  coverImage: string | null;
  downloadUrl: string | null;
  accessLevel: string;
} {
  return {
    ...(doc as any),
    slug: slugOf(doc),
    href: getDocHref(doc),
    kind: getDocKind(doc),
    coverImage: resolveDocCoverImage(doc),
    downloadUrl: resolveDocDownloadUrl(doc),
    accessLevel: getAccessLevel(doc),
  };
}

/** Combined docs */
export function getAllCombinedDocs(): DocBase[] {
  return DATA.allDocuments;
}

/** Published filter + stable sort */
function safeDateMs(v: any): number {
  const t = new Date(v ?? "").getTime();
  return Number.isFinite(t) ? t : 0;
}

export function getPublishedDocuments(docs?: DocBase[]): DocBase[] {
  const source = docs ?? getAllCombinedDocs();
  return (source ?? [])
    .filter((x) => x && isPublished(x))
    .slice()
    .sort((a, b) => safeDateMs(b?.date) - safeDateMs(a?.date));
}

/** Slug lookup (across combined docs by default) */
export function getDocBySlug(slug: string, collection?: DocBase[]): DocBase | null {
  const s = normalizeSlug(slug);
  const src = collection ?? getAllCombinedDocs();

  const found = (src ?? []).find((doc) => {
    const a = normalizeSlug(doc?.slug || "");
    const b = normalizeSlug(doc?._raw?.flattenedPath || "");
    return a === s || b === s;
  });

  return found ?? null;
}

/** Sanitize for Next.js serialization */
export function sanitizeData<T>(input: T): T {
  if (input === null || input === undefined) return input as any;
  return JSON.parse(
    JSON.stringify(input, (_k, v) => (v === undefined ? null : v))
  );
}

/** Optional async wrappers (for callers that insist on await) */
export async function getContentlayerDataAsync(): Promise<GeneratedShape> {
  if (typeof window === 'undefined') {
    // On server, load fresh data
    return await loadServerData();
  }
  // On client, return cached data
  return Promise.resolve(DATA);
}

export async function getPublishedDocumentsAsync(docs?: DocBase[]): Promise<DocBase[]> {
  return Promise.resolve(getPublishedDocuments(docs));
}

export async function getDocBySlugAsync(slug: string, collection?: DocBase[]): Promise<DocBase | null> {
  return Promise.resolve(getDocBySlug(slug, collection));
}

/** ==================== MISSING EXPORTS FOR PAGE IMPORTS ==================== */

// For ./pages/books/[slug].tsx and similar
export function getAllBooks() {
  return DATA.allBooks ?? [];
}

export function getServerAllBooks() {
  return getAllBooks();
}

export function getServerBookBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allBooks ?? []).find(book => normalizeSlug(book.slug) === normalizedSlug) || null;
}

// For ./pages/canon/[slug].tsx
export function getAllCanons() {
  return DATA.allCanons ?? [];
}

export function getServerAllCanons() {
  return getAllCanons();
}

export function getServerCanonBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allCanons ?? []).find(canon => normalizeSlug(canon.slug) === normalizedSlug) || null;
}

// For ./pages/downloads/[slug].tsx
export function getAllDownloads() {
  return DATA.allDownloads ?? [];
}

export function getServerAllDownloads() {
  return getAllDownloads();
}

export function getServerDownloadBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allDownloads ?? []).find(download => normalizeSlug(download.slug) === normalizedSlug) || null;
}

export function getDownloadBySlug(slug: string) {
  return getServerDownloadBySlug(slug);
}

// For ./pages/events/[slug].tsx
export function getAllEvents() {
  return DATA.allEvents ?? [];
}

export function getServerAllEvents() {
  return getAllEvents();
}

export function getServerEventBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allEvents ?? []).find(event => normalizeSlug(event.slug) === normalizedSlug) || null;
}

// For ./pages/index.tsx and ./pages/shorts/[slug].tsx
export function getAllShorts() {
  return DATA.allShorts ?? [];
}

export function getServerAllShorts() {
  return getAllShorts();
}

export function getServerShortBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allShorts ?? []).find(short => normalizeSlug(short.slug) === normalizedSlug) || null;
}

// For ./pages/resources/[...slug].tsx
export function getAllResources() {
  return DATA.allResources ?? [];
}

export function getServerAllResources() {
  return getAllResources();
}

export function getServerResourceBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allResources ?? []).find(resource => normalizeSlug(resource.slug) === normalizedSlug) || null;
}

// For ./pages/content/[slug].tsx and ./pages/debug/content.tsx
export function getAllContentlayerDocs() {
  return getAllCombinedDocs();
}

// For ./pages/debug/content.tsx
export function isDraft(doc: DocBase | any): boolean {
  return isDraftContent(doc);
}

// For ./pages/api/blog/[slug].tsx and ./pages/api/canon/[slug].tsx
export function getAllPosts() {
  return DATA.allPosts ?? [];
}

export function getServerAllPosts() {
  return getAllPosts();
}

export function getServerPostBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allPosts ?? []).find(post => normalizeSlug(post.slug) === normalizedSlug) || null;
}

// For ./pages/api/content/initialize.ts
export async function getServerAllBooksAsync() {
  if (typeof window === 'undefined') {
    const data = await loadServerData();
    return data.allBooks;
  }
  return Promise.resolve(DATA.allBooks);
}

export async function getServerAllCanonsAsync() {
  if (typeof window === 'undefined') {
    const data = await loadServerData();
    return data.allCanons;
  }
  return Promise.resolve(DATA.allCanons);
}

export async function getServerAllDownloadsAsync() {
  if (typeof window === 'undefined') {
    const data = await loadServerData();
    return data.allDownloads;
  }
  return Promise.resolve(DATA.allDownloads);
}

export async function getServerAllShortsAsync() {
  if (typeof window === 'undefined') {
    const data = await loadServerData();
    return data.allShorts;
  }
  return Promise.resolve(DATA.allShorts);
}

// For ./pages/api/blog/[slug].tsx and ./pages/api/canon/[slug].tsx
export function recordContentView(slug: string, type: string) {
  // Implementation depends on your analytics setup
  console.log(`Recorded view: ${type} - ${slug}`);
}

/** Direct exports some code may import */
export const allDocuments = DATA.allDocuments ?? [];
export const allPosts = DATA.allPosts ?? [];
export const allBooks = DATA.allBooks ?? [];
export const allCanons = DATA.allCanons ?? [];
export const allDownloads = DATA.allDownloads ?? [];
export const allShorts = DATA.allShorts ?? [];
export const allEvents = DATA.allEvents ?? [];
export const allPrints = DATA.allPrints ?? [];
export const allResources = DATA.allResources ?? [];
export const allStrategies = DATA.allStrategies ?? [];

/** Additional utility functions for common patterns */
export function getDocumentsByType(type: string): DocBase[] {
  switch (type) {
    case 'post':
      return DATA.allPosts ?? [];
    case 'book':
      return DATA.allBooks ?? [];
    case 'canon':
      return DATA.allCanons ?? [];
    case 'download':
      return DATA.allDownloads ?? [];
    case 'event':
      return DATA.allEvents ?? [];
    case 'short':
      return DATA.allShorts ?? [];
    case 'print':
      return DATA.allPrints ?? [];
    case 'resource':
      return DATA.allResources ?? [];
    case 'strategy':
      return DATA.allStrategies ?? [];
    default:
      return DATA.allDocuments?.filter(doc => doc.type === type) ?? [];
  }
}

export function getPublishedDocumentsByType(type: string): DocBase[] {
  return getDocumentsByType(type).filter(isPublished);
}

export function getAllSlugs(type?: string): string[] {
  let documents = DATA.allDocuments;
  if (type) {
    documents = getDocumentsByType(type);
  }
  return documents
    .filter(isPublished)
    .map(doc => doc.slug || '')
    .filter(Boolean);
}

export function getFeaturedDocuments(count: number = 3): DocBase[] {
  return (DATA.allDocuments ?? [])
    .filter(doc => doc.featured && isPublished(doc))
    .sort((a, b) => safeDateMs(b?.date) - safeDateMs(a?.date))
    .slice(0, count);
}

export function getRecentDocuments(count: number = 5, type?: string): DocBase[] {
  let documents = DATA.allDocuments;
  if (type) {
    documents = getDocumentsByType(type);
  }
  
  return documents
    .filter(isPublished)
    .sort((a, b) => safeDateMs(b?.date) - safeDateMs(a?.date))
    .slice(0, count);
}

// Create the default export object - ONLY ONE DEFINITION
const contentlayerCompatApi = {
  // Core functions
  getContentlayerData,
  getPublishedDocuments,
  getDocBySlug,
  getDocKind,
  getDocHref,
  normalizeSlug,
  isDraftContent,
  isPublished,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  sanitizeData,
  toUiDoc,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
  
  // Type-specific getters
  getAllBooks,
  getServerAllBooks,
  getServerBookBySlug,
  getAllCanons,
  getServerAllCanons,
  getServerCanonBySlug,
  getAllDownloads,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getDownloadBySlug,
  getAllEvents,
  getServerAllEvents,
  getServerEventBySlug,
  getAllShorts,
  getServerAllShorts,
  getServerShortBySlug,
  getAllResources,
  getServerAllResources,
  getServerResourceBySlug,
  getAllContentlayerDocs,
  isDraft,
  getAllPosts,
  getServerAllPosts,
  getServerPostBySlug,
  
  // Async versions
  getServerAllBooksAsync,
  getServerAllCanonsAsync,
  getServerAllDownloadsAsync,
  getServerAllShortsAsync,
  
  // Utility functions
  recordContentView,
  getDocumentsByType,
  getPublishedDocumentsByType,
  getAllSlugs,
  getFeaturedDocuments,
  getRecentDocuments,
  
  // Async wrappers
  getContentlayerDataAsync,
  getPublishedDocumentsAsync,
  getDocBySlugAsync,
  
  // Data constants
  allDocuments,
  allPosts,
  allBooks,
  allCanons,
  allDownloads,
  allShorts,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
};

export default contentlayerCompatApi;
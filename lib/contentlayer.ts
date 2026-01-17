/**
 * lib/contentlayer-compat.ts — SINGLE SOURCE OF TRUTH (Pages Router, SYNC-FIRST)
 *
 * Goals:
 * - Never require async to read content at build-time in Pages Router
 * - Always provide stable arrays (empty instead of crashing)
 * - Provide consistent slug/kind/href logic
 * - Provide "published" filtering that doesn't accidentally zero everything
 *
 * Fixed for Contentlayer v2 with Windows/Unix compatible paths
 */

// DYNAMIC IMPORTS ONLY - NO DIRECT FS IMPORTS
let fs: any = null;
let path: any = null;

// Only import fs/path on server-side
if (typeof window === 'undefined') {
  try {
    fs = require('fs');
    path = require('path');
  } catch (error) {
    console.warn('[Contentlayer] Failed to load fs/path modules:', error);
  }
}

export interface DocBase {
  _id?: string;
  _raw?: {
    sourceFilePath?: string;
    sourceFileName?: string;
    sourceFileDir?: string;
    contentType?: string;
    flattenedPath?: string;
  };
  type?: string; // contentlayer "type"
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
  // download-ish
  fileUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  fileFormat?: string;
  requiresEmail?: boolean;

  // allow extra fields
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

function safeArray<T>(v: any): T[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  // Contentlayer v2 often exports as { allDocuments: [...] }
  if (v.allDocuments && Array.isArray(v.allDocuments)) return v.allDocuments;
  // Some exports might be the array directly
  if (typeof v === 'object' && !Array.isArray(v)) {
    // Try to find any array property
    for (const key in v) {
      if (Array.isArray(v[key])) return v[key];
    }
  }
  return [];
}

let DATA: GeneratedShape = FALLBACK;
let LOADED = false;

// Helper to clear mod cache in development
const clearCache = (modulePath: string) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const resolvedPath = require.resolve(modulePath);
      delete require.cache[resolvedPath];
    } catch (e) {
      // ignore if mod not resolved yet
    }
  }
};

// Helper to safely load a mod with fallbacks
const loadModule = (modulePath: string): any => {
  try {
    clearCache(modulePath);
    return require(modulePath);
  } catch (e) {
    console.warn(`[Contentlayer] Failed to load mod: ${modulePath}`, e?.message || e);
    return null;
  }
};

// Helper to check if file exists (server-side only)
const fileExists = (filePath: string): boolean => {
  if (!fs || typeof window !== 'undefined') return false;
  
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
};

try {
  // Only load contentlayer data if we have fs and path (server-side)
  if (fs && path) {
    // METHOD 1: Try to load from the main index.mjs (Contentlayer v2's main export)
    const mainIndexPath = path.join(process.cwd(), '.contentlayer', 'generated', 'index.mjs');
    
    if (fileExists(mainIndexPath)) {
      const mainIndex = loadModule(mainIndexPath);
      
      if (mainIndex) {
        DATA = {
          allDocuments: safeArray<DocBase>(mainIndex.allDocuments),
          allPosts: safeArray<DocBase>(mainIndex.allPosts || mainIndex.Post),
          allBooks: safeArray<DocBase>(mainIndex.allBooks || mainIndex.Book),
          allCanons: safeArray<DocBase>(mainIndex.allCanons || mainIndex.Canon),
          allDownloads: safeArray<DocBase>(mainIndex.allDownloads || mainIndex.Download),
          allShorts: safeArray<DocBase>(mainIndex.allShorts || mainIndex.Short),
          allEvents: safeArray<DocBase>(mainIndex.allEvents || mainIndex.Event),
          allPrints: safeArray<DocBase>(mainIndex.allPrints || mainIndex.Print),
          allResources: safeArray<DocBase>(mainIndex.allResources || mainIndex.Resource),
          allStrategies: safeArray<DocBase>(mainIndex.allStrategies || mainIndex.Strategy),
        };
      }
    }

    // METHOD 2: If main index didn't work or is incomplete, load individual collections
    const totalFromMain = Object.values(DATA).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalFromMain === 0) {
      console.log('[Contentlayer] Main index empty, loading individual collections...');
      
      // Load each collection individually
      const collections = [
        { name: 'Post', key: 'allPosts' },
        { name: 'Book', key: 'allBooks' },
        { name: 'Canon', key: 'allCanons' },
        { name: 'Download', key: 'allDownloads' },
        { name: 'Short', key: 'allShorts' },
        { name: 'Event', key: 'allEvents' },
        { name: 'Print', key: 'allPrints' },
        { name: 'Resource', key: 'allResources' },
        { name: 'Strategy', key: 'allStrategies' },
      ];

      for (const collection of collections) {
        const collectionPath = path.join(process.cwd(), '.contentlayer', 'generated', collection.name, '_index.mjs');
        if (fileExists(collectionPath)) {
          const mod = loadModule(collectionPath);
          if (mod) {
            DATA[collection.key as keyof GeneratedShape] = safeArray<DocBase>(mod);
            console.log(`[Contentlayer] Loaded ${collection.name}: ${DATA[collection.key as keyof GeneratedShape].length} items`);
          }
        } else {
          console.log(`[Contentlayer] Collection not found: ${collectionPath}`);
        }
      }
    }

    // Combine all documents
    DATA.allDocuments = [
      ...DATA.allPosts,
      ...DATA.allBooks,
      ...DATA.allCanons,
      ...DATA.allDownloads,
      ...DATA.allShorts,
      ...DATA.allEvents,
      ...DATA.allPrints,
      ...DATA.allResources,
      ...DATA.allStrategies,
    ];

    LOADED = true;
    console.log(
      `[Contentlayer] Loaded: posts=${DATA.allPosts.length} books=${DATA.allBooks.length} canon=${DATA.allCanons.length} downloads=${DATA.allDownloads.length} shorts=${DATA.allShorts.length} events=${DATA.allEvents.length} prints=${DATA.allPrints.length} resources=${DATA.allResources.length} strategies=${DATA.allStrategies.length} total=${DATA.allDocuments.length}`
    );
    
    // Log a warning if we have no data
    if (DATA.allDocuments.length === 0) {
      console.warn('[Contentlayer] No documents loaded - check .contentlayer/generated structure');
      if (fs.existsSync(path.join(process.cwd(), '.contentlayer', 'generated'))) {
        console.warn('[Contentlayer] Generated directory contents:', fs.readdirSync(path.join(process.cwd(), '.contentlayer', 'generated'), { withFileTypes: true }).map(d => d.name));
      }
    }
  }
} catch (e: any) {
  // METHOD 3: Fallback to Contentlayer v1 structure
  try {
    console.log('[Contentlayer] Trying v1 fallback...');
    const v1Path = path.join(process.cwd(), '.contentlayer', 'generated');
    const v1Module = loadModule(v1Path);
    
    if (v1Module) {
      DATA = {
        allDocuments: safeArray<DocBase>(v1Module.allDocuments),
        allPosts: safeArray<DocBase>(v1Module.allPosts),
        allBooks: safeArray<DocBase>(v1Module.allBooks),
        allCanons: safeArray<DocBase>(v1Module.allCanons),
        allDownloads: safeArray<DocBase>(v1Module.allDownloads),
        allShorts: safeArray<DocBase>(v1Module.allShorts),
        allEvents: safeArray<DocBase>(v1Module.allEvents),
        allPrints: safeArray<DocBase>(v1Module.allPrints),
        allResources: safeArray<DocBase>(v1Module.allResources),
        allStrategies: safeArray<DocBase>(v1Module.allStrategies),
      };
      
      LOADED = true;
      console.log(
        `[Contentlayer] Loaded (v1 fallback): posts=${DATA.allPosts.length} books=${DATA.allBooks.length} canon=${DATA.allCanons.length} downloads=${DATA.allDownloads.length}`
      );
    } else {
      throw new Error('No v1 mod found');
    }
  } catch (e2: any) {
    LOADED = false;
    DATA = FALLBACK;
    console.warn('[Contentlayer] All loading methods failed — using empty collections.');
    console.warn('[Contentlayer] V2 error:', e?.message || e);
    console.warn('[Contentlayer] V1 error:', e2?.message || e2);
  }
}

/** SYNC getter — Pages Router safe */
export function getContentlayerData(): GeneratedShape {
  return DATA;
}

/** Status helpers */
export function isContentlayerLoaded(): boolean {
  return LOADED;
}

export function assertContentlayerHasDocs(data?: GeneratedShape): boolean {
  const d = data ?? DATA;
  const total =
    (d.allDocuments?.length ?? 0) +
    (d.allPosts?.length ?? 0) +
    (d.allBooks?.length ?? 0) +
    (d.allCanons?.length ?? 0) +
    (d.allDownloads?.length ?? 0) +
    (d.allShorts?.length ?? 0) +
    (d.allEvents?.length ?? 0) +
    (d.allPrints?.length ?? 0) +
    (d.allResources?.length ?? 0) +
    (d.allStrategies?.length ?? 0);

  if (total <= 0) {
    console.warn("⚠ Contentlayer: no documents detected (all collections empty).");
    return false;
  }
  return true;
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

/** Combined docs (the #1 reason your indexes went "0") */
export function getAllCombinedDocs(): DocBase[] {
  const d = DATA;
  return [
    ...(d.allPosts ?? []),
    ...(d.allBooks ?? []),
    ...(d.allCanons ?? []),
    ...(d.allDownloads ?? []),
    ...(d.allEvents ?? []),
    ...(d.allShorts ?? []),
    ...(d.allPrints ?? []),
    ...(d.allResources ?? []),
    ...(d.allStrategies ?? []),
    ...(d.allDocuments ?? []),
  ];
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
  return Promise.resolve(getContentlayerData());
}
export async function getPublishedDocumentsAsync(docs?: DocBase[]): Promise<DocBase[]> {
  return Promise.resolve(getPublishedDocuments(docs));
}
export async function getDocBySlugAsync(slug: string, collection?: DocBase[]): Promise<DocBase | null> {
  return Promise.resolve(getDocBySlug(slug, collection));
}

// ==================== MISSING EXPORTS FOR PAGE IMPORTS ====================

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
export function getServerAllBooksAsync() {
  return Promise.resolve(getAllBooks());
}

export function getServerAllCanonsAsync() {
  return Promise.resolve(getAllCanons());
}

export function getServerAllDownloadsAsync() {
  return Promise.resolve(getAllDownloads());
}

export function getServerAllShortsAsync() {
  return Promise.resolve(getAllShorts());
}

// For ./pages/api/blog/[slug].tsx and ./pages/api/canon/[slug].tsx
export function recordContentView(slug: string, type: string) {
  console.log(`Recorded view: ${type} - ${slug}`);
}

// ==================== ADD MISSING EXPORTS FOR BUILD ERRORS ====================

// These were causing "Export doesn't exist" errors
export function getAllPrints() {
  return DATA.allPrints ?? [];
}

export function getServerAllPrints() {
  return getAllPrints();
}

export function getServerPrintBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allPrints ?? []).find(print => normalizeSlug(print.slug) === normalizedSlug) || null;
}

export function getAllStrategies() {
  return DATA.allStrategies ?? [];
}

export function getServerAllStrategies() {
  return getAllStrategies();
}

export function getServerStrategyBySlug(slug: string) {
  const normalizedSlug = normalizeSlug(slug);
  return (DATA.allStrategies ?? []).find(strategy => normalizeSlug(strategy.slug) === normalizedSlug) || null;
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

const contentlayerApi = {

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
  // New exports
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
  getServerAllBooksAsync,
  getServerAllCanonsAsync,
  getServerAllDownloadsAsync,
  getServerAllShortsAsync,
  recordContentView,
  // Added missing exports
  getAllPrints,
  getServerAllPrints,
  getServerPrintBySlug,
  getAllStrategies,
  getServerAllStrategies,
  getServerStrategyBySlug,
  // Direct exports
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
export default contentlayerApi;


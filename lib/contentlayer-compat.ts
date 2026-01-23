// lib/contentlayer-compat.ts - ROBUST TYPE-SAFE VERSION

/**
 * lib/contentlayer-compat.ts — SINGLE SOURCE OF TRUTH (Pages Router, SYNC-FIRST)
 * Reconciled for Abraham of London Institutional Stability.
 */

// --- CORE TYPES ---

// Base document interface with all optional fields
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

// Strict interface for functions that require certain fields
export interface StrictContentDoc extends DocBase {
  // Required fields for strict operations
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  slug: string;
  title: string;
  
  // Enhanced fields with proper defaults
  kind: string;
  href: string;
  coverImage: string | null;
  downloadUrl: string | null;
  accessLevel: string;
}

// Public ContentDoc type - exported as union for flexibility
export type ContentDoc = DocBase | StrictContentDoc;

// Type guard to check if a document is StrictContentDoc
export function isStrictContentDoc(doc: ContentDoc): doc is StrictContentDoc {
  return (
    typeof (doc as StrictContentDoc)._id === 'string' &&
    typeof (doc as StrictContentDoc)._raw?.flattenedPath === 'string' &&
    typeof (doc as StrictContentDoc).slug === 'string' &&
    typeof (doc as StrictContentDoc).title === 'string'
  );
}

// Convert any ContentDoc to StrictContentDoc with defaults
export function toStrictContentDoc(doc: ContentDoc): StrictContentDoc {
  if (isStrictContentDoc(doc)) {
    return doc;
  }
  
  const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || '');
  const kind = getDocKind(doc);
  const href = getDocHref(doc);
  
  return {
    ...doc,
    _id: doc._id || `doc_${slug}_${Date.now()}`,
    _raw: doc._raw || {
      sourceFilePath: '',
      sourceFileName: '',
      sourceFileDir: '',
      contentType: 'document',
      flattenedPath: slug,
    },
    slug,
    title: doc.title || 'Untitled',
    kind,
    href,
    coverImage: doc.coverImage || null,
    downloadUrl: doc.downloadUrl || null,
    accessLevel: doc.accessLevel || 'public',
  };
}

export type DocKind = 
  | 'post' | 'book' | 'canon' | 'download' | 'short' 
  | 'event' | 'print' | 'resource' | 'strategy' | 'document';

type GeneratedShape = {
  allDocuments: ContentDoc[];
  allPosts: ContentDoc[];
  allBooks: ContentDoc[];
  allCanons: ContentDoc[];
  allDownloads: ContentDoc[];
  allShorts: ContentDoc[];
  allEvents: ContentDoc[];
  allPrints: ContentDoc[];
  allResources: ContentDoc[];
  allStrategies: ContentDoc[];
};

const FALLBACK: GeneratedShape = {
  allDocuments: [], allPosts: [], allBooks: [], allCanons: [],
  allDownloads: [], allShorts: [], allEvents: [], allPrints: [],
  allResources: [], allStrategies: [],
};

// --- STATE ---
let DATA: GeneratedShape = FALLBACK;
let LOADED = false;

// --- SERVER-SIDE HYDRATION ENGINE ---
async function syncInstitutionalData() {
  if (typeof window !== 'undefined') return;
  
  try {
    const { getContentlayerData, getAllDocumentsSync } = await import('./contentlayer-compat.server');
    const rawData = await getContentlayerData();
    
    DATA = {
      allDocuments: getAllDocumentsSync(rawData),
      allPosts: rawData.allPosts || [],
      allBooks: rawData.allBooks || [],
      allCanons: rawData.allCanons || [],
      allDownloads: rawData.allDownloads || [],
      allShorts: rawData.allShorts || [],
      allEvents: rawData.allEvents || [],
      allPrints: rawData.allPrints || [],
      allResources: rawData.allResources || [],
      allStrategies: rawData.allStrategies || [],
    };
    LOADED = true;
  } catch (error) {
    console.error('[Institutional Engine] Critical Hydration Failure:', error);
    if (process.env.NODE_ENV === 'development') {
      DATA = {
        ...FALLBACK,
        allDocuments: [
          {
            _id: 'dev_fallback_1',
            title: 'Development Mode',
            slug: 'development-fallback',
            description: 'Contentlayer data is loading...',
            _raw: {
              sourceFilePath: '',
              sourceFileName: 'dev-fallback.mdx',
              sourceFileDir: 'dev',
              contentType: 'document',
              flattenedPath: 'dev/fallback',
            },
            body: { raw: 'Content is being loaded.' }
          }
        ]
      };
      LOADED = true;
    }
  }
}

if (typeof window === 'undefined') {
  syncInstitutionalData().catch(() => {});
}

// --- CORE EXPORTS ---
export function getContentlayerData(): GeneratedShape {
  return DATA;
}

export function isContentlayerLoaded(): boolean {
  return LOADED;
}

export function assertContentlayerHasDocs(data?: GeneratedShape): boolean {
  const d = data ?? DATA;
  return (d.allDocuments?.length ?? 0) > 0;
}

// --- SLUG & PATH LOGIC ---
export function normalizeSlug(input: any): string {
  return (input ?? "").toString().trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

function slugOf(doc: ContentDoc | any): string {
  return normalizeSlug(
    doc?.slug || doc?._raw?.flattenedPath || doc?._raw?.sourceFileName?.replace(/\.mdx?$/, "") || ""
  );
}

export function getDocKind(doc: ContentDoc | any): string {
  const fp = String(doc?._raw?.flattenedPath ?? "");
  if (fp.startsWith("blog/")) return "post";
  if (fp.startsWith("books/")) return "book";
  if (fp.startsWith("canon/")) return "canon";
  if (fp.startsWith("downloads/")) return "download";
  if (fp.startsWith("strategy/")) return "strategy";
  if (fp.startsWith("resources/")) return "resource";
  return (doc?.type || doc?._type || "document").toLowerCase();
}

export function getDocHref(doc: ContentDoc | any): string {
  const s = slugOf(doc);
  const k = getDocKind(doc);
  if (!s) return "/";
  const map: Record<string, string> = {
    post: `/blog/${s}`,
    book: `/books/${s}`,
    canon: `/canon/${s}`,
    download: `/downloads/${s}`,
    short: `/shorts/${s}`,
    print: `/prints/${s}`,
    strategy: `/strategy/${s}`,
    resource: `/resources/${s}`,
  };
  return map[k] || `/content/${s}`;
}

// --- COVER IMAGE RESOLUTION ---
export function resolveDocCoverImage(doc: ContentDoc | any): string | null {
  if (!doc) return null;
  
  if (doc.coverImage && typeof doc.coverImage === 'string') return doc.coverImage;
  if (doc.featuredImage && typeof doc.featuredImage === 'string') return doc.featuredImage;
  
  const slug = slugOf(doc);
  if (slug) {
    return `/images/covers/${slug}.jpg`;
  }
  
  return null;
}

// --- ACCESS & STATUS ---
export function isPublished(doc: ContentDoc | any): boolean {
  if (!doc) return false;
  return doc.published !== false && doc.draft !== true;
}

export const isDraftContent = (doc: ContentDoc | any): boolean => {
  if (!doc) return false;
  return doc.draft === true || doc.published === false;
};

export const isDraft = isDraftContent;

export function getAccessLevel(doc: ContentDoc | any): string {
  return String(doc?.accessLevel || doc?.tier || "public").trim().toLowerCase();
}

// --- DOWNLOAD URL RESOLUTION ---
export function resolveDocDownloadUrl(doc: ContentDoc | any): string | null {
  if (!doc) return null;
  
  if (doc.downloadUrl && typeof doc.downloadUrl === 'string') {
    return doc.downloadUrl.startsWith('/') ? doc.downloadUrl : `/${doc.downloadUrl}`;
  }
  
  if (doc.fileUrl && typeof doc.fileUrl === 'string') {
    return doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`;
  }
  
  const sourcePath = doc?._raw?.sourceFilePath;
  if (sourcePath && typeof sourcePath === 'string') {
    const normalizedPath = sourcePath.replace(/\\/g, '/');
    
    if (normalizedPath.includes('/public/')) {
      const publicIndex = normalizedPath.indexOf('/public/') + 8;
      return `/${normalizedPath.substring(publicIndex)}`;
    }
    
    const slug = slugOf(doc);
    const kind = getDocKind(doc);
    
    if (kind === 'download') {
      return `/downloads/${slug}${getFileExtension(sourcePath)}`;
    }
    
    return `/${kind}/${slug}`;
  }
  
  const slug = slugOf(doc);
  if (slug) {
    const kind = getDocKind(doc);
    
    if (kind === 'download' || doc.fileFormat) {
      const extension = doc.fileFormat ? `.${doc.fileFormat.toLowerCase()}` : '.pdf';
      return `/downloads/${slug}${extension}`;
    }
    
    return `/${kind}/${slug}`;
  }
  
  return null;
}

function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([a-zA-Z0-9]+)$/);
  return match ? `.${match[1].toLowerCase()}` : '';
}

// --- DATA CONSTANTS ---
export const allDocuments = DATA.allDocuments;
export const allPosts = DATA.allPosts;
export const allBooks = DATA.allBooks;
export const allCanons = DATA.allCanons;
export const allDownloads = DATA.allDownloads;
export const allShorts = DATA.allShorts;
export const allEvents = DATA.allEvents;
export const allPrints = DATA.allPrints;
export const allResources = DATA.allResources;
export const allStrategies = DATA.allStrategies;

// --- GETTER FUNCTIONS ---
export const getAllPosts = () => DATA.allPosts;
export const getAllBooks = () => DATA.allBooks;
export const getAllCanons = () => DATA.allCanons;
export const getAllDownloads = () => DATA.allDownloads;
export const getAllShorts = () => DATA.allShorts;
export const getAllEvents = () => DATA.allEvents;
export const getAllPrints = () => DATA.allPrints;
export const getAllResources = () => DATA.allResources;
export const getAllStrategies = () => DATA.allStrategies;
export const getAllDocuments = () => DATA.allDocuments;

export function getPublishedDocuments(docs: ContentDoc[] = DATA.allDocuments): ContentDoc[] {
  return docs.filter((doc) => !isDraftContent(doc));
}

// --- SERVER-SIDE GETTERS ---
export function getServerAllPosts() { return DATA.allPosts; }
export function getServerPostBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allPosts.find(p => normalizeSlug(p.slug || p._raw?.flattenedPath) === s) || null;
}

export function getServerAllBooks() { return DATA.allBooks; }
export function getServerBookBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allBooks.find(b => normalizeSlug(b.slug) === s) || null;
}

export function getServerAllCanons() { return DATA.allCanons; }
export function getServerCanonBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allCanons.find(c => normalizeSlug(c.slug) === s) || null;
}

export function getServerAllDownloads() { return DATA.allDownloads; }
export function getServerDownloadBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allDownloads.find(d => normalizeSlug(d.slug) === s) || null;
}

export function getServerAllEvents() { return DATA.allEvents; }
export function getServerEventBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allEvents.find(e => normalizeSlug(e.slug) === s) || null;
}

export function getServerAllShorts() { return DATA.allShorts; }
export function getServerShortBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allShorts.find(s_ => normalizeSlug(s_.slug) === s) || null;
}

export function getServerAllResources() { return DATA.allResources; }
export function getServerResourceBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allResources.find(r => normalizeSlug(r.slug) === s) || null;
}

export function getServerAllStrategies() { return DATA.allStrategies; }
export function getServerStrategyBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allStrategies.find(st => normalizeSlug(st.slug) === s) || null;
}

export function getServerAllPrints() { return DATA.allPrints; }
export function getServerPrintBySlug(slug: string) {
  const s = normalizeSlug(slug);
  return DATA.allPrints.find(p => normalizeSlug(p.slug) === s) || null;
}

export const getDownloadBySlug = getServerDownloadBySlug;

export function getDocumentBySlug(kind: DocKind, slug: string): ContentDoc | null {
  const normalizedSlug = normalizeSlug(slug);
  
  switch (kind) {
    case 'post':
      return getServerPostBySlug(normalizedSlug);
    case 'book':
      return getServerBookBySlug(normalizedSlug);
    case 'canon':
      return getServerCanonBySlug(normalizedSlug);
    case 'download':
      return getServerDownloadBySlug(normalizedSlug);
    case 'event':
      return getServerEventBySlug(normalizedSlug);
    case 'short':
      return getServerShortBySlug(normalizedSlug);
    case 'resource':
      return getServerResourceBySlug(normalizedSlug);
    case 'strategy':
      return getServerStrategyBySlug(normalizedSlug);
    case 'print':
      return getServerPrintBySlug(normalizedSlug);
    default:
      return DATA.allDocuments.find(doc => normalizeSlug(doc.slug) === normalizedSlug) || null;
  }
}

// --- UTILITIES ---
export function sanitizeData<T>(input: T): T {
  if (input === null || input === undefined) return null as any;
  return JSON.parse(JSON.stringify(input, (_, v) => (v === undefined ? null : v)));
}

export function toUiDoc(doc: ContentDoc): StrictContentDoc {
  return toStrictContentDoc(doc);
}

// Card props generator - accepts both types, returns consistent output
export function getCardProps(doc: ContentDoc) {
  const strictDoc = toStrictContentDoc(doc);
  
  return {
    title: strictDoc.title,
    description: strictDoc.description || strictDoc.excerpt || '',
    href: getDocHref(strictDoc),
    coverImage: resolveDocCoverImage(strictDoc),
    date: strictDoc.date,
    updated: strictDoc.updated,
    author: strictDoc.author,
    tags: strictDoc.tags || [],
    category: strictDoc.category,
    kind: getDocKind(strictDoc),
    featured: strictDoc.featured || false,
    readTime: strictDoc.readTime,
    downloadUrl: strictDoc.downloadUrl || strictDoc.fileUrl || null,
    fileSize: strictDoc.fileSize,
    fileFormat: strictDoc.fileFormat,
  };
}

// --- VIEW TRACKING ---
export async function recordContentView(slug: string, userId?: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[View Tracking] ${slug} viewed by ${userId || 'anonymous'}`);
  }
}

// --- DOWNLOAD ACCESS VALIDATION ---
export async function validateDownloadAccess(params: {
  userTier: string;
  requiredTier: string;
  slug: string;
  userId?: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const tierOrder = {
    'free': 0,
    'inner-circle': 1,
    'inner-circle-plus': 2,
    'inner-circle-elite': 3
  };
  
  const userLevel = tierOrder[params.userTier as keyof typeof tierOrder] || 0;
  const requiredLevel = tierOrder[params.requiredTier as keyof typeof tierOrder] || 0;
  
  if (userLevel >= requiredLevel) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Requires ${params.requiredTier} tier, you have ${params.userTier}`
  };
}

// --- ASYNC VERSIONS ---
export async function getContentlayerDataAsync(): Promise<GeneratedShape> {
  return DATA;
}

export async function getPublishedDocumentsAsync(): Promise<ContentDoc[]> {
  return getPublishedDocuments();
}

export async function getDocBySlugAsync(slug: string): Promise<ContentDoc | null> {
  return DATA.allDocuments.find(doc => normalizeSlug(doc.slug) === normalizeSlug(slug)) || null;
}

export async function getServerAllBooksAsync() { return DATA.allBooks; }
export async function getServerAllCanonsAsync() { return DATA.allCanons; }
export async function getServerAllDownloadsAsync() { return DATA.allDownloads; }
export async function getServerAllShortsAsync() { return DATA.allShorts; }

// Client-side fallback data for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && DATA.allDocuments.length === 0) {
  DATA = {
    ...FALLBACK,
    allDocuments: [
      {
        _id: 'dev_client_fallback',
        title: 'Development Mode - Content Loading',
        slug: 'development-fallback',
        description: 'Contentlayer data is being loaded on the server side.',
        _raw: {
          sourceFilePath: '',
          sourceFileName: 'dev-fallback.mdx',
          sourceFileDir: 'dev',
          contentType: 'document',
          flattenedPath: 'dev/fallback',
        },
        body: { raw: 'This is placeholder content for development mode.' }
      }
    ]
  };
}

// Default API export
const contentlayerCompatApi = {
  // Data constants
  allPosts, allBooks, allCanons, allDownloads, allShorts, allEvents, allPrints, allResources, allStrategies, allDocuments,
  
  // Getter functions
  getAllPosts, getAllBooks, getAllCanons, getAllDownloads, getAllShorts, getAllEvents, getAllPrints, getAllResources, getAllStrategies, getAllDocuments,
  getDocumentBySlug, getServerPostBySlug, getServerBookBySlug, getServerCanonBySlug, 
  getServerDownloadBySlug, getServerShortBySlug, getServerResourceBySlug, getServerStrategyBySlug, getServerPrintBySlug,
  getServerEventBySlug, getDownloadBySlug,
  
  // Utility functions
  resolveDocDownloadUrl, resolveDocCoverImage, getPublishedDocuments, getCardProps,
  isPublished, isDraftContent, isDraft,
  sanitizeData, normalizeSlug, getDocKind, getDocHref, toUiDoc, toStrictContentDoc, isStrictContentDoc, isContentlayerLoaded,
  getAccessLevel,
  
  // View tracking and validation
  recordContentView, validateDownloadAccess,
  
  // Core
  getContentlayerData, assertContentlayerHasDocs,
  
  // Async functions
  getContentlayerDataAsync, getPublishedDocumentsAsync, getDocBySlugAsync,
  getServerAllBooksAsync, getServerAllCanonsAsync, getServerAllDownloadsAsync, getServerAllShortsAsync
};

export default contentlayerCompatApi;
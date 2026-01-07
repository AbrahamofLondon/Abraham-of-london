// lib/contentlayer-compat.ts
/**
 * ContentLayer 2 Compatibility Layer - Pure ESM
 * No require() - only ES imports
 */

// Import directly from generated - Next.js will handle this
import * as generatedData from '@/.contentlayer/generated';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DocBase {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title: string;
  slug?: string;
  slugComputed: string;
  href?: string;
  hrefComputed: string;
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
  body: {
    raw: string;
    code: string;
  };
}

// Extract data with fallbacks
const data = generatedData || {
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

// ============================================================================
// CORE EXPORT FUNCTIONS
// ============================================================================

export function getContentlayerData(): DocBase[] {
  return (data as any).allDocuments || [];
}

export function getDocHref(doc: DocBase | any): string {
  if (!doc) return '/';
  return doc.hrefComputed || doc.href || `/${doc.slugComputed || doc.slug || ''}`;
}

export function normalizeSlug(slug: string): string {
  return slug?.replace(/^\/|\/$/g, '').trim() || '';
}

export function getAccessLevel(doc: DocBase | any): string {
  return doc?.accessLevel || doc?.tier || 'public';
}

// ============================================================================
// DRAFT & PUBLISH STATUS
// ============================================================================

export function isDraft(doc: DocBase | any): boolean {
  return doc?.draft === true;
}

export function isDraftContent(doc: DocBase | any): boolean {
  return isDraft(doc);
}

export function isPublished(doc: DocBase | any): boolean {
  return !isDraft(doc) && doc?.published !== false;
}

// ============================================================================
// COLLECTION GETTERS
// ============================================================================

export function getAllContentlayerDocs(): DocBase[] {
  return (data as any).allDocuments || [];
}

export function getAllPosts(): DocBase[] {
  return (data as any).allPosts || [];
}

export function getAllBooks(): DocBase[] {
  return (data as any).allBooks || [];
}

export function getAllCanons(): DocBase[] {
  return (data as any).allCanons || [];
}

export function getAllDownloads(): DocBase[] {
  return (data as any).allDownloads || [];
}

export function getAllShorts(): DocBase[] {
  return (data as any).allShorts || [];
}

export function getAllEvents(): DocBase[] {
  return (data as any).allEvents || [];
}

export function getAllPrints(): DocBase[] {
  return (data as any).allPrints || [];
}

export function getAllResources(): DocBase[] {
  return (data as any).allResources || [];
}

export function getAllStrategies(): DocBase[] {
  return (data as any).allStrategies || [];
}

// ============================================================================
// FILTERING & QUERYING
// ============================================================================

export function getPublishedDocuments(docs?: DocBase[]): DocBase[] {
  const source = docs || getAllContentlayerDocs();
  return source.filter(doc => isPublished(doc));
}

export function getDocBySlug(slug: string, collection?: DocBase[]): DocBase | null {
  const normalizedSlug = normalizeSlug(slug);
  const docs = collection || getAllContentlayerDocs();
  
  return docs.find(doc => 
    normalizeSlug(doc.slugComputed || doc.slug || '') === normalizedSlug ||
    normalizeSlug(doc._raw?.flattenedPath || '') === normalizedSlug
  ) || null;
}

// ============================================================================
// SERVER-SIDE GETTERS
// ============================================================================

export function getServerAllPosts(): DocBase[] {
  return getPublishedDocuments(getAllPosts());
}

export function getServerPostBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllPosts());
}

export function getServerAllBooks(): DocBase[] {
  return getPublishedDocuments(getAllBooks());
}

export function getServerBookBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllBooks());
}

export function getServerAllCanons(): DocBase[] {
  return getPublishedDocuments(getAllCanons());
}

export function getServerCanonBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllCanons());
}

export function getServerAllDownloads(): DocBase[] {
  return getPublishedDocuments(getAllDownloads());
}

export function getServerDownloadBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllDownloads());
}

export function getDownloadBySlug(slug: string): DocBase | null {
  return getServerDownloadBySlug(slug);
}

export function getServerAllShorts(): DocBase[] {
  return getPublishedDocuments(getAllShorts());
}

export function getServerShortBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllShorts());
}

export function getServerAllEvents(): DocBase[] {
  return getPublishedDocuments(getAllEvents());
}

export function getServerEventBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllEvents());
}

export function getServerAllPrints(): DocBase[] {
  return getPublishedDocuments(getAllPrints());
}

export function getServerPrintBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllPrints());
}

export function getServerAllResources(): DocBase[] {
  return getPublishedDocuments(getAllResources());
}

export function getServerResourceBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllResources());
}

export function getServerAllStrategies(): DocBase[] {
  return getPublishedDocuments(getAllStrategies());
}

export function getServerStrategyBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllStrategies());
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getDocKind(doc: DocBase | any): string {
  return doc?.type || 'unknown';
}

export function resolveDocCoverImage(doc: DocBase | any): string | null {
  return doc?.coverImage || doc?.featuredImage || null;
}

export function resolveDocDownloadUrl(doc: DocBase | any): string | null {
  return doc?.downloadUrl || doc?.fileUrl || doc?.downloadFile || null;
}

export function toUiDoc(doc: DocBase | any): any {
  return {
    ...doc,
    href: getDocHref(doc),
    slug: normalizeSlug(doc.slugComputed || doc.slug || ''),
    coverImage: resolveDocCoverImage(doc),
    downloadUrl: resolveDocDownloadUrl(doc),
  };
}

export function sanitizeData(data: any): any {
  if (!data) return data;
  
  const seen = new WeakSet();
  
  function sanitize(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular]';
    
    seen.add(obj);
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    const sanitized: any = {};
    for (const key in obj) {
      if (key.startsWith('_') && key !== '_id' && key !== '_raw') continue;
      sanitized[key] = sanitize(obj[key]);
    }
    
    return sanitized;
  }
  
  return sanitize(data);
}

export async function recordContentView(slug: string, type?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    console.log(`Content view: ${type || 'unknown'}/${slug}`);
  }
}

export function assertContentlayerHasDocs(): boolean {
  const docs = getAllContentlayerDocs();
  if (docs.length === 0) {
    console.warn('⚠ No ContentLayer documents found');
    return false;
  }
  return true;
}

// ============================================================================
// DIRECT RE-EXPORTS (for @/lib/contentlayer imports)
// ============================================================================

export const allDocuments = (data as any).allDocuments || [];
export const allPosts = (data as any).allPosts || [];
export const allBooks = (data as any).allBooks || [];
export const allCanons = (data as any).allCanons || [];
export const allDownloads = (data as any).allDownloads || [];
export const allShorts = (data as any).allShorts || [];
export const allEvents = (data as any).allEvents || [];
export const allPrints = (data as any).allPrints || [];
export const allResources = (data as any).allResources || [];
export const allStrategies = (data as any).allStrategies || [];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
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
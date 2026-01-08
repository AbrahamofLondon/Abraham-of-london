// lib/contentlayer-compat.ts - FIXED VERSION
/**
 * ContentLayer 2 Compatibility Layer - Pure ESM
 * No require() - only ES imports
 */

// ============================================================================
// CRITICAL FIX: Handle missing .contentlayer/generated directory
// ============================================================================

let generatedData: any = null;

// Try to import generated data with error handling
try {
  // Dynamic import to handle build-time errors
  generatedData = require('@/.contentlayer/generated');
} catch (error) {
  console.warn('[ContentLayer] Could not load @/.contentlayer/generated - using fallback data');
  generatedData = {
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
}

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

// ============================================================================
// DATA EXTRACTION WITH FALLBACKS
// ============================================================================

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
// CORE EXPORT FUNCTIONS - WITH FIXED TYPES
// ============================================================================

export function getContentlayerData(): {
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
} {
  return {
    allDocuments: data.allDocuments || [],
    allPosts: data.allPosts || [],
    allBooks: data.allBooks || [],
    allCanons: data.allCanons || [],
    allDownloads: data.allDownloads || [],
    allShorts: data.allShorts || [],
    allEvents: data.allEvents || [],
    allPrints: data.allPrints || [],
    allResources: data.allResources || [],
    allStrategies: data.allStrategies || [],
  };
}

export function getDocHref(doc: DocBase | any): string {
  if (!doc) return '/';
  return doc.hrefComputed || doc.href || `/${doc.slugComputed || doc.slug || ''}`;
}

export function normalizeSlug(slug: string): string {
  if (!slug) return '';
  return slug.replace(/^\/|\/$/g, '').trim();
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
// COLLECTION GETTERS WITH ERROR HANDLING
// ============================================================================

export function getAllContentlayerDocs(): DocBase[] {
  try {
    return data.allDocuments || [];
  } catch {
    return [];
  }
}

export function getAllPosts(): DocBase[] {
  try {
    return data.allPosts || [];
  } catch {
    return [];
  }
}

export function getAllBooks(): DocBase[] {
  try {
    return data.allBooks || [];
  } catch {
    return [];
  }
}

export function getAllCanons(): DocBase[] {
  try {
    return data.allCanons || [];
  } catch {
    return [];
  }
}

export function getAllDownloads(): DocBase[] {
  try {
    return data.allDownloads || [];
  } catch {
    return [];
  }
}

export function getAllShorts(): DocBase[] {
  try {
    return data.allShorts || [];
  } catch {
    return [];
  }
}

export function getAllEvents(): DocBase[] {
  try {
    return data.allEvents || [];
  } catch {
    return [];
  }
}

export function getAllPrints(): DocBase[] {
  try {
    return data.allPrints || [];
  } catch {
    return [];
  }
}

export function getAllResources(): DocBase[] {
  try {
    return data.allResources || [];
  } catch {
    return [];
  }
}

export function getAllStrategies(): DocBase[] {
  try {
    return data.allStrategies || [];
  } catch {
    return [];
  }
}

// ============================================================================
// FILTERING & QUERYING
// ============================================================================

export function getPublishedDocuments(docs?: DocBase[]): DocBase[] {
  try {
    const source = docs || getAllContentlayerDocs();
    return source.filter(doc => isPublished(doc));
  } catch {
    return [];
  }
}

export function getDocBySlug(slug: string, collection?: DocBase[]): DocBase | null {
  try {
    const normalizedSlug = normalizeSlug(slug);
    const docs = collection || getAllContentlayerDocs();
    
    return docs.find(doc => 
      normalizeSlug(doc.slugComputed || doc.slug || '') === normalizedSlug ||
      normalizeSlug(doc._raw?.flattenedPath || '') === normalizedSlug
    ) || null;
  } catch {
    return null;
  }
}

// ============================================================================
// SERVER-SIDE GETTERS (USED IN getStaticPaths/getStaticProps)
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
// UTILITY FUNCTIONS WITH ERROR HANDLING
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
  try {
    return {
      ...doc,
      href: getDocHref(doc),
      slug: normalizeSlug(doc.slugComputed || doc.slug || ''),
      coverImage: resolveDocCoverImage(doc),
      downloadUrl: resolveDocDownloadUrl(doc),
    };
  } catch {
    return doc;
  }
}

export function sanitizeData(data: any): any {
  if (!data) return data;
  
  try {
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
  } catch {
    return data;
  }
}

export async function recordContentView(slug: string, type?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    console.log(`Content view: ${type || 'unknown'}/${slug}`);
  }
}

export function assertContentlayerHasDocs(): boolean {
  try {
    const docs = getAllContentlayerDocs();
    if (docs.length === 0) {
      console.warn('⚠ No ContentLayer documents found');
      return false;
    }
    return true;
  } catch {
    console.warn('⚠ ContentLayer not available');
    return false;
  }
}

// ============================================================================
// DIRECT RE-EXPORTS (for @/lib/contentlayer imports)
// ============================================================================

export const allDocuments = data.allDocuments || [];
export const allPosts = data.allPosts || [];
export const allBooks = data.allBooks || [];
export const allCanons = data.allCanons || [];
export const allDownloads = data.allDownloads || [];
export const allShorts = data.allShorts || [];
export const allEvents = data.allEvents || [];
export const allPrints = data.allPrints || [];
export const allResources = data.allResources || [];
export const allStrategies = data.allStrategies || [];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Core functions
  getContentlayerData,
  getServerAllDownloads,
  getServerDownloadBySlug,
  sanitizeData,
  
  // Collection getters
  getAllContentlayerDocs,
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  
  // Direct data
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
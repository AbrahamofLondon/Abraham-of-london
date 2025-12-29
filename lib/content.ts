// lib/content.ts - FIXED COMPLETE VERSION
// Centralised content exports - Contentlayer-based

// ============================================
// CONTENTLAYER HELPER (main source)
// ============================================
import {
  // Document getters - rename to avoid conflicts
  getAllContentlayerDocs as getAllContentlayerDocsInternal,
  getPublishedDocuments as getPublishedDocumentsInternal,
  getFeaturedDocuments as getFeaturedDocumentsInternal,
  getFeaturedDocumentsByType as getFeaturedDocumentsByTypeInternal,
  getCardPropsForDocument as getCardPropsForDocumentInternal,
  getPublishedDocumentsByType as getPublishedDocumentsByTypeInternal,
  
  // Type-specific getters
  getPublishedPosts as getPublishedPostsInternal,
  getPostBySlug as getPostBySlugInternal,
  getAllBooks as getAllBooksInternal,
  getBookBySlug as getBookBySlugInternal,
  getAllDownloads as getAllDownloadsInternal,
  getDownloadBySlug as getDownloadBySlugInternal,
  getAllEvents as getAllEventsInternal,
  getEventBySlug as getEventBySlugInternal,
  getAllPrints as getAllPrintsInternal,
  getPrintBySlug as getPrintBySlugInternal,
  getAllResources as getAllResourcesInternal,
  getResourceBySlug as getResourceBySlugInternal,
  getAllStrategies as getAllStrategiesInternal,
  getStrategyBySlug as getStrategyBySlugInternal,
  getAllCanons as getAllCanonsInternal,
  getCanonBySlug as getCanonBySlugInternal,
  getPublishedShorts as getPublishedShortsInternal,
  getShortBySlug as getShortBySlugInternal,
  
  // Document kind detection
  getDocKind,
  
  // Types (keep these)
  type ContentDoc,
  type DocKind,
  type AccessLevel,
  
  // Draft/Publish helpers
  isDraftContent as isDraftContentInternal,
  isPublishedContent as isPublishedContentInternal,
  
  // Access control
  isPublic as isPublicInternal,
  getAccessLevel as getAccessLevelInternal,
} from "./contentlayer-helper";

// ============================================
// TYPE DEFINITIONS
// ============================================
// Re-export types from contentlayer-helper
export type { ContentDoc, DocKind, AccessLevel };

// Define composite types for backward compatibility
export type AnyDoc = ContentDoc;
export type ContentlayerCardProps = ReturnType<typeof getCardPropsForDocumentInternal>;

// Type aliases for specific document types
export type PostType = ContentDoc;
export type BookType = ContentDoc;
export type DownloadType = ContentDoc;
export type EventType = ContentDoc;
export type PrintType = ContentDoc;
export type ResourceType = ContentDoc;
export type StrategyType = ContentDoc;
export type CanonType = ContentDoc;
export type ShortType = ContentDoc;

// ============================================
// TYPE GUARDS
// ============================================
// Create type guards based on getDocKind
export const isPost = (doc: ContentDoc): boolean => getDocKind(doc) === "post";
export const isDownload = (doc: ContentDoc): boolean => getDocKind(doc) === "download";
export const isBook = (doc: ContentDoc): boolean => getDocKind(doc) === "book";
export const isEvent = (doc: ContentDoc): boolean => getDocKind(doc) === "event";
export const isPrint = (doc: ContentDoc): boolean => getDocKind(doc) === "print";
export const isResource = (doc: ContentDoc): boolean => getDocKind(doc) === "resource";
export const isStrategy = (doc: ContentDoc): boolean => getDocKind(doc) === "strategy";
export const isCanon = (doc: ContentDoc): boolean => getDocKind(doc) === "canon";
export const isShort = (doc: ContentDoc): boolean => getDocKind(doc) === "short";

// Draft/Publish type guards
export const isDraft = isDraftContentInternal;
export const isPublished = isPublishedContentInternal;

// Access control type guards
export const isPublic = isPublicInternal;

// Contentlayer loaded check
export const isContentlayerLoaded = (): boolean => {
  try {
    const docs = getAllContentlayerDocsInternal();
    return Array.isArray(docs) && docs.length > 0;
  } catch {
    return false;
  }
};

// ============================================
// SAFE FUNCTION WRAPPERS
// ============================================
// Wrap internal functions with safe guards to prevent runtime errors
// if Contentlayer data isn't available

export const getPublishedPosts = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const posts = getPublishedPostsInternal();
  return limit ? posts.slice(0, limit) : posts;
};

export const getPostBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getPostBySlugInternal(slug);
};

export const getAllBooks = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const books = getAllBooksInternal();
  return limit ? books.slice(0, limit) : books;
};

export const getBookBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getBookBySlugInternal(slug);
};

export const getAllDownloads = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const downloads = getAllDownloadsInternal();
  return limit ? downloads.slice(0, limit) : downloads;
};

export const getDownloadBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getDownloadBySlugInternal(slug);
};

export const getAllEvents = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const events = getAllEventsInternal();
  return limit ? events.slice(0, limit) : events;
};

export const getEventBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getEventBySlugInternal(slug);
};

export const getAllPrints = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const prints = getAllPrintsInternal();
  return limit ? prints.slice(0, limit) : prints;
};

export const getPrintBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getPrintBySlugInternal(slug);
};

export const getAllResources = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const resources = getAllResourcesInternal();
  return limit ? resources.slice(0, limit) : resources;
};

export const getResourceBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getResourceBySlugInternal(slug);
};

export const getAllStrategies = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const strategies = getAllStrategiesInternal();
  return limit ? strategies.slice(0, limit) : strategies;
};

export const getStrategyBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getStrategyBySlugInternal(slug);
};

export const getAllCanons = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const canons = getAllCanonsInternal();
  return limit ? canons.slice(0, limit) : canons;
};

export const getCanonBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getCanonBySlugInternal(slug);
};

export const getPublishedShorts = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const shorts = getPublishedShortsInternal();
  return limit ? shorts.slice(0, limit) : shorts;
};

export const getShortBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getShortBySlugInternal(slug);
};

// ============================================
// CONTENT AGGREGATION
// ============================================
export const getAllDocuments = (): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  return getAllContentlayerDocsInternal();
};

export const getPublishedDocuments = (): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  return getPublishedDocumentsInternal();
};

export const getFeaturedDocuments = (limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const featured = getFeaturedDocumentsInternal();
  return limit ? featured.slice(0, limit) : featured;
};

export const getFeaturedDocumentsByType = (type: string, limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const featured = getFeaturedDocumentsByTypeInternal(type);
  return limit ? featured.slice(0, limit) : featured;
};

// Get document by slug across all types
export const getDocumentBySlug = (slug: string): ContentDoc | null => {
  if (!isContentlayerLoaded()) return null;
  
  // Try each document type
  const checks = [
    () => getPostBySlug(slug),
    () => getBookBySlug(slug),
    () => getDownloadBySlug(slug),
    () => getEventBySlug(slug),
    () => getPrintBySlug(slug),
    () => getResourceBySlug(slug),
    () => getStrategyBySlug(slug),
    () => getCanonBySlug(slug),
    () => getShortBySlug(slug),
  ];
  
  for (const check of checks) {
    const doc = check();
    if (doc) return doc;
  }
  
  return null;
};

export const getCardPropsForDocument = (doc: ContentDoc): ContentlayerCardProps => {
  return getCardPropsForDocumentInternal(doc);
};

export const getPublishedDocumentsByType = (kind: DocKind, limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const docs = getPublishedDocumentsByTypeInternal(kind);
  return limit ? docs.slice(0, limit) : docs;
};

// ============================================
// CONTENT FILTERING
// ============================================
export const filterDocumentsByTag = (tag: string, docs?: ContentDoc[]): ContentDoc[] => {
  const documents = docs || getPublishedDocuments();
  return documents.filter(doc => 
    Array.isArray(doc.tags) && 
    doc.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
  );
};

export const getDocumentsByDateRange = (
  startDate: Date,
  endDate: Date,
  docs?: ContentDoc[]
): ContentDoc[] => {
  const documents = docs || getPublishedDocuments();
  return documents.filter(doc => {
    if (!doc.date) return false;
    const docDate = new Date(doc.date);
    return docDate >= startDate && docDate <= endDate;
  });
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
export const getUniqueTags = (docs?: ContentDoc[]): string[] => {
  const documents = docs || getPublishedDocuments();
  const tagSet = new Set<string>();
  
  documents.forEach(doc => {
    if (Array.isArray(doc.tags)) {
      doc.tags.forEach((tag: string) => {
        tagSet.add(tag.toLowerCase());
      });
    }
  });
  
  return Array.from(tagSet).sort();
};

export const getRecentDocuments = (limit: number = 10, kind?: DocKind): ContentDoc[] => {
  let documents = getPublishedDocuments();
  
  if (kind) {
    documents = documents.filter(doc => getDocKind(doc) === kind);
  }
  
  return documents
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
};

// ============================================
// ALIASES FOR BACKWARD COMPATIBILITY
// ============================================
export const getRecentShorts = getPublishedShorts;
export const getRecentPosts = getPublishedPosts;
export const getRecentBooks = getAllBooks;
export const getRecentDownloads = getAllDownloads;
export const getRecentEvents = getAllEvents;
export const getRecentPrints = getAllPrints;
export const getRecentResources = getAllResources;
export const getRecentStrategies = getAllStrategies;
export const getRecentCanons = getAllCanons;

// ============================================
// SITEMAP GENERATION HELPERS
// ============================================
export const getDocumentsForSitemap = (): Array<{
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}> => {
  if (!isContentlayerLoaded()) return [];
  
  return getPublishedDocuments().map(doc => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const href = getCardPropsForDocument(doc).href;
    
    // Helper function to convert date to ISO string
    const dateToISO = (date: string | Date | null | undefined): string | undefined => {
      if (!date) return undefined;
      
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString();
        }
      } catch {
        // If parsing fails, return undefined
      }
      
      return undefined;
    };
    
    return {
      url: `${baseUrl}${href}`,
      lastModified: dateToISO(doc.date),
      changeFrequency: 'weekly' as const,
      priority: doc.featured ? 0.8 : 0.5,
    };
  });
};

// ============================================
// RSS FEED GENERATION HELPERS
// ============================================
export const getDocumentsForRSS = (limit: number = 20): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  
  return getPublishedDocuments()
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
};

// ============================================
// SEARCH INDEXING HELPERS
// ============================================
export const getDocumentsForSearchIndex = (): Array<{
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  description?: string;
  url: string;
  tags: string[];
  date?: string;
  type: DocKind;
}> => {
  if (!isContentlayerLoaded()) return [];
  
  return getPublishedDocuments().map(doc => {
    const cardProps = getCardPropsForDocument(doc);
    
    // Safely extract body content if it exists
    const bodyContent = doc.body && typeof doc.body === 'object' && 'raw' in doc.body
      ? (doc.body as { raw?: string }).raw || ''
      : '';
    
    const content = [
      doc.title,
      doc.excerpt || '',
      doc.description || '',
      Array.isArray(doc.tags) ? doc.tags.join(' ') : '',
      bodyContent,
    ].join(' ').trim();
    
    // Helper to convert date to ISO string
    const dateToISO = (date: string | Date | null | undefined): string | undefined => {
      if (!date) return undefined;
      
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toISOString();
        }
      } catch {
        // If parsing fails, return undefined
      }
      
      return undefined;
    };
    
    return {
      id: doc.slug || `doc-${Math.random().toString(36).substr(2, 9)}`,
      title: doc.title || 'Untitled',
      content,
      excerpt: doc.excerpt || undefined,
      description: doc.description || undefined,
      url: cardProps.href,
      tags: Array.isArray(doc.tags) ? doc.tags.map(tag => String(tag)) : [],
      date: dateToISO(doc.date),
      type: getDocKind(doc),
    };
  });
};

// ============================================
// BUILD VALIDATION
// ============================================
export const validateContentlayerBuild = (): { isValid: boolean; errors: string[] } => {
  if (!isContentlayerLoaded()) {
    return {
      isValid: false,
      errors: ['Contentlayer is not loaded'],
    };
  }
  
  const errors: string[] = [];
  const allDocs = getAllDocuments();
  
  if (allDocs.length === 0) {
    errors.push('No documents found in Contentlayer');
  }
  
  // Check for required fields
  allDocs.forEach(doc => {
    if (!doc.title) {
      errors.push(`Document ${doc.slug || 'unknown'} is missing title`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
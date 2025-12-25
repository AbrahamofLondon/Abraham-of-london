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
  getDocumentBySlug as getDocumentBySlugInternal,
  getCardPropsForDocument as getCardPropsForDocumentInternal,
  getPublishedDocumentsByType as getPublishedDocumentsByTypeInternal,
  
  // Type-specific getters
  getPublishedPosts as getPublishedPostsInternal,
  getPostBySlug as getPostBySlugInternal,
  getAllBooks as getAllBooksInternal,
  getAllDownloads as getAllDownloadsInternal,
  getAllEvents as getAllEventsInternal,
  getAllPrints as getAllPrintsInternal,
  getAllResources as getAllResourcesInternal,
  getAllStrategies as getAllStrategiesInternal,
  getAllCanons as getAllCanonsInternal,
  getPublishedShorts as getPublishedShortsInternal,
  getShortBySlug as getShortBySlugInternal,
  
  // Types (keep these)
  type AnyDoc,
  type DocKind,
  type ContentlayerCardProps,
  type PostType,
  type BookType,
  type DownloadType,
  type EventType,
  type PrintType,
  type ResourceType,
  type StrategyType,
  type CanonType,
  type ShortType,
  
  // Type guards (import them from contentlayer-helper)
  isPost,
  isDownload,
  isBook,
  isEvent,
  isPrint,
  isResource,
  isCanon,
  isShort,
  isStrategy,
  isDraft,
  isPublished,
  isContentlayerLoaded,
} from "./contentlayer-helper";

// ============================================
// SAFE FUNCTION WRAPPERS
// ============================================
// Wrap internal functions with safe guards to prevent runtime errors
// if Contentlayer data isn't available

export const getPublishedPosts = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const posts = getPublishedPostsInternal();
  return limit ? posts.slice(0, limit) : posts;
};

export const getPostBySlug = (slug: string): PostType | null => {
  if (!isContentlayerLoaded()) return null;
  return getPostBySlugInternal(slug);
};

export const getAllBooks = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const books = getAllBooksInternal();
  return limit ? books.slice(0, limit) : books;
};

export const getAllDownloads = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const downloads = getAllDownloadsInternal();
  return limit ? downloads.slice(0, limit) : downloads;
};

export const getAllEvents = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const events = getAllEventsInternal();
  return limit ? events.slice(0, limit) : events;
};

export const getAllPrints = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const prints = getAllPrintsInternal();
  return limit ? prints.slice(0, limit) : prints;
};

export const getAllResources = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const resources = getAllResourcesInternal();
  return limit ? resources.slice(0, limit) : resources;
};

export const getAllStrategies = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const strategies = getAllStrategiesInternal();
  return limit ? strategies.slice(0, limit) : strategies;
};

export const getAllCanons = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const canons = getAllCanonsInternal();
  return limit ? canons.slice(0, limit) : canons;
};

export const getPublishedShorts = (limit?: number) => {
  if (!isContentlayerLoaded()) return [];
  const shorts = getPublishedShortsInternal();
  return limit ? shorts.slice(0, limit) : shorts;
};

export const getShortBySlug = (slug: string): ShortType | null => {
  if (!isContentlayerLoaded()) return null;
  return getShortBySlugInternal(slug);
};

// ============================================
// CONTENT AGGREGATION
// ============================================
export const getAllDocuments = (): AnyDoc[] => {
  if (!isContentlayerLoaded()) return [];
  return getAllContentlayerDocsInternal();
};

export const getPublishedDocuments = (): AnyDoc[] => {
  if (!isContentlayerLoaded()) return [];
  return getPublishedDocumentsInternal();
};

export const getFeaturedDocuments = (limit?: number): AnyDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const featured = getFeaturedDocumentsInternal();
  return limit ? featured.slice(0, limit) : featured;
};

export const getDocumentBySlug = (slug: string): AnyDoc | null => {
  if (!isContentlayerLoaded()) return null;
  return getDocumentBySlugInternal(slug);
};

export const getCardPropsForDocument = (doc: AnyDoc): ContentlayerCardProps => {
  return getCardPropsForDocumentInternal(doc);
};

export const getPublishedDocumentsByType = (kind: DocKind, limit?: number): AnyDoc[] => {
  if (!isContentlayerLoaded()) return [];
  const docs = getPublishedDocumentsByTypeInternal(kind);
  return limit ? docs.slice(0, limit) : docs;
};

// ============================================
// CONTENT TYPE PREDICATES
// ============================================
// Export the imported type guards
export {
  isPost,
  isDownload,
  isBook,
  isEvent,
  isPrint,
  isResource,
  isCanon,
  isShort,
  isStrategy,
  isDraft,
  isPublished,
  isContentlayerLoaded,
};

// ============================================
// TYPE EXPORTS
// ============================================
export type {
  AnyDoc,
  DocKind,
  ContentlayerCardProps,
  PostType,
  BookType,
  DownloadType,
  EventType,
  PrintType,
  ResourceType,
  StrategyType,
  CanonType,
  ShortType,
};

// ============================================
// CONTENT FILTERING
// ============================================
export const filterDocumentsByTag = (tag: string, docs?: AnyDoc[]): AnyDoc[] => {
  const documents = docs || getPublishedDocuments();
  return documents.filter(doc => 
    Array.isArray(doc.tags) && 
    doc.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase())
  );
};

export const getDocumentsByDateRange = (
  startDate: Date,
  endDate: Date,
  docs?: AnyDoc[]
): AnyDoc[] => {
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
export const getUniqueTags = (docs?: AnyDoc[]): string[] => {
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

export const getRecentDocuments = (limit: number = 10, kind?: DocKind): AnyDoc[] => {
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

// Helper to get doc kind (imported or fallback)
const getDocKind = (doc: AnyDoc): DocKind => {
  // This should be imported from contentlayer-helper, but we'll define a fallback
  if (isPost(doc)) return "post";
  if (isDownload(doc)) return "download";
  if (isBook(doc)) return "book";
  if (isEvent(doc)) return "event";
  if (isPrint(doc)) return "print";
  if (isResource(doc)) return "resource";
  if (isStrategy(doc)) return "strategy";
  if (isCanon(doc)) return "canon";
  if (isShort(doc)) return "short";
  return "unknown";
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
    const kind = getDocKind(doc);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const href = getCardPropsForDocument(doc).href;
    
    return {
      url: `${baseUrl}${href}`,
      lastModified: doc.date || undefined,
      changeFrequency: 'weekly',
      priority: doc.featured ? 0.8 : 0.5,
    };
  });
};

// ============================================
// RSS FEED GENERATION HELPERS
// ============================================
export const getDocumentsForRSS = (limit: number = 20): AnyDoc[] => {
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
    
    return {
      id: doc._id || doc.slug,
      title: doc.title || 'Untitled',
      content,
      excerpt: doc.excerpt || undefined,
      description: doc.description || undefined,
      url: cardProps.href,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      date: doc.date || undefined,
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
      errors.push(`Document ${doc.slug || doc._id} is missing title`);
    }
    if (!doc.slug && !doc._raw?.flattenedPath) {
      errors.push(`Document ${doc._id} is missing slug and flattenedPath`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
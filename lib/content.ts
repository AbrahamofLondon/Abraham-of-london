// Centralised content exports - Contentlayer-based Adapter
// Adapts the Enterprise Helper v5.0.0 to the application's legacy API surface

import ContentHelper, {
  // Types
  type ContentDoc,
  type DocKind,
  
  // Core Functions
  getAllDocuments, // This returns published docs in v5.0.0
  getDocumentBySlug,
  getCardProps,
  getDocKind,
  
  // Specific Getters (These return published docs in v5.0.0)
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  getAllCanons,
  getAllShorts,
} from "@/lib/contentlayer-helper";

// ============================================
// TYPE DEFINITIONS
// ============================================

// Re-export types from the source of truth to prevent mismatches
export type { ContentDoc, DocKind };
export type AccessLevel = 'public' | 'private' | 'restricted';

// Backward compatibility types
export type AnyDoc = ContentDoc;
export type ContentlayerCardProps = ReturnType<typeof getCardProps>;

// ============================================
// LOCAL UTILITIES (Re-implemented for safety)
// ============================================

export const isDraft = (doc: ContentDoc): boolean => {
  return doc.draft === true || doc.draft === "true";
};

export const isPublic = (doc: ContentDoc): boolean => {
  return !doc.accessLevel || doc.accessLevel === 'public';
};

export const isContentlayerLoaded = (): boolean => {
  try {
    const docs = getAllDocuments();
    return Array.isArray(docs) && docs.length > 0;
  } catch {
    return false;
  }
};

// ============================================
// TYPE GUARDS
// ============================================

export const isPost = (doc: ContentDoc): boolean => getDocKind(doc) === "post";
export const isBook = (doc: ContentDoc): boolean => getDocKind(doc) === "book";
export const isDownload = (doc: ContentDoc): boolean => getDocKind(doc) === "download";
export const isEvent = (doc: ContentDoc): boolean => getDocKind(doc) === "event";
export const isCanon = (doc: ContentDoc): boolean => getDocKind(doc) === "canon";
export const isShort = (doc: ContentDoc): boolean => getDocKind(doc) === "short";

// ============================================
// DOCUMENT GETTERS (Mapped to v5.0.0 Helper)
// ============================================

// General
export const getPublishedDocuments = (): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  return getAllDocuments(); // v5.0.0 getAllDocuments already filters published
};

export const getAllContentlayerDocs = getPublishedDocuments;

// Type-Specific (Mapping "getPublishedX" to "getAllX" from helper)
export const getPublishedPosts = (limit?: number) => {
  const docs = getAllPosts();
  return limit ? docs.slice(0, limit) : docs;
};

export const getPublishedShorts = (limit?: number) => {
  const docs = getAllShorts();
  return limit ? docs.slice(0, limit) : docs;
};

export const getRecentBooks = (limit?: number) => {
  const docs = getAllBooks();
  return limit ? docs.slice(0, limit) : docs;
};

// Passthroughs for getters that match name
export { 
  getAllBooks, 
  getAllDownloads, 
  getAllEvents, 
  getAllPrints, 
  getAllResources, 
  getAllStrategies, 
  getAllCanons 
};

// ============================================
// FEATURED CONTENT (Logic moved here)
// ============================================

export const getFeaturedDocuments = (kind?: DocKind, limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  
  let docs: ContentDoc[] = [];
  
  if (kind) {
    // Dynamically fetch based on kind using the Helper's aliases
    // or fallback to filtering all docs (slower but safer)
    const specificGetter = (ContentHelper as any)[`getAll${kind.charAt(0).toUpperCase() + kind.slice(1)}s`];
    if (typeof specificGetter === 'function') {
      docs = specificGetter();
    } else {
      docs = getAllDocuments().filter(d => getDocKind(d) === kind);
    }
  } else {
    docs = getAllDocuments();
  }

  const featured = docs.filter(doc => doc.featured === true);
  return limit ? featured.slice(0, limit) : featured;
};

export const getFeaturedDocumentsByType = (kind: DocKind, limit?: number): ContentDoc[] => {
  return getFeaturedDocuments(kind, limit);
};

// ============================================
// SLUG RESOLUTION
// ============================================

export { getDocumentBySlug }; // v5.0.0 helper exports a robust version of this

// Convenience wrappers for specific types
export const getPostBySlug = (slug: string) => ContentHelper.getDocumentBySlug('post', slug);
export const getBookBySlug = (slug: string) => ContentHelper.getDocumentBySlug('book', slug);
export const getDownloadBySlug = (slug: string) => ContentHelper.getDocumentBySlug('download', slug);
export const getEventBySlug = (slug: string) => ContentHelper.getDocumentBySlug('event', slug);
export const getPrintBySlug = (slug: string) => ContentHelper.getDocumentBySlug('print', slug);
export const getResourceBySlug = (slug: string) => ContentHelper.getDocumentBySlug('resource', slug);
export const getStrategyBySlug = (slug: string) => ContentHelper.getDocumentBySlug('strategy', slug);
export const getCanonBySlug = (slug: string) => ContentHelper.getDocumentBySlug('canon', slug);
export const getShortBySlug = (slug: string) => ContentHelper.getDocumentBySlug('short', slug);

// ============================================
// UI & DISPLAY
// ============================================

export const getCardPropsForDocument = (doc: ContentDoc): ContentlayerCardProps => {
  return getCardProps(doc);
};

// ============================================
// UTILITIES
// ============================================

export const getRecentDocuments = (limit: number = 10, kind?: DocKind): ContentDoc[] => {
  let documents = getPublishedDocuments();
  
  if (kind) {
    documents = documents.filter(doc => getDocKind(doc) === kind);
  }
  
  // v5.0.0 helper returns collections already sorted by date, but strictly ensuring here
  return documents
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, limit);
};

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

export const getDocumentsForSitemap = () => {
  return getPublishedDocuments().map(doc => {
    const card = getCardProps(doc);
    return {
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://abrahamoflondon.com'}${card.href}`,
      lastModified: doc.date,
      changeFrequency: 'weekly' as const,
      priority: doc.featured ? 0.8 : 0.5,
    };
  });
};
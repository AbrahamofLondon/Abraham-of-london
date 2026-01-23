// lib/content.ts - FIXED VERSION
import ContentHelper, {
  // Types
  type ContentDoc as CompatContentDoc,
  type StrictContentDoc,
  type DocKind,
  
  // Core Functions
  getAllDocuments as compatGetAllDocuments,
  getDocumentBySlug,
  getCardProps,
  getDocKind,
  getAccessLevel,
  toStrictContentDoc,
  
  // Specific Getters
  getAllPosts as compatGetAllPosts,
  getAllBooks as compatGetAllBooks,
  getAllDownloads as compatGetAllDownloads,
  getAllEvents as compatGetAllEvents,
  getAllPrints as compatGetAllPrints,
  getAllResources as compatGetAllResources,
  getAllStrategies as compatGetAllStrategies,
  getAllCanons as compatGetAllCanons,
  getAllShorts as compatGetAllShorts,
} from "@/lib/contentlayer";

// ============================================
// TYPE DEFINITIONS
// ============================================

// These 'export type' statements are the correct way to share types 🏷️
export type ContentDoc = StrictContentDoc;
export type { DocKind };
export type AccessLevel = 'public' | 'private' | 'restricted';
export type AnyDoc = ContentDoc;
export type ContentlayerCardProps = ReturnType<typeof getCardProps>;

// ============================================
// LOCAL UTILITIES
// ============================================

export const isDraft = (doc: ContentDoc): boolean => {
  const draftValue = doc.draft;
  return draftValue === true;
};

export const isPublic = (doc: ContentDoc): boolean => {
  const level = getAccessLevel(doc);
  return level === 'public';
};

export const isContentlayerLoaded = (): boolean => {
  try {
    const docs = compatGetAllDocuments();
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
// DOCUMENT GETTERS
// ============================================

const convertToStrict = (doc: CompatContentDoc): ContentDoc => {
  return toStrictContentDoc(doc);
};

const convertAllToStrict = (docs: CompatContentDoc[]): ContentDoc[] => {
  return docs.map(convertToStrict);
};

export const getPublishedDocuments = (): ContentDoc[] => {
  const docs = compatGetAllDocuments();
  return convertAllToStrict(docs);
};

export const getAllContentlayerDocs = getPublishedDocuments;

export const getPublishedPosts = (limit?: number): ContentDoc[] => {
  const docs = compatGetAllPosts();
  const processed = convertAllToStrict(docs);
  return limit ? processed.slice(0, limit) : processed;
};

export const getPublishedShorts = (limit?: number): ContentDoc[] => {
  const docs = compatGetAllShorts();
  const processed = convertAllToStrict(docs);
  return limit ? processed.slice(0, limit) : processed;
};

export const getRecentBooks = (limit?: number): ContentDoc[] => {
  const docs = compatGetAllBooks();
  const processed = convertAllToStrict(docs);
  return limit ? processed.slice(0, limit) : processed;
};

export const getAllBooks = (): ContentDoc[] => convertAllToStrict(compatGetAllBooks());
export const getAllDownloads = (): ContentDoc[] => convertAllToStrict(compatGetAllDownloads());
export const getAllEvents = (): ContentDoc[] => convertAllToStrict(compatGetAllEvents());
export const getAllPrints = (): ContentDoc[] => convertAllToStrict(compatGetAllPrints());
export const getAllResources = (): ContentDoc[] => convertAllToStrict(compatGetAllResources());
export const getAllStrategies = (): ContentDoc[] => convertAllToStrict(compatGetAllStrategies());
export const getAllCanons = (): ContentDoc[] => convertAllToStrict(compatGetAllCanons());
export const getAllShorts = (): ContentDoc[] => convertAllToStrict(compatGetAllShorts());

// ============================================
// FEATURED CONTENT
// ============================================

export const getFeaturedDocuments = (kind?: DocKind, limit?: number): ContentDoc[] => {
  if (!isContentlayerLoaded()) return [];
  
  let docs: CompatContentDoc[] = [];
  
  if (kind) {
    const specificGetter = (ContentHelper as any)[`getAll${kind.charAt(0).toUpperCase() + kind.slice(1)}s`];
    if (typeof specificGetter === 'function') {
      docs = specificGetter();
    } else {
      docs = compatGetAllDocuments().filter(d => getDocKind(d) === kind);
    }
  } else {
    docs = compatGetAllDocuments();
  }

  const featured = docs.filter(doc => doc.featured === true);
  const processed = convertAllToStrict(featured);
  return limit ? processed.slice(0, limit) : processed;
};

export const getFeaturedDocumentsByType = (kind: DocKind, limit?: number): ContentDoc[] => {
  return getFeaturedDocuments(kind, limit);
};

// ============================================
// SLUG RESOLUTION
// ============================================

export { getDocumentBySlug };

export const getPostBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('post', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getBookBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('book', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getDownloadBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('download', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getEventBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('event', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getPrintBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('print', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getResourceBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('resource', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getStrategyBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('strategy', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getCanonBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('canon', slug);
  return doc ? convertToStrict(doc) : null;
};

export const getShortBySlug = (slug: string): ContentDoc | null => {
  const doc = ContentHelper.getDocumentBySlug('short', slug);
  return doc ? convertToStrict(doc) : null;
};

// ============================================
// UI & DISPLAY
// ============================================

export const getCardPropsForDocument = getCardProps;

// ============================================
// UTILITIES
// ============================================

export const getRecentDocuments = (limit: number = 10, kind?: DocKind): ContentDoc[] => {
  let documents = compatGetAllDocuments();
  
  if (kind) {
    documents = documents.filter(doc => getDocKind(doc) === kind);
  }
  
  const processed = convertAllToStrict(documents);
  
  return processed
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
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://abrahamoflondon.org'}${card.href}`,
      lastModified: doc.date,
      changeFrequency: 'weekly' as const,
      priority: doc.featured ? 0.8 : 0.5,
    };
  });
};

// ============================================
// DEFAULT EXPORT (Values only! 🛠️)
// ============================================

export default {
  // Utilities
  isDraft,
  isPublic,
  isContentlayerLoaded,
  
  // Type Guards
  isPost,
  isBook,
  isDownload,
  isEvent,
  isCanon,
  isShort,
  
  // Document Getters
  getPublishedDocuments,
  getAllContentlayerDocs,
  getPublishedPosts,
  getPublishedShorts,
  getRecentBooks,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  getAllCanons,
  getAllShorts,
  
  // Featured Content
  getFeaturedDocuments,
  getFeaturedDocumentsByType,
  
  // Slug Resolution
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,
  
  // UI & Display
  getCardPropsForDocument,
  
  // Utilities
  getRecentDocuments,
  getUniqueTags,
  getDocumentsForSitemap,
};
/* lib/contentlayer.ts - COMPLETE CORRECTED VERSION */
import { 
  // Collection getters
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllArticles,
  getAllGuides,
  getAllTutorials,
  getAllCaseStudies,
  getAllContentlayerDocs, // ADDED
  
  // Server-prefixed versions
  getServerAllPosts,
  getServerPostBySlug,
  getServerAllBooks,
  getServerBookBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getServerAllEvents,
  getServerEventBySlug,
  getServerAllShorts,
  getServerShortBySlug,
  getServerAllCanons,
  getServerCanonBySlug,
  getServerAllResources,
  getServerResourceBySlug,
  getServerAllDocuments,
  getServerDocumentBySlug,
  getServerAllPrints,
  getServerAllStrategies,
  
  // Type-specific getters
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getCanonBySlug,
  getResourceBySlug,
  getPrintBySlug,
  getStrategyBySlug,
  getDocumentBySlug as helperGetDocumentBySlug,
  
  // Utilities
  sanitizeData,
  getDownloadSizeLabel,
  assertPublicAssetsForDownloadsAndResources,
  recordContentView,
  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  getAccessLevel,
  resolveDocCoverImage,
  normalizeSlug,
  getDocKind,
  getDocHref,
  isDraftContent,
  isDraft,
  toUiDoc,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
  
  // Types
  ContentDoc as ContentDocBase,
  DocKind
} from "@/lib/contentlayer-helper";

// Re-export everything
export {
  // Collection getters
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllBooks,
  getAllPosts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllArticles,
  getAllGuides,
  getAllTutorials,
  getAllCaseStudies,
  getAllContentlayerDocs, // ADDED
  
  // Server-prefixed versions
  getServerAllPosts,
  getServerPostBySlug,
  getServerAllBooks,
  getServerBookBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getServerAllEvents,
  getServerEventBySlug,
  getServerAllShorts,
  getServerShortBySlug,
  getServerAllCanons,
  getServerCanonBySlug,
  getServerAllResources,
  getServerResourceBySlug,
  getServerAllDocuments,
  getServerDocumentBySlug,
  getServerAllPrints,
  getServerAllStrategies,
  
  // Type-specific getters
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getCanonBySlug,
  getResourceBySlug,
  getPrintBySlug,
  getStrategyBySlug,
  
  // Utilities
  sanitizeData,
  getDownloadSizeLabel,
  assertPublicAssetsForDownloadsAndResources,
  recordContentView,
  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  getAccessLevel,
  resolveDocCoverImage,
  normalizeSlug,
  getDocKind,
  getDocHref,
  isDraftContent,
  isDraft,
  toUiDoc,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
};

export type { ContentDocBase as ContentlayerDocument, DocKind };

// Export type aliases
export type PostDocument = ContentDocBase;
export type BookDocument = ContentDocBase;
export type DownloadDocument = ContentDocBase;
export type CanonDocument = ContentDocBase;
export type EventDocument = ContentDocBase;
export type ShortDocument = ContentDocBase;
export type PrintDocument = ContentDocBase;
export type StrategyDocument = ContentDocBase;
export type ResourceDocument = ContentDocBase;
export type DocumentTypes = ContentDocBase;

// Pre-computed collections
export const allPosts = getAllPosts();
export const allBooks = getAllBooks();
export const allDownloads = getAllDownloads();
export const allEvents = getAllEvents();
export const allPrints = getAllPrints();
export const allStrategies = getAllStrategies();
export const allResources = getAllResources();
export const allCanons = getAllCanons();
export const allShorts = getAllShorts();

// Combined collection
export const allDocuments = [
  ...allPosts,
  ...allBooks,
  ...allDownloads,
  ...allEvents,
  ...allPrints,
  ...allStrategies,
  ...allResources,
  ...allCanons,
  ...allShorts
];

// Legacy aliases
export const getDocumentBySlug = helperGetDocumentBySlug;
export const getAllDocuments = () => allDocuments; // ADDED for system-health.ts

// Published documents helpers
export const getPublishedDocuments = (docs: ContentDocBase[] = allDocuments) => {
  return docs
    .filter((d) => d && !d.draft)
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
};

export const getPublishedPosts = () => getPublishedDocuments(allPosts);
export const getPublishedShorts = () => getPublishedDocuments(allShorts);
export const getPublishedBooks = () => getPublishedDocuments(allBooks);
export const getPublishedDownloads = () => getPublishedDocuments(allDownloads);
export const getPublishedEvents = () => getPublishedDocuments(allEvents);
export const getPublishedResources = () => getPublishedDocuments(allResources);
export const getPublishedCanons = () => getPublishedDocuments(allCanons);

// Type guards
export function isPost(doc: any): boolean { return doc?.type === "Post" || doc?.type === "post"; }
export function isBook(doc: any): boolean { return doc?.type === "Book" || doc?.type === "book"; }
export function isDownload(doc: any): boolean { return doc?.type === "Download" || doc?.type === "download"; }
export function isEvent(doc: any): boolean { return doc?.type === "Event" || doc?.type === "event"; }
export function isPrint(doc: any): boolean { return doc?.type === "Print" || doc?.type === "print"; }
export function isResource(doc: any): boolean { return doc?.type === "Resource" || doc?.type === "resource"; }
export function isCanon(doc: any): boolean { return doc?.type === "Canon" || doc?.type === "canon"; }
export function isStrategy(doc: any): boolean { return doc?.type === "Strategy" || doc?.type === "strategy"; }
export function isShort(doc: any): boolean { return doc?.type === "Short" || doc?.type === "short"; }

// UI Utilities
export function getCardFallbackConfig() {
  return {
    defaultImage: "/assets/images/placeholder.jpg",
    defaultTitle: "Untitled",
    defaultDescription: "No description available.",
    defaultTags: [] as string[],
    defaultAuthor: "Unknown Author",
    defaultAvatar: "/assets/images/avatar.jpg",
  };
}

export function getCardImage(image: string | null | undefined, fallback?: string): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

export function formatCardDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export function getCardPropsForDocument(doc: ContentDocBase) {
  const base = {
    slug: doc.slug || doc._raw?.flattenedPath?.split('/').pop() || "unknown",
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || null,
    description: doc.description || null,
    excerpt: doc.excerpt || doc.description || null,
    coverImage: doc.coverImage || doc.coverimage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    type: doc.type,
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
    author: doc.author || null,
    category: doc.category || null,
    readTime: doc.readTime || null,
  };

  if (isCanon(doc)) {
    return { ...base, volumeNumber: (doc as any).volumeNumber, order: (doc as any).order };
  }
  if (isBook(doc)) {
    return { ...base, isbn: (doc as any).isbn, publisher: (doc as any).publisher };
  }
  if (isEvent(doc)) {
    return { ...base, eventDate: (doc as any).eventDate, location: (doc as any).location };
  }
  if (isPrint(doc)) {
    return { ...base, price: (doc as any).price, available: (doc as any).available };
  }
  
  return base;
}

// Recent content helpers
export function getRecentShorts(limit: number = 5): ContentDocBase[] {
  return getPublishedShorts().slice(0, limit);
}

export function getRecentPosts(limit: number = 5): ContentDocBase[] {
  return getPublishedPosts().slice(0, limit);
}

export function getRecentDownloads(limit: number = 5): ContentDocBase[] {
  return getPublishedDownloads().slice(0, limit);
}

// Default export
const ContentlayerExports = {
  // Collections
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
  allShorts,
  allDocuments,
  
  // Functions
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllStrategies,
  getAllResources,
  getAllCanons,
  getAllShorts,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getStrategyBySlug,
  getResourceBySlug,
  getCanonBySlug,
  getShortBySlug,
  getDocumentBySlug,
  getServerAllPosts,
  getServerPostBySlug,
  getServerAllBooks,
  getServerBookBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getServerAllEvents,
  getServerEventBySlug,
  getServerAllShorts,
  getServerShortBySlug,
  getServerAllCanons,
  getServerCanonBySlug,
  getServerAllResources,
  getServerResourceBySlug,
  getServerAllDocuments,
  getServerDocumentBySlug,
  getServerAllPrints,
  getServerAllStrategies,
  sanitizeData,
  getRecentShorts,
  getRecentPosts,
  getRecentDownloads,
  getPublishedPosts,
  getPublishedShorts,
  getPublishedDocuments,
  getAllDocuments,
};

export default ContentlayerExports;
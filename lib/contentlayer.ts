// lib/contentlayer.ts - UPDATED BARREL EXPORT FILE
/**
 * Main Contentlayer barrel exports
 * Re-exports everything from contentlayer-compat for backward compatibility
 */

// Export all types and functions from contentlayer-compat
export type { 
  DocBase, 
  ContentDoc, 
  StrictContentDoc,
  DocKind 
} from "./contentlayer-compat";

// Re-export specific functions with proper names
export {
  // Core functions
  getContentlayerData,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
  normalizeSlug,
  getDocKind,
  getDocHref,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  isDraftContent,
  sanitizeData,
  toUiDoc,
  toStrictContentDoc,
  isStrictContentDoc,
  
  // For backward compatibility - export published doc getters
  getPublishedDocuments as getAllDocuments,
  getPublishedDocuments,
  
  // Collection getters
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  
  // Alias for getAllDocuments
  getPublishedDocuments as getAllContentlayerDocs,
  
  // Card props function
  getCardProps,
} from "./contentlayer-compat";

// Server-side functions (for getServerSideProps)
export {
  getServerPostBySlug as getDocumentBySlug,
  getServerBookBySlug as getBookBySlug,
  getServerCanonBySlug as getCanonBySlug,
  getServerDownloadBySlug as getDownloadBySlug,
  getServerEventBySlug as getEventBySlug,
  getServerShortBySlug as getShortBySlug,
  getServerResourceBySlug as getResourceBySlug,
  getServerStrategyBySlug as getStrategyBySlug,
  getServerPrintBySlug as getPrintBySlug,
  
  // Direct exports for server-side
  getServerAllPosts,
  getServerAllBooks,
  getServerAllCanons,
  getServerAllDownloads,
  getServerAllEvents,
  getServerAllShorts,
  getServerAllPrints,
  getServerAllResources,
  getServerAllStrategies,
} from "./contentlayer-compat";

// Async versions - re-export if available
export {
  getContentlayerDataAsync,
  getPublishedDocumentsAsync,
  getDocBySlugAsync,
  getServerAllBooksAsync,
  getServerAllCanonsAsync,
  getServerAllDownloadsAsync,
  getServerAllShortsAsync,
} from "./contentlayer-compat";

// Utility functions
export {
  recordContentView,
  isDraftContent as isDraft,
} from "./contentlayer-compat";

// Direct data arrays (for static imports)
export {
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
} from "./contentlayer-compat";

// Remove the duplicate getCardProps function and use the one from contentlayer-compat
// The getCardProps from contentlayer-compat.ts is already re-exported above

// Re-export the default API object
import contentlayerCompatApi from "./contentlayer-compat";
export default contentlayerCompatApi;
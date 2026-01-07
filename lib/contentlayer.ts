// lib/contentlayer.ts
/**
 * Main ContentLayer export file
 * Re-exports everything from contentlayer-compat
 */

export {
  // Collections
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
  
  // Functions
  getContentlayerData,
  getDocHref,
  normalizeSlug,
  getAccessLevel,
  isDraft,
  isDraftContent,
  isPublished,
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
  getPublishedDocuments,
  getDocBySlug,
  getServerAllPosts,
  getServerPostBySlug,
  getServerAllBooks,
  getServerBookBySlug,
  getServerAllCanons,
  getServerCanonBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getDownloadBySlug,
  getServerAllShorts,
  getServerShortBySlug,
  getServerAllEvents,
  getServerEventBySlug,
  getServerAllPrints,
  getServerPrintBySlug,
  getServerAllResources,
  getServerResourceBySlug,
  getServerAllStrategies,
  getServerStrategyBySlug,
  getDocKind,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  toUiDoc,
  sanitizeData,
  recordContentView,
  assertContentlayerHasDocs,
  
  // Types
  type DocBase,
} from './contentlayer-compat';

// Default export
import contentLayerData from './contentlayer-compat';
export default contentLayerData;
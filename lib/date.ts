/* lib/contentlayer.ts - CANONICAL BARREL (named exports only) */

export {
  // Hard guarantees
  assertContentlayerHasDocs,
  assertPublicAssetsForDownloadsAndResources,
  recordContentView,
  isContentlayerLoaded,

  // Utils
  normalizeSlug,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  getDownloadSizeLabel,

  // Routing helpers
  getDocHref,
  getDocKind,
  toUiDoc,

  // Draft helpers
  isDraftContent,
  isDraft,

  // Collections
  getAllDocuments,
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllShorts,
  getAllCanons,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllContentlayerDocs,

  // Published helpers
  getPublishedDocuments,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedShorts,
  getPublishedCanons,
  getPublishedResources,

  // Slug lookup
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getCanonBySlug,
  getResourceBySlug,
  getPrintBySlug,
  getStrategyBySlug,

  // Back-compat "server" aliases
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

  // Precomputed arrays
  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allShorts,
  allCanons,
  allResources,
  allPrints,
  allStrategies,
} from "./contentlayer-helper";

// Types should come from helper
export type { ContentDoc, DocKind } from "./contentlayer-helper";
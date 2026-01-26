// lib/contentlayer-helper.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * LEGACY HELPER FACADE
 * Many older modules import from "@/lib/contentlayer-helper".
 * Keep this as a stable façade over "@/lib/content/server".
 */

export {
  // core
  getContentlayerData,
  isContentlayerLoaded,
  assertContentlayerHasDocs,

  // docs
  getPublishedDocuments,
  getAllContentlayerDocs,
  getDocBySlug,
  getDocumentBySlug,

  // posts
  getPublishedPosts,
  getPostBySlug,
  getPostBySlugWithContent,

  // collections (server)
  getServerAllBooks,
  getServerBookBySlug,
  getServerAllCanons,
  getServerCanonBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getServerAllEvents,
  getServerEventBySlug,
  getServerAllShorts,
  getServerShortBySlug,
  getServerAllResources,
  getServerResourceBySlug,
  getServerAllPrints,
  getServerPrintBySlug,
  getServerAllStrategies,
  getServerStrategyBySlug,

  // legacy names used by some API routes
  getAllShorts,
  getBooks,
  getCanons,
  getDownloads,
  getEvents,
  getPrints,
  getResources,
  getStrategies,
  getShorts,
  getAllCombinedDocs,

  // utilities
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  getDocHref,
  getDocKind,
} from "@/lib/content/server";
// lib/contentlayer.ts
// SINGLE SOURCE OF TRUTH BARREL — stable re-exports + legacy aliases.
// This file exists to keep the rest of the codebase sane.

export {
  // Core collections
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllEvents,
  getAllShorts,
  getAllResources,
  getAllPrints,
  getAllStrategies,
  getAllDocuments,
  getAllContentlayerDocs,

  // Core getters
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getCanonBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getResourceBySlug,
  getPrintBySlug,
  getStrategyBySlug,

  // Server compatibility exports
  getServerAllPosts,
  getServerPostBySlug,
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
  getServerAllDocuments,
  getServerDocumentBySlug,
  getServerAllPrints,
  getServerAllStrategies,

  // Runtime checks + utils
  isContentlayerLoaded,
  assertContentlayerHasDocs,
  isDraft,
  isDraftContent,
  sanitizeData,
  normalizeSlug,
  getDocKind,
  getDocHref,
  toUiDoc,

  // “No-op” ops that some pages/api expect
  recordContentView,
  assertPublicAssetsForDownloadsAndResources,
  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  resolveDocCoverImage,
  getAccessLevel,
  getDownloadSizeLabel,
} from "@/lib/contentlayer-helper";

// -----------------------------------------------------------------------------
// Legacy category aliases (some older pages expect these names)
// -----------------------------------------------------------------------------
export { getAllPosts as getAllArticles } from "@/lib/contentlayer-helper";
export { getAllPosts as getAllGuides } from "@/lib/contentlayer-helper";
export { getAllPosts as getAllTutorials } from "@/lib/contentlayer-helper";
export { getAllPosts as getAllCaseStudies } from "@/lib/contentlayer-helper";
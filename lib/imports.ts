// lib/imports.ts
export * from "./siteConfig";
export * from "./utils";

export {
  // Raw Collections
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allCanon, // Alias
  allShorts,

  // Retrieval Getters
  getAllContentlayerDocs,
  getPublishedDocuments,
  getPublishedDocumentsByType,
  getPublishedPosts,
  getPublishedShorts,
  getRecentShorts,
  getAllCanons,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllStrategies,
  getAllResources,
  getAllPrints,

  // By-Slug Getters
  getPostBySlug,
  getBookBySlug,
  getCanonBySlug,
  getShortBySlug,
  getDownloadBySlug,
  getResourceBySlug,
  getEventBySlug,
  getPrintBySlug,
  getStrategyBySlug,

  // Logic Helpers
  normalizeSlug,
  getDocHref,
  getDocKind,
  isDraft,
  isPublished,
  assertContentlayerHasDocs
} from "./contentlayer-helper";

export type { DocKind } from "./contentlayer-helper";
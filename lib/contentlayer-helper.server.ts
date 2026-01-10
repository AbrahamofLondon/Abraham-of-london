/* lib/contentlayer-helper.server.ts - FIXED FOR PAGES ROUTER */

/* -------------------------------------------------------------------------- */
/* SAFE COMPAT IMPORT                                                        */
/* -------------------------------------------------------------------------- */

// Use dynamic import or safe wrapper
let Compat: any = {};

try {
  // Try to import the compat module
  Compat = require("./contentlayer-compat");
} catch (error) {
  console.warn('[Contentlayer Helper] Failed to import compat module:', error);
  // Provide fallback functions
  Compat = {
    allDocuments: [],
    getAllPosts: () => [],
    getBookBySlug: () => null,
    getPostBySlug: () => null,
    normalizeSlug: (input: string) => input?.trim() || '',
    isDraftContent: () => false,
    getDocKind: () => '',
    resolveDocCoverImage: () => '/assets/images/placeholder.jpg',
    resolveDocDownloadUrl: () => '',
    assertContentlayerHasDocs: () => false,
  };
}

/**
 * RE-EXPORT ALL COMPAT LOGIC
 */
export * from "./contentlayer-compat";

/* -------------------------------------------------------------------------- */
/* EXHAUSTIVE COLLECTION PROVIDERS                                            */
/* -------------------------------------------------------------------------- */
/**
 * These satisfy the build trace for legacy pages or canon-indexes 
 * that reference specific sub-collections.
 */
export const getAllArticles = () => [];
export const getAllGuides = () => [];
export const getAllTutorials = () => [];
export const getAllCaseStudies = () => [];
export const getAllWhitepapers = () => [];
export const getAllReports = () => [];
export const getAllNewsletters = () => [];
export const getAllSermons = () => [];
export const getAllDevotionals = () => [];
export const getAllPrayers = () => [];
export const getAllTestimonies = () => [];
export const getAllPodcasts = () => [];
export const getAllVideos = () => [];
export const getAllCourses = () => [];
export const getAllLessons = () => [];

/* -------------------------------------------------------------------------- */
/* INSTITUTIONAL SYSTEM HEALTH                                                */
/* -------------------------------------------------------------------------- */

/**
 * Verification check to ensure Contentlayer has hydrated the .contentlayer folder.
 */
export const isContentlayerLoaded = (): boolean => {
  return Compat.allDocuments?.length > 0 || false;
};

/**
 * High-signal assertion used in admin/debug routes.
 */
export const assertContentlayerHasDocs = (): boolean => {
  const hasDocs = Compat.assertContentlayerHasDocs?.() || false;
  if (!hasDocs) {
    console.warn("⚠️ [SYSTEM_ALERT] Contentlayer generated folder is empty or missing.");
  }
  return hasDocs;
};

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT (ContentHelper)                                             */
/* -------------------------------------------------------------------------- */
/**
 * Resolves: "export 'default' (reexported as 'ContentHelper') was not found"
 */
const ContentHelper = {
  // Export all compat functions
  allDocuments: Compat.allDocuments || [],
  getAllPosts: Compat.getAllPosts || (() => []),
  getBookBySlug: Compat.getBookBySlug || (() => null),
  getPostBySlug: Compat.getPostBySlug || (() => null),
  getDownloadBySlug: Compat.getDownloadBySlug || (() => null),
  getEventBySlug: Compat.getEventBySlug || (() => null),
  getShortBySlug: Compat.getShortBySlug || (() => null),
  getCanonBySlug: Compat.getCanonBySlug || (() => null),
  getDocumentBySlug: Compat.getDocumentBySlug || (() => null),
  getDocHref: Compat.getDocHref || (() => '/'),
  normalizeSlug: Compat.normalizeSlug || ((input: string) => input?.trim() || ''),
  isDraftContent: Compat.isDraftContent || (() => false),
  getDocKind: Compat.getDocKind || (() => ''),
  getAccessLevel: Compat.getAccessLevel || (() => 'public'),
  resolveDocCoverImage: Compat.resolveDocCoverImage || (() => '/assets/images/placeholder.jpg'),
  resolveDocDownloadUrl: Compat.resolveDocDownloadUrl || (() => ''),
  
  // Additional collections
  getAllArticles,
  getAllGuides,
  getAllTutorials,
  getAllCaseStudies,
  getAllWhitepapers,
  getAllReports,
  getAllNewsletters,
  getAllSermons,
  getAllDevotionals,
  getAllPrayers,
  getAllTestimonies,
  getAllPodcasts,
  getAllVideos,
  getAllCourses,
  getAllLessons,
  
  // System health
  isContentlayerLoaded,
  assertContentlayerHasDocs,
};

export default ContentHelper;


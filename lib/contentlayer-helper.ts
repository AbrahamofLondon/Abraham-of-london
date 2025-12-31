/* ============================================================================
 * ROBUST CONTENTLAYER HELPER
 * Handles all document types with proper error handling
 * ============================================================================ */

import * as generated from "contentlayer/generated";

// Complete type definition matching ALL your document types
export type DocKind = 
  | "post" | "book" | "download" | "canon" | "short" | "event" 
  | "resource" | "strategy" | "article" | "guide" | "tutorial" 
  | "caseStudy" | "whitepaper" | "report" | "newsletter" | "sermon" 
  | "devotional" | "prayer" | "testimony" | "podcast" | "video" 
  | "course" | "lesson" | "print";

// Tier type definition for access control
export type Tier = 'free' | 'basic' | 'premium' | 'enterprise' | 'restricted';

// Type-safe collection accessor
const getCollection = (collectionName: string): any[] => {
  try {
    const collection = (generated as any)[collectionName];
    return Array.isArray(collection) ? collection : [];
  } catch (error) {
    console.warn(`[ContentHelper] Collection "${collectionName}" not found:`, error);
    return [];
  }
};

// Filter published documents only
const filterPublished = (docs: any[]) => {
  return docs.filter(doc => {
    const isDraft = doc.draft === true || doc.draft === "true";
    const isArchived = doc.archived === true || doc.archived === "true";
    return !isDraft && !isArchived;
  });
};

/* -------------------------------------------------------------------------- */
/* CORE UTILITY FUNCTIONS (DEFINED FIRST)                                    */
/* -------------------------------------------------------------------------- */

// 1. Slug utilities
export const normalizeSlug = (slug: string | string[] | undefined): string => {
  if (!slug) return '';
  if (Array.isArray(slug)) return slug.join('/');
  return slug.toString().replace(/^\//, '').replace(/\/$/, '');
};

// 2. Document href resolution
export const getDocHref = (doc: any): string => {
  return doc.url || doc.href || `/${doc._raw?.flattenedPath || ''}`;
};

// 3. Document kind detection
export const getDocKind = (doc: any): DocKind => {
  const path = doc._raw?.flattenedPath || '';
  if (path.startsWith('blog/')) return 'post';
  if (path.startsWith('books/')) return 'book';
  if (path.startsWith('downloads/')) return 'download';
  if (path.startsWith('canon/')) return 'canon';
  if (path.startsWith('shorts/')) return 'short';
  if (path.startsWith('events/')) return 'event';
  if (path.startsWith('resources/')) return 'resource';
  if (path.startsWith('strategy/')) return 'strategy';
  if (path.startsWith('articles/')) return 'article';
  if (path.startsWith('guides/')) return 'guide';
  if (path.startsWith('tutorials/')) return 'tutorial';
  if (path.startsWith('case-studies/')) return 'caseStudy';
  if (path.startsWith('whitepapers/')) return 'whitepaper';
  if (path.startsWith('reports/')) return 'report';
  if (path.startsWith('newsletters/')) return 'newsletter';
  if (path.startsWith('sermons/')) return 'sermon';
  if (path.startsWith('devotionals/')) return 'devotional';
  if (path.startsWith('prayers/')) return 'prayer';
  if (path.startsWith('testimonies/')) return 'testimony';
  if (path.startsWith('podcasts/')) return 'podcast';
  if (path.startsWith('videos/')) return 'video';
  if (path.startsWith('courses/')) return 'course';
  if (path.startsWith('lessons/')) return 'lesson';
  if (path.startsWith('prints/')) return 'print';
  return 'post'; // fallback
};

// 4. Draft status check
export const isDraft = (doc: any): boolean => {
  return doc.draft === true || doc.draft === "true";
};

// 5. Access level check
export const getAccessLevel = (doc: any): string => {
  return doc.accessLevel || 'public';
};

// 6. Tier-related functions
export const normalizeTier = (tier: string | undefined): Tier => {
  if (!tier) return 'free';
  const normalized = tier.toLowerCase().trim();
  if (normalized === 'basic') return 'basic';
  if (normalized === 'premium') return 'premium';
  if (normalized === 'enterprise') return 'enterprise';
  if (normalized === 'restricted') return 'restricted';
  return 'free';
};

export const getRequiredTier = (doc: any): Tier => {
  return normalizeTier(doc.requiredTier || doc.tier || doc.computedTier || 'free');
};

export const isTierAllowed = (userTier: Tier | string, requiredTier: Tier | string): boolean => {
  const tierOrder: Record<Tier, number> = {
    'free': 0,
    'basic': 1,
    'premium': 2,
    'enterprise': 3,
    'restricted': 4,
  };
  
  const user = normalizeTier(userTier);
  const required = normalizeTier(requiredTier);
  
  return tierOrder[user] >= tierOrder[required];
};

export const canAccessDoc = (doc: any, userTier: Tier | string): boolean => {
  const requiredTier = getRequiredTier(doc);
  return isTierAllowed(userTier, requiredTier);
};

// 7. Cover image resolution
export const resolveDocCoverImage = (doc: any): string => {
  return doc.coverImage || "/assets/images/placeholder.jpg";
};

// 8. Download URL resolution
export const resolveDocDownloadUrl = (doc: any): string => {
  return doc.downloadUrl || doc.pdfPath || doc.file || doc.downloadFile || doc.fileUrl || '';
};

// 9. Download href resolution
export const resolveDocDownloadHref = (doc: any): string => {
  const url = resolveDocDownloadUrl(doc);
  return url ? `/api/downloads/${normalizeSlug(doc.slug || doc._raw?.flattenedPath.split('/').pop())}` : '';
};

// 10. Download size label
export const resolveDocDownloadSizeLabel = (doc: any): string => {
  return doc.fileSize || 'Unknown size';
};

// 11. Content status checks
export const isDraftContent = isDraft;
export const isPublishedContent = (doc: any) => !isDraft(doc);
export const isPublic = (doc: any) => getAccessLevel(doc) === 'public';

// 12. UI document conversion
export const toUiDoc = (doc: any) => ({
  ...getCardProps(doc),
  kind: getDocKind(doc),
  slug: doc.slug || doc._raw?.flattenedPath.split('/').pop(),
});

// 13. Short theme coercion
export const coerceShortTheme = (theme: string | undefined): string => {
  const themes = ['reflective', 'challenge', 'encouragement', 'warning', 'insight'];
  return theme && themes.includes(theme) ? theme : 'reflective';
};

// 14. Assertion utilities
export const assertContentlayerHasDocs = () => {
  const docs = getAllDocuments();
  if (docs.length === 0) {
    throw new Error('Contentlayer has no documents. Run `pnpm run content:build` first.');
  }
  return docs;
};

/* -------------------------------------------------------------------------- */
/* DOCUMENT GETTER FUNCTIONS                                                  */
/* -------------------------------------------------------------------------- */

// Helper function to create document getters
const createCollectionGetter = (collectionName: string) => {
  return () => filterPublished(getCollection(collectionName));
};

// Define all collection getters
export const getAllPosts = createCollectionGetter("allPosts");
export const getAllCanons = createCollectionGetter("allCanons");
export const getAllDownloads = createCollectionGetter("allDownloads");
export const getAllBooks = createCollectionGetter("allBooks");
export const getAllEvents = createCollectionGetter("allEvents");
export const getAllShorts = createCollectionGetter("allShorts");
export const getAllArticles = createCollectionGetter("allArticles");
export const getAllGuides = createCollectionGetter("allGuides");
export const getAllTutorials = createCollectionGetter("allTutorials");
export const getAllCaseStudies = createCollectionGetter("allCaseStudies");
export const getAllWhitepapers = createCollectionGetter("allWhitepapers");
export const getAllReports = createCollectionGetter("allReports");
export const getAllNewsletters = createCollectionGetter("allNewsletters");
export const getAllSermons = createCollectionGetter("allSermons");
export const getAllDevotionals = createCollectionGetter("allDevotionals");
export const getAllPrayers = createCollectionGetter("allPrayers");
export const getAllTestimonies = createCollectionGetter("allTestimonies");
export const getAllPodcasts = createCollectionGetter("allPodcasts");
export const getAllVideos = createCollectionGetter("allVideos");
export const getAllCourses = createCollectionGetter("allCourses");
export const getAllLessons = createCollectionGetter("allLessons");
export const getAllStrategies = createCollectionGetter("allStrategies");
export const getAllPrints = createCollectionGetter("allPrints");
export const getAllResources = createCollectionGetter("allResources");

// "get" prefix aliases for consistency
export const getPosts = getAllPosts;
export const getDownloads = getAllDownloads;
export const getCanons = getAllCanons;
export const getBooks = getAllBooks;
export const getEvents = getAllEvents;
export const getShorts = getAllShorts;
export const getArticles = getAllArticles;
export const getGuides = getAllGuides;
export const getTutorials = getAllTutorials;
export const getCaseStudies = getAllCaseStudies;
export const getWhitepapers = getAllWhitepapers;
export const getReports = getAllReports;
export const getNewsletters = getAllNewsletters;
export const getSermons = getAllSermons;
export const getDevotionals = getAllDevotionals;
export const getPrayers = getAllPrayers;
export const getTestimonies = getAllTestimonies;
export const getPodcasts = getAllPodcasts;
export const getVideos = getAllVideos;
export const getCourses = getAllCourses;
export const getLessons = getAllLessons;
export const getStrategies = getAllStrategies;
export const getPrints = getAllPrints;
export const getResources = getAllResources;

/* -------------------------------------------------------------------------- */
/* ADVANCED CARD PROPERTIES WITH SAFE FALLBACKS                              */
/* -------------------------------------------------------------------------- */

export const getCardProps = (doc: any) => {
  if (!doc) {
    return {
      title: "Document Not Found",
      href: "#",
      coverImage: "/assets/images/placeholder.jpg",
      layout: "default"
    };
  }

  // Safe property accessor
  const getSafe = <T>(key: string, fallback: T): T => {
    const value = doc[key];
    return value !== undefined && value !== null ? value : fallback;
  };

  // Handle both readTime and readtime (lowercase from your logs)
  const readTimeValue = getSafe("readTime", getSafe("readtime", null));

  return {
    title: getSafe("title", "Untitled"),
    subtitle: getSafe("subtitle", ""),
    description: getSafe("description", getSafe("excerpt", "")),
    category: getSafe("category", "Uncategorized"),
    author: getSafe("author", getSafe("authorTitle", "Abraham of London")),
    href: getSafe("url", getSafe("href", `/${doc._raw?.flattenedPath || "#"}`)),
    
    // Cover image with all positioning fields
    coverImage: getSafe("coverImage", "/assets/images/placeholder.jpg"),
    coverAspect: getSafe("coverAspect", "auto"),
    coverFit: getSafe("coverFit", "cover"),
    coverPosition: getSafe("coverPosition", "center"),
    
    // Layout and structure
    layout: getSafe("layout", "default"),
    volumeNumber: getSafe("volumeNumber", null),
    audience: getSafe("audience", null),
    theme: getSafe("theme", null),
    
    // Tier information
    requiredTier: getSafe("requiredTier", getSafe("tier", "free")),
    
    // Event-specific fields
    eventDate: getSafe("eventDate", null),
    time: getSafe("time", null),
    registrationUrl: getSafe("registrationUrl", null),
    
    // Resource-specific fields
    resourceType: getSafe("resourceType", null),
    
    // Download resolution (unified from all possible field names)
    downloadUrl: getSafe("downloadUrl", 
      getSafe("pdfPath", 
        getSafe("file", 
          getSafe("downloadFile", 
            getSafe("fileUrl", null)
          )
        )
      )
    ),
    
    // Metadata
    dateISO: doc.date ? new Date(doc.date).toISOString() : null,
    dateFormatted: doc.date ? new Date(doc.date).toLocaleDateString() : "",
    readTime: readTimeValue,
    tags: getSafe("tags", []),
    isbn: getSafe("isbn", null),
    bibleVerse: getSafe("bibleVerse", null),
    location: getSafe("location", null),
  };
};

/* -------------------------------------------------------------------------- */
/* UTILITY FUNCTIONS                                                          */
/* -------------------------------------------------------------------------- */

// Get all documents of any kind (useful for search)
export const getAllDocuments = () => {
  const allCollections = [
    getAllPosts(),
    getAllBooks(),
    getAllDownloads(),
    getAllCanons(),
    getAllShorts(),
    getAllEvents(),
    getAllResources(),
    getAllStrategies(),
    getAllArticles(),
    getAllGuides(),
    getAllTutorials(),
    getAllCaseStudies(),
    getAllWhitepapers(),
    getAllReports(),
    getAllNewsletters(),
    getAllSermons(),
    getAllDevotionals(),
    getAllPrayers(),
    getAllTestimonies(),
    getAllPodcasts(),
    getAllVideos(),
    getAllCourses(),
    getAllLessons(),
    getAllPrints(),
  ];
  
  return allCollections.flat();
};

// Get document by slug
export const getDocumentBySlug = (kind: DocKind, slug: string) => {
  const getters: Record<DocKind, () => any[]> = {
    post: getAllPosts,
    book: getAllBooks,
    download: getAllDownloads,
    canon: getAllCanons,
    short: getAllShorts,
    event: getAllEvents,
    resource: getAllResources,
    strategy: getAllStrategies,
    article: getAllArticles,
    guide: getAllGuides,
    tutorial: getAllTutorials,
    caseStudy: getAllCaseStudies,
    whitepaper: getAllWhitepapers,
    report: getAllReports,
    newsletter: getAllNewsletters,
    sermon: getAllSermons,
    devotional: getAllDevotionals,
    prayer: getAllPrayers,
    testimony: getAllTestimonies,
    podcast: getAllPodcasts,
    video: getAllVideos,
    course: getAllCourses,
    lesson: getAllLessons,
    print: getAllPrints,
  };

  const docs = getters[kind]?.() || [];
  const normalizedSlug = normalizeSlug(slug);
  return docs.find(doc => {
    const docSlug = doc.slug || doc._raw.flattenedPath.split("/").pop();
    return normalizeSlug(docSlug) === normalizedSlug;
  }) || null;
};

// Featured documents
export const getFeaturedDocuments = (kind: DocKind, limit = 3): any[] => {
  const getters: Record<DocKind, () => any[]> = {
    post: getAllPosts,
    book: getAllBooks,
    download: getAllDownloads,
    canon: getAllCanons,
    short: getAllShorts,
    event: getAllEvents,
    resource: getAllResources,
    strategy: getAllStrategies,
    article: getAllArticles,
    guide: getAllGuides,
    tutorial: getAllTutorials,
    caseStudy: getAllCaseStudies,
    whitepaper: getAllWhitepapers,
    report: getAllReports,
    newsletter: getAllNewsletters,
    sermon: getAllSermons,
    devotional: getAllDevotionals,
    prayer: getAllPrayers,
    testimony: getAllTestimonies,
    podcast: getAllPodcasts,
    video: getAllVideos,
    course: getAllCourses,
    lesson: getAllLessons,
    print: getAllPrints,
  };
  
  const docs = getters[kind]?.() || [];
  return docs
    .filter(doc => doc.featured === true)
    .slice(0, limit);
};

/* -------------------------------------------------------------------------- */
/* ADDITIONAL EXPORTS FOR COMPATIBILITY                                       */
/* -------------------------------------------------------------------------- */

// Document-by-slug getters (for each type)
export const getPostBySlug = (slug: string) => getDocumentBySlug("post", slug);
export const getBookBySlug = (slug: string) => getDocumentBySlug("book", slug);
export const getDownloadBySlug = (slug: string) => getDocumentBySlug("download", slug);
export const getCanonBySlug = (slug: string) => getDocumentBySlug("canon", slug);
export const getShortBySlug = (slug: string) => getDocumentBySlug("short", slug);
export const getEventBySlug = (slug: string) => getDocumentBySlug("event", slug);
export const getResourceBySlug = (slug: string) => getDocumentBySlug("resource", slug);
export const getStrategyBySlug = (slug: string) => getDocumentBySlug("strategy", slug);
export const getPrintBySlug = (slug: string) => getDocumentBySlug("print", slug);

// Published documents by type
export const getPublishedPosts = () => getAllPosts();
export const getPublishedShorts = () => getAllShorts();
export const getRecentShorts = (limit = 5) => getAllShorts().slice(0, limit);

// All contentlayer docs (alias)
export const getAllContentlayerDocs = () => getAllDocuments();
export const getPublishedDocuments = () => getAllDocuments();

// Published documents by type (with type safety)
export const getPublishedDocumentsByType = (kind: DocKind) => {
  const getters: Record<DocKind, () => any[]> = {
    post: getAllPosts,
    book: getAllBooks,
    download: getAllDownloads,
    canon: getAllCanons,
    short: getAllShorts,
    event: getAllEvents,
    resource: getAllResources,
    strategy: getAllStrategies,
    article: getAllArticles,
    guide: getAllGuides,
    tutorial: getAllTutorials,
    caseStudy: getAllCaseStudies,
    whitepaper: getAllWhitepapers,
    report: getAllReports,
    newsletter: getAllNewsletters,
    sermon: getAllSermons,
    devotional: getAllDevotionals,
    prayer: getAllPrayers,
    testimony: getAllTestimonies,
    podcast: getAllPodcasts,
    video: getAllVideos,
    course: getAllCourses,
    lesson: getAllLessons,
    print: getAllPrints,
  };
  return getters[kind]?.() || [];
};

// Featured documents by type
export const getFeaturedDocumentsByType = (kind: DocKind, limit = 3) => {
  return getPublishedDocumentsByType(kind)
    .filter((doc: any) => doc.featured === true)
    .slice(0, limit);
};

// Card props for document (alias)
export const getCardPropsForDocument = getCardProps;

/* -------------------------------------------------------------------------- */
/* EXPORT HELPER OBJECT                                                       */
/* -------------------------------------------------------------------------- */

const ContentHelper = {
  // All getters
  getAllPosts, getAllCanons, getAllDownloads, getAllBooks, getAllEvents,
  getAllShorts, getAllArticles, getAllGuides, getAllTutorials, getAllCaseStudies,
  getAllWhitepapers, getAllReports, getAllNewsletters, getAllSermons,
  getAllDevotionals, getAllPrayers, getAllTestimonies, getAllPodcasts,
  getAllVideos, getAllCourses, getAllLessons, getAllStrategies, getAllPrints,
  getAllResources,
  
  // Short aliases
  getPosts, getDownloads, getCanons, getBooks, getEvents, getShorts,
  getArticles, getGuides, getTutorials, getCaseStudies, getWhitepapers,
  getReports, getNewsletters, getSermons, getDevotionals, getPrayers,
  getTestimonies, getPodcasts, getVideos, getCourses, getLessons,
  getStrategies, getPrints, getResources,
  
  // Utilities
  getCardProps,
  getDocumentBySlug,
  getFeaturedDocuments,
  getAllDocuments,
  
  // Tier functions
  normalizeTier,
  getRequiredTier,
  isTierAllowed,
  canAccessDoc,
  
  // Other utilities
  normalizeSlug,
  getDocHref,
  getDocKind,
  isDraft,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  resolveDocDownloadSizeLabel,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getCanonBySlug,
  getShortBySlug,
  getEventBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getPrintBySlug,
  getPublishedPosts,
  getPublishedShorts,
  getRecentShorts,
  getAllContentlayerDocs,
  getPublishedDocuments,
  isDraftContent,
  isPublishedContent,
  isPublic,
  toUiDoc,
  coerceShortTheme,
  assertContentlayerHasDocs,
  getPublishedDocumentsByType,
  getFeaturedDocumentsByType,
  getCardPropsForDocument,
  
  // Type information
  documentKinds: [
    "post", "book", "download", "canon", "short", "event",
    "resource", "strategy", "article", "guide", "tutorial",
    "caseStudy", "whitepaper", "report", "newsletter", "sermon",
    "devotional", "prayer", "testimony", "podcast", "video",
    "course", "lesson", "print"
  ] as const,
  
  // Tier type (hack to export type through object)
  Tier: undefined as unknown as Tier,
};

export default ContentHelper;
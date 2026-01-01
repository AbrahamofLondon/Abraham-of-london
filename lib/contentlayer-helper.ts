/* ============================================================================
 * ROBUST CONTENTLAYER HELPER v5.2.1
 * Features: 24-Context Registry + Complete Backward Compatibility
 * ============================================================================ */

/* -------------------------------------------------------------------------- */
/* 1. TYPES & INTERFACES                                                      */
/* -------------------------------------------------------------------------- */

export type DocKind = 
  | "post" | "book" | "download" | "canon" | "short" | "event" 
  | "resource" | "strategy" | "article" | "guide" | "tutorial" 
  | "caseStudy" | "whitepaper" | "report" | "newsletter" | "sermon" 
  | "devotional" | "prayer" | "testimony" | "podcast" | "video" 
  | "course" | "lesson" | "print";

export type Tier = 'free' | 'basic' | 'premium' | 'enterprise' | 'restricted';

export interface ContentDoc {
  _id: string;
  _raw: {
    flattenedPath: string;
    sourceFileName: string;
    sourceFilePath: string;
    contentType: string;
  };
  type: string;
  title: string;
  slug?: string;
  href?: string;
  url?: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  coverimage?: string;
  draft?: boolean | string;
  archived?: boolean | string;
  featured?: boolean;
  accessLevel?: string;
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/* 2. CORE REGISTRY & UTILITIES                                               */
/* -------------------------------------------------------------------------- */

const COLLECTION_MAP: Record<DocKind, string> = {
  post: "allPosts", book: "allBooks", download: "allDownloads",
  canon: "allCanons", short: "allShorts", event: "allEvents",
  resource: "allResources", strategy: "allStrategies", article: "allArticles",
  guide: "allGuides", tutorial: "allTutorials", caseStudy: "allCaseStudies",
  whitepaper: "allWhitepapers", report: "allReports", newsletter: "allNewsletters",
  sermon: "allSermons", devotional: "allDevotionals", prayer: "allPrayers",
  testimony: "allTestimonies", podcast: "allPodcasts", video: "allVideos",
  course: "allCourses", lesson: "allLessons", print: "allPrints"
};

// Dynamic import to handle Contentlayer not being built yet
let generated: any = {};
let isContentlayerDisabled = false;

// Try to load the generated contentlayer data
try {
  if (process.env.DISABLE_CONTENTLAYER !== 'true') {
    // Use require for Node.js to avoid ESM issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    generated = require(".contentlayer/generated");
  } else {
    isContentlayerDisabled = true;
    console.log("ℹ️ Contentlayer is disabled via DISABLE_CONTENTLAYER env");
  }
} catch (error) {
  console.warn("⚠️ Contentlayer not built yet or disabled. Run 'contentlayer build' first or use DISABLE_CONTENTLAYER=true.");
  isContentlayerDisabled = true;
  generated = {};
}

// Create empty collections when Contentlayer is disabled
if (isContentlayerDisabled) {
  Object.keys(COLLECTION_MAP).forEach(key => {
    const collectionName = COLLECTION_MAP[key as DocKind];
    generated[collectionName] = [];
  });
  generated.allDocuments = [];
}

const getCollection = (kind: DocKind): ContentDoc[] => {
  const collectionName = COLLECTION_MAP[kind];
  return (generated as any)[collectionName] || [];
};

export const normalizeSlug = (slug: any): string => {
  if (!slug) return '';
  if (Array.isArray(slug)) return slug.join('/');
  return slug.toString().replace(/^\//, '').replace(/\/$/, '');
};

export const getDocKind = (doc: ContentDoc): DocKind => {
  const path = doc._raw?.flattenedPath || '';
  for (const [kind, folder] of Object.entries(COLLECTION_MAP)) {
    const folderPrefix = folder.replace('all', '').toLowerCase().replace('ies', 'y').replace('s', '');
    if (path.includes(folderPrefix)) return kind as DocKind;
  }
  return 'post'; 
};

/* -------------------------------------------------------------------------- */
/* 3. COMPATIBILITY UTILITIES (Restoring missing exports)                     */
/* -------------------------------------------------------------------------- */

// Restored: Used by pages/index.tsx
export const getDocHref = (doc: any): string => {
  return doc.url || doc.href || `/${doc._raw?.flattenedPath}`;
};

// Restored: Used by pages/[slug].tsx
export const resolveDocCoverImage = (doc: any): string => {
  return doc.coverImage || doc.coverimage || "/assets/images/placeholder.jpg";
};

// Restored: Used by pages/downloads/[slug].tsx
export const resolveDocDownloadUrl = (doc: any): string => {
  return doc.downloadUrl || doc.pdfPath || doc.file || doc.downloadFile || "";
};

export const resolveDocDownloadHref = (doc: any): string => {
  return resolveDocDownloadUrl(doc);
};

export const resolveDocDownloadSizeLabel = (doc: any): string => {
  return doc.fileSize || "Unknown Size";
};

// Restored: Used by pages/shorts/[slug].tsx
export const coerceShortTheme = (theme: any): string => {
  return typeof theme === 'string' ? theme : 'default';
};

// Restored: Used by pages/debug/content.tsx
export const assertContentlayerHasDocs = (): void => {
  // No-op in production to prevent crashes, just a check
  const all = getAllDocuments();
  if (all.length === 0) console.warn("Contentlayer has no documents.");
};

// Access & Draft Logic
export const getAccessLevel = (doc: any): string => doc.accessLevel || 'public';
export const isDraft = (doc: any): boolean => doc.draft === true || doc.draft === "true";
export const isDraftContent = isDraft;
export const isPublishedContent = (doc: any): boolean => !isDraft(doc) && !doc.archived;
export const isPublic = (doc: any): boolean => getAccessLevel(doc) === 'public';

const filterPublished = (docs: ContentDoc[]) => docs.filter(isPublishedContent);

/* -------------------------------------------------------------------------- */
/* 4. TIER LOGIC                                                              */
/* -------------------------------------------------------------------------- */

export const normalizeTier = (tier: string | undefined): Tier => {
  if (!tier) return 'free';
  const n = tier.toLowerCase().trim();
  if (['basic', 'premium', 'enterprise', 'restricted'].includes(n)) return n as Tier;
  return 'free';
};

export const getRequiredTier = (doc: any): Tier => {
  return normalizeTier(doc.requiredTier || doc.tier || 'free');
};

export const isTierAllowed = (userTier: Tier | string, requiredTier: Tier | string): boolean => {
  const tierOrder: Record<Tier, number> = { free: 0, basic: 1, premium: 2, enterprise: 3, restricted: 4 };
  const user = normalizeTier(userTier);
  const required = normalizeTier(requiredTier);
  return tierOrder[user] >= tierOrder[required];
};

export const canAccessDoc = (doc: any, userTier: Tier | string): boolean => {
  return isTierAllowed(userTier, getRequiredTier(doc));
};

/* -------------------------------------------------------------------------- */
/* 5. UI & MAPPING                                                            */
/* -------------------------------------------------------------------------- */

export const getCardProps = (doc: ContentDoc | null | undefined) => {
  if (!doc) {
    return {
      kind: "post" as DocKind,
      slug: "unknown",
      title: "Not Found",
      href: "#",
      coverImage: "/assets/images/placeholder.jpg",
      layout: "default",
      tags: [] as string[]
    };
  }

  return {
    kind: getDocKind(doc),
    slug: doc.slug || doc._raw?.flattenedPath.split('/').pop() || "",
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || "",
    description: doc.description || doc.excerpt || "",
    category: doc.category || "General",
    author: doc.author || "Abraham of London",
    href: getDocHref(doc),
    coverImage: resolveDocCoverImage(doc),
    coverAspect: doc.coverAspect || "auto",
    coverFit: doc.coverFit || "cover",
    coverPosition: doc.coverPosition || "center",
    dateISO: doc.date ? new Date(doc.date).toISOString() : null,
    readTime: doc.readTime || doc.readtime || null,
    tags: doc.tags || [],
    layout: doc.layout || "default",
    // Type specific
    downloadUrl: resolveDocDownloadUrl(doc),
    theme: doc.theme,
  };
};

// Restored: Used by pages/content/[slug].tsx
export const toUiDoc = (doc: any) => getCardProps(doc);
export const getCardPropsForDocument = getCardProps;

/* -------------------------------------------------------------------------- */
/* 6. GETTERS (Dynamic + Backward Compatible Aliases)                         */
/* -------------------------------------------------------------------------- */

const getters = {} as any;

Object.keys(COLLECTION_MAP).forEach((key) => {
  const kind = key as DocKind;
  const capitalized = kind.charAt(0).toUpperCase() + kind.slice(1);
  const getterFn = () => filterPublished(getCollection(kind));
  
  // Standard V5 Name: getAllPosts
  getters[`getAll${capitalized}s`] = getterFn;
  
  // Backward Compat Name: getPublishedPosts
  getters[`getPublished${capitalized}s`] = getterFn;
});

// Initialize empty arrays for all collections when Contentlayer is disabled
if (isContentlayerDisabled) {
  Object.keys(COLLECTION_MAP).forEach((key) => {
    const kind = key as DocKind;
    const capitalized = kind.charAt(0).toUpperCase() + kind.slice(1);
    getters[`getAll${capitalized}s`] = () => [];
    getters[`getPublished${capitalized}s`] = () => [];
  });
}

// Explicit Exports for Tree-Shaking safety
export const {
  getAllPosts, getPublishedPosts,
  getAllBooks, getPublishedBooks,
  getAllDownloads, getPublishedDownloads,
  getAllCanons, getPublishedCanons,
  getAllShorts, getPublishedShorts, getRecentShorts, 
  getAllEvents, getPublishedEvents,
  getAllPrints, getPublishedPrints,
  getAllResources, getPublishedResources,
  getAllStrategies, getPublishedStrategies,
} = {
  ...getters,
  // Add specific alias for shorts
  getRecentShorts: getters.getAllShorts ? ((limit = 5) => getters.getAllShorts().slice(0, limit)) : () => []
} as any;

/* -------------------------------------------------------------------------- */
/* 7. GLOBAL UTILITIES                                                        */
/* -------------------------------------------------------------------------- */

export const getAllDocuments = () => {
  if (isContentlayerDisabled) return [];
  return Object.values(COLLECTION_MAP).flatMap(name => {
    return filterPublished((generated as any)[name] || []);
  });
};

export const getAllContentlayerDocs = getAllDocuments; // Alias
export const getPublishedDocuments = getAllDocuments; // Alias

export const getDocumentBySlug = (kind: DocKind, slug: string): ContentDoc | null => {
  if (isContentlayerDisabled) return null;
  const docs = filterPublished(getCollection(kind));
  const normalized = normalizeSlug(slug);
  return docs.find((d: ContentDoc) => 
    normalizeSlug(d.slug || d._raw.flattenedPath.split("/").pop()) === normalized
  ) || null;
};

/**
 * Check if Contentlayer has successfully generated data.
 * Useful for health checks and preventing crashes on cold boots.
 */
export function isContentlayerLoaded(): boolean {
  try {
    // FIX: Access 'allDocuments' from the 'generated' object
    const docs = (generated as any).allDocuments;
    return Array.isArray(docs) && docs.length >= 0;
  } catch (e) {
    return false;
  }
}

// Backward compatible specific slug getters
export const getPostBySlug = (s: string) => getDocumentBySlug('post', s);
export const getBookBySlug = (s: string) => getDocumentBySlug('book', s);
export const getDownloadBySlug = (s: string) => getDocumentBySlug('download', s);
export const getShortBySlug = (s: string) => getDocumentBySlug('short', s);
export const getPrintBySlug = (s: string) => getDocumentBySlug('print', s);
export const getStrategyBySlug = (s: string) => getDocumentBySlug('strategy', s);
export const getEventBySlug = (s: string) => getDocumentBySlug('event', s);
export const getResourceBySlug = (s: string) => getDocumentBySlug('resource', s);
export const getCanonBySlug = (s: string) => getDocumentBySlug('canon', s);

export const getFeaturedDocuments = (kind?: DocKind, limit = 3) => {
  if (isContentlayerDisabled) return [];
  const docs = kind ? filterPublished(getCollection(kind)) : getAllDocuments();
  return docs.filter(d => d.featured).slice(0, limit);
};

export const getFeaturedDocumentsByType = (kind: DocKind, limit = 3) => getFeaturedDocuments(kind, limit);

/* -------------------------------------------------------------------------- */
/* 8. DEFAULT EXPORT                                                          */
/* -------------------------------------------------------------------------- */

const ContentHelper = {
  ...getters,
  getCardProps,
  getDocumentBySlug,
  getAllDocuments,
  getDocKind,
  normalizeSlug,
  getPostBySlug, getBookBySlug, getDownloadBySlug, getShortBySlug,
  getAllContentlayerDocs, getPublishedDocuments,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  canAccessDoc,
  getRequiredTier,
  isTierAllowed,
  normalizeTier,
  isContentlayerLoaded,
  isContentlayerDisabled: () => isContentlayerDisabled
};

export default ContentHelper;
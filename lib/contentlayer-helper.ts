/* lib/contentlayer-helper.ts - UPDATED WITHOUT DYNAMIC IMPORT */
/* -------------------------------------------------------------------------- */
/* 1. TYPES & REGISTRY                                                        */
/* -------------------------------------------------------------------------- */

export type DocKind = 
  | "post" | "book" | "download" | "canon" | "short" | "event" 
  | "resource" | "strategy" | "article" | "guide" | "tutorial" 
  | "caseStudy" | "whitepaper" | "report" | "newsletter" | "sermon" 
  | "devotional" | "prayer" | "testimony" | "podcast" | "video" 
  | "course" | "lesson" | "print";

export interface ContentDoc {
  _id: string;
  _raw: { flattenedPath: string; sourceFileName: string; sourceFilePath: string; contentType: string; };
  type: string;
  title: string;
  slug?: string;
  date?: string;
  draft?: boolean | string;
  archived?: boolean | string;
  [key: string]: any;
}

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

// Initialize with empty data
let runtimeData: any = {
  allPosts: [],
  allBooks: [],
  allDownloads: [],
  allCanons: [],
  allShorts: [],
  allEvents: [],
  allResources: [],
  allPrints: [],
  allStrategies: [],
  allArticles: [],
  allGuides: [],
  allTutorials: [],
  allCaseStudies: [],
  allWhitepapers: [],
  allReports: [],
  allNewsletters: [],
  allSermons: [],
  allDevotionals: [],
  allPrayers: [],
  allTestimonies: [],
  allPodcasts: [],
  allVideos: [],
  allCourses: [],
  allLessons: [],
  allDocuments: []
};

/* -------------------------------------------------------------------------- */
/* 2. DYNAMIC DATA ACCESS - ALL EXPORTS                                       */
/* -------------------------------------------------------------------------- */

const getData = (collection: string): any[] => {
  return runtimeData?.[collection] || [];
};

// Export ALL individual getters
export const getAllPosts = () => getData("allPosts");
export const getAllBooks = () => getData("allBooks");
export const getAllDownloads = () => getData("allDownloads");
export const getAllCanons = () => getData("allCanons");
export const getAllShorts = () => getData("allShorts");
export const getAllEvents = () => getData("allEvents");
export const getAllResources = () => getData("allResources");
export const getAllPrints = () => getData("allPrints");
export const getAllStrategies = () => getData("allStrategies");
export const getAllArticles = () => getData("allArticles");
export const getAllGuides = () => getData("allGuides");
export const getAllTutorials = () => getData("allTutorials");
export const getAllCaseStudies = () => getData("allCaseStudies");
export const getAllWhitepapers = () => getData("allWhitepapers");
export const getAllReports = () => getData("allReports");
export const getAllNewsletters = () => getData("allNewsletters");
export const getAllSermons = () => getData("allSermons");
export const getAllDevotionals = () => getData("allDevotionals");
export const getAllPrayers = () => getData("allPrayers");
export const getAllTestimonies = () => getData("allTestimonies");
export const getAllPodcasts = () => getData("allPodcasts");
export const getAllVideos = () => getData("allVideos");
export const getAllCourses = () => getData("allCourses");
export const getAllLessons = () => getData("allLessons");

export const getAllDocuments = () => runtimeData?.allDocuments || [];

/* -------------------------------------------------------------------------- */
/* 3. PUBLISHED VARIANT GETTERS                                               */
/* -------------------------------------------------------------------------- */

export const getPublishedPosts = () => getAllPosts().filter(d => !d.draft);
export const getPublishedDownloads = () => getAllDownloads().filter(d => !d.draft);
export const getPublishedShorts = () => getAllShorts().filter(d => !d.draft);
export const getRecentShorts = (limit: number = 5) => getPublishedShorts().slice(0, limit);

export const getPublishedDocuments = <T extends ContentDoc>(docs: T[] = getAllPosts() as T[]): T[] => {
  return docs.filter(doc => !doc.draft);
};

/* -------------------------------------------------------------------------- */
/* 4. CORE UTILITIES                                                          */
/* -------------------------------------------------------------------------- */

export const normalizeSlug = (slug: any): string => {
  if (!slug) return '';
  if (Array.isArray(slug)) return slug.join('/');
  return slug.toString().replace(/^\//, '').replace(/\/$/, '');
};

export const getDocKind = (doc: ContentDoc): DocKind => {
  return doc.type?.toLowerCase() as DocKind || 'post';
};

export const resolveDocCoverImage = (doc: any) => doc.coverImage || "/assets/images/placeholder.jpg";
export const resolveDocDownloadUrl = (doc: any) => doc.downloadUrl || doc.file || "";
export const resolveDocDownloadHref = (doc: any) => doc.downloadUrl || doc.file || "";
export const getAccessLevel = (doc: any) => doc.accessLevel || 'public';

export const getDocumentBySlug = (slug: string): ContentDoc | null => {
  const allDocs = getAllDocuments();
  const normalized = normalizeSlug(slug);
  return allDocs.find(d => normalizeSlug(d.slug || d._raw.flattenedPath) === normalized) || null;
};

/* -------------------------------------------------------------------------- */
/* 5. ADDITIONAL UTILITIES                                                    */
/* -------------------------------------------------------------------------- */

export const getDocHref = (doc: ContentDoc): string => {
  const slug = doc.slug || doc._raw?.flattenedPath?.split('/').pop();
  const type = getDocKind(doc);
  const typePlural = type === 'post' ? 'blog' : `${type}s`;
  return `/${typePlural}/${slug}`;
};

export const getAllContentlayerDocs = getAllDocuments;
export const isDraftContent = (doc: ContentDoc): boolean => doc.draft === true;
export const isDraft = (doc: ContentDoc): boolean => doc.draft === true;

export const getPrintBySlug = (slug: string): ContentDoc | null => {
  const prints = getAllPrints();
  return prints.find(p => p.slug === slug || p._raw.flattenedPath.includes(slug)) || null;
};

export const getStrategyBySlug = (slug: string): ContentDoc | null => {
  const strategies = getAllStrategies();
  return strategies.find(s => s.slug === slug || s._raw.flattenedPath.includes(slug)) || null;
};

export const toUiDoc = (doc: ContentDoc): any => {
  return {
    ...doc,
    href: getDocHref(doc),
    coverImage: doc.coverImage || doc.coverimage || '/assets/images/placeholder.jpg',
    description: doc.description || doc.excerpt || '',
  };
};

export const isContentlayerLoaded = (): boolean => {
  return runtimeData !== null;
};

export const assertContentlayerHasDocs = (): boolean => {
  const hasDocs = getAllDocuments().length > 0;
  if (!hasDocs) console.warn("⚠️ Contentlayer: No documents loaded");
  return hasDocs;
};

/* -------------------------------------------------------------------------- */
/* 6. SYSTEM INTERFACE                                                       */
/* -------------------------------------------------------------------------- */

const ContentHelper = {
  _setRuntimeData: (data: any) => { runtimeData = data; },
  getAllDocuments,
  getDocumentBySlug,
  normalizeSlug,
  getDocKind,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  assertContentlayerHasDocs,
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllCanons,
  getAllShorts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllStrategies,
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
  getDocHref,
  getPublishedShorts,
  getRecentShorts,
  getPublishedDocuments,
  getAllContentlayerDocs,
  isDraftContent,
  isDraft,
  getPublishedDownloads,
  getPublishedPosts,
  getPrintBySlug,
  getStrategyBySlug,
  toUiDoc,
  isContentlayerLoaded,
  resolveDocDownloadHref
};

export default ContentHelper;
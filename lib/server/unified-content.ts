// lib/server/unified-content.ts
// Server-side unified content system for Abraham of London
// Synchronized with ContentHelper v5.0.0

import ContentHelper, { 
  type DocKind,
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllCanons,
  getAllShorts,
  getAllEvents,
  getAllResources,
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
  getAllPrints
} from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/* 1. TYPES & INTERFACES                                                      */
/* -------------------------------------------------------------------------- */

export interface BaseContent {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
  draft?: boolean;
  published?: boolean;
  status?: string;
  author?: string | { name: string; [key: string]: any } | null;
  category?: string;
  [key: string]: any;
}

// Exhaustive Union of all 24 types + 'page'
export type ContentType =
  | "post" | "book" | "download" | "canon" | "short" | "event"
  | "resource" | "strategy" | "article" | "guide" | "tutorial"
  | "caseStudy" | "whitepaper" | "report" | "newsletter" | "sermon"
  | "devotional" | "prayer" | "testimony" | "podcast" | "video"
  | "course" | "lesson" | "print" 
  | "page"; // Legacy support

export interface UnifiedContent extends BaseContent {
  id: string;
  type: ContentType;
  url: string;

  // Standardization
  readTime?: string | number;
  accessLevel?: string;
  lockMessage?: string;

  // Context-Specific Fields
  volumeNumber?: string | number; // Canon
  order?: number;
  resourceType?: string;
  applications?: string[];
  downloadFile?: string;
  fileSize?: string;
  eventDate?: string;
  location?: string;
  isbn?: string;
  format?: string;
  publisher?: string;
  pages?: number;
  theme?: string; // Shorts
  bibleVerse?: string; // Devotional
  audioUrl?: string; // Podcast
  videoUrl?: string; // Video
}

export type UnifiedContentSummaryType = "page" | "download" | "event" | "media" | "academic";

/* -------------------------------------------------------------------------- */
/* 2. HELPERS                                                                 */
/* -------------------------------------------------------------------------- */

function getAuthorName(item: any): string | undefined {
  if (!item || !item.author) return undefined;
  if (typeof item.author === "string") return item.author;
  if (typeof item.author === "object" && item.author !== null) {
    return item.author.name;
  }
  return undefined;
}

// Maps the 24 types to high-level buckets for UI summaries
function toSummaryType(type: ContentType): UnifiedContentSummaryType {
  const map: Record<string, UnifiedContentSummaryType> = {
    download: "download",
    event: "event",
    podcast: "media",
    video: "media",
    sermon: "media",
    course: "academic",
    lesson: "academic",
    canon: "academic",
    whitepaper: "download",
    report: "download",
  };
  return map[type] || "page";
}

// Centralized URL Resolver matching ContentHelper Registry
export function getContentUrl(type: ContentType, slug: string): string {
  const typeMap: Record<string, string> = {
    post: "blog",
    essay: "blog", // Alias
    book: "books",
    download: "downloads",
    event: "events",
    print: "prints",
    resource: "resources",
    canon: "canon",
    strategy: "strategy", // Singular in URL map
    short: "shorts",
    article: "articles",
    guide: "guides",
    tutorial: "tutorials",
    caseStudy: "case-studies",
    whitepaper: "whitepapers",
    report: "reports",
    newsletter: "newsletters",
    sermon: "sermons",
    devotional: "devotionals",
    prayer: "prayers",
    testimony: "testimonies",
    podcast: "podcasts",
    video: "videos",
    course: "courses",
    lesson: "lessons",
    page: "",
  };
  
  const path = typeMap[type];
  // If path is undefined, default to root or type name
  const basePath = path !== undefined ? path : type.toLowerCase() + "s";
  return basePath ? `/${basePath}/${slug}` : `/${slug}`;
}

async function safeLoadContent(
  label: string,
  loader: () => any[] | Promise<any[]> | undefined,
  type: ContentType,
): Promise<UnifiedContent[]> {
  try {
    let result: any[] | undefined;
    try {
      const data = loader();
      result = data instanceof Promise ? await data : data;
    } catch (loaderError) {
      console.warn(`[unified-content] Loader for ${label} failed:`, loaderError);
      return [];
    }

    if (!result || !Array.isArray(result)) return [];

    return result
      .filter((item) => item && (item.slug || item._raw?.flattenedPath))
      .map((item: any) => {
        const slug = item.slug || item._raw?.flattenedPath.split('/').pop();
        
        return {
          id: `${type}-${slug}`,
          type,
          slug,
          title: item.title || "Untitled",
          url: getContentUrl(type, slug),

          excerpt: item.excerpt || item.description || item.socialCaption,
          description: item.description,
          date: item.date,
          coverImage: item.coverImage || item.coverimage || item.image,
          tags: Array.isArray(item.tags) ? item.tags : [],
          featured: Boolean(item.featured),
          draft: Boolean(item.draft),
          published: item.published !== false,
          status: item.status || (item.draft ? "draft" : "published"),
          author: getAuthorName(item),
          category: item.category,

          readTime: item.readTime || item.readtime || item.readingTime,
          accessLevel: item.accessLevel,
          lockMessage: item.lockMessage,

          // Type-Specific Field Mapping
          ...(type === "canon" ? { volumeNumber: item.volumeNumber, order: item.order } : {}),
          ...(type === "download" ? { downloadFile: item.downloadFile, fileSize: item.fileSize } : {}),
          ...(type === "event" ? { eventDate: item.eventDate, location: item.location } : {}),
          ...(type === "short" ? { theme: item.theme } : {}),
          ...(type === "devotional" ? { bibleVerse: item.bibleVerse } : {}),
          ...(type === "book" ? { isbn: item.isbn, publisher: item.publisher } : {}),
          
          _raw: item,
        } as UnifiedContent;
      });
  } catch (error) {
    console.error(`[unified-content] Error processing ${label}:`, error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* 3. MAIN LOADERS                                                            */
/* -------------------------------------------------------------------------- */

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  // console.time("[unified-content] Total load time"); // Optional logging

  try {
    // 1. Definition of all 24 loaders
    const loaders = [
      { label: "posts", loader: getAllPosts, type: "post" as ContentType },
      { label: "books", loader: getAllBooks, type: "book" as ContentType },
      { label: "downloads", loader: getAllDownloads, type: "download" as ContentType },
      { label: "canons", loader: getAllCanons, type: "canon" as ContentType },
      { label: "shorts", loader: getAllShorts, type: "short" as ContentType },
      { label: "events", loader: getAllEvents, type: "event" as ContentType },
      { label: "prints", loader: getAllPrints, type: "print" as ContentType },
      { label: "resources", loader: getAllResources, type: "resource" as ContentType },
      { label: "strategies", loader: getAllStrategies, type: "strategy" as ContentType },
      { label: "articles", loader: getAllArticles, type: "article" as ContentType },
      { label: "guides", loader: getAllGuides, type: "guide" as ContentType },
      { label: "tutorials", loader: getAllTutorials, type: "tutorial" as ContentType },
      { label: "caseStudies", loader: getAllCaseStudies, type: "caseStudy" as ContentType },
      { label: "whitepapers", loader: getAllWhitepapers, type: "whitepaper" as ContentType },
      { label: "reports", loader: getAllReports, type: "report" as ContentType },
      { label: "newsletters", loader: getAllNewsletters, type: "newsletter" as ContentType },
      { label: "sermons", loader: getAllSermons, type: "sermon" as ContentType },
      { label: "devotionals", loader: getAllDevotionals, type: "devotional" as ContentType },
      { label: "prayers", loader: getAllPrayers, type: "prayer" as ContentType },
      { label: "testimonies", loader: getAllTestimonies, type: "testimony" as ContentType },
      { label: "podcasts", loader: getAllPodcasts, type: "podcast" as ContentType },
      { label: "videos", loader: getAllVideos, type: "video" as ContentType },
      { label: "courses", loader: getAllCourses, type: "course" as ContentType },
      { label: "lessons", loader: getAllLessons, type: "lesson" as ContentType },
    ];

    // 2. Parallel Execution
    const results = await Promise.all(
      loaders.map(({ label, loader, type }) => safeLoadContent(label, loader, type))
    );

    // 3. Flatten and Sort
    const allContent = results.flat();

    allContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    // console.timeEnd("[unified-content] Total load time");
    return allContent;
  } catch (error) {
    console.error("[unified-content] Critical error loading content:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* 4. PUBLIC API                                                              */
/* -------------------------------------------------------------------------- */

export async function getUnifiedContentByType(type: ContentType): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.type === type);
}

export async function getUnifiedContentBySlug(slug: string, type?: ContentType): Promise<UnifiedContent | null> {
  const all = await getAllUnifiedContent();
  const found = all.find((item) => {
    const slugMatch = item.slug === slug;
    return type ? slugMatch && item.type === type : slugMatch;
  });
  return found || null;
}

export async function getPublishedUnifiedContent(): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.published);
}

/* -------------------------------------------------------------------------- */
/* 5. QUERY & SEARCH                                                          */
/* -------------------------------------------------------------------------- */

export interface ContentQuery {
  type?: ContentType | ContentType[];
  tag?: string;
  featured?: boolean;
  author?: string;
  year?: string;
  search?: string;
  limit?: number;
  skip?: number;
  sortBy?: "date" | "title" | "featured";
  sortOrder?: "asc" | "desc";
}

export async function queryUnifiedContent(options: ContentQuery = {}): Promise<UnifiedContent[]> {
  let content = await getPublishedUnifiedContent();

  if (options.type) {
    const types = Array.isArray(options.type) ? options.type : [options.type];
    content = content.filter((item) => types.includes(item.type));
  }

  if (options.tag) {
    content = content.filter((item) =>
      item.tags?.some((tag) => tag.toLowerCase() === options.tag!.toLowerCase())
    );
  }

  if (options.featured !== undefined) {
    content = content.filter((item) => item.featured === options.featured);
  }

  if (options.search) {
    const term = options.search.toLowerCase();
    content = content.filter((item) =>
      item.title.toLowerCase().includes(term) ||
      item.excerpt?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term)
    );
  }

  // Sorting
  content.sort((a, b) => {
    if (options.sortBy === "title") {
      return options.sortOrder === "asc" 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    }
    // Default date sort
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return options.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const skip = options.skip || 0;
  const limit = options.limit || content.length;
  return content.slice(skip, skip + limit);
}

export async function searchUnifiedContent(query: string): Promise<UnifiedContent[]> {
  return queryUnifiedContent({ search: query });
}

/* -------------------------------------------------------------------------- */
/* 6. STATS & UTILS                                                           */
/* -------------------------------------------------------------------------- */

export interface ContentStats {
  total: number;
  byType: Record<string, number>;
  byYear: Record<string, number>;
  featured: number;
}

export function getYearFromDate(date?: string): string {
  if (!date) return "Undated";
  try {
    const year = new Date(date).getFullYear();
    return isNaN(year) ? "Undated" : year.toString();
  } catch {
    return "Undated";
  }
}

export async function getContentStats(): Promise<ContentStats> {
  const all = await getAllUnifiedContent();
  const stats: ContentStats = {
    total: all.length,
    byType: {},
    byYear: {},
    featured: 0,
  };

  all.forEach((item) => {
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    if (item.date) {
      const year = getYearFromDate(item.date);
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
    }
    if (item.featured) stats.featured++;
  });

  return stats;
}

export function formatReadTime(readTime?: string | number): string | undefined {
  if (!readTime) return undefined;
  if (typeof readTime === "number") return `${readTime} min read`;
  return String(readTime).includes("min") ? String(readTime) : `${readTime} min read`;
}

// Default export object
const unifiedContent = {
  getAllUnifiedContent,
  getUnifiedContentByType,
  getUnifiedContentBySlug,
  getPublishedUnifiedContent,
  queryUnifiedContent,
  searchUnifiedContent,
  getContentStats,
  getContentUrl,
  formatReadTime,
  getYearFromDate,
};

export default unifiedContent;
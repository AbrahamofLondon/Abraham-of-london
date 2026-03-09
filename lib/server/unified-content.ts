// lib/server/unified-content.ts
// Server-side unified content system for Abraham of London
// Compile-safe: tolerates partial content registries

import * as Content from "@/lib/content";
import { safeSlice } from "@/lib/utils/safe";

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
  author?: string | { name: string; [key: string]: unknown } | null;
  category?: string;
  [key: string]: unknown;
}

export type ContentType =
  | "post"
  | "book"
  | "download"
  | "canon"
  | "short"
  | "event"
  | "resource"
  | "strategy"
  | "article"
  | "guide"
  | "tutorial"
  | "caseStudy"
  | "whitepaper"
  | "report"
  | "newsletter"
  | "sermon"
  | "devotional"
  | "prayer"
  | "testimony"
  | "podcast"
  | "video"
  | "course"
  | "lesson"
  | "print"
  | "page";

export interface UnifiedContent extends BaseContent {
  id: string;
  type: ContentType;
  url: string;
  readTime?: string | number;
  accessLevel?: string;
  lockMessage?: string;
  volumeNumber?: string | number;
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
  theme?: string;
  bibleVerse?: string;
  audioUrl?: string;
  videoUrl?: string;
}

type RawContentItem = Record<string, unknown>;
type LoaderFn = () => RawContentItem[] | Promise<RawContentItem[]> | undefined;

/* -------------------------------------------------------------------------- */
/* 2. HELPERS                                                                 */
/* -------------------------------------------------------------------------- */

function getAuthorName(item: RawContentItem): string | undefined {
  const author = item.author;

  if (!author) return undefined;

  if (typeof author === "string") return author;

  if (typeof author === "object" && !Array.isArray(author)) {
    const maybeName = (author as { name?: unknown }).name;
    return typeof maybeName === "string" ? maybeName : undefined;
  }

  if (Array.isArray(author) && author.length > 0) {
    const first = author[0];
    if (typeof first === "string") return first;
    if (typeof first === "object" && first && "name" in first) {
      const maybeName = (first as { name?: unknown }).name;
      return typeof maybeName === "string" ? maybeName : undefined;
    }
  }

  return undefined;
}

export function getContentUrl(type: ContentType, slug: string): string {
  const typeMap: Record<ContentType, string> = {
    post: "blog",
    book: "books",
    download: "downloads",
    canon: "canon",
    short: "shorts",
    event: "events",
    resource: "resources",
    strategy: "strategies",
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
    print: "prints",
    page: "",
  };

  const basePath = typeMap[type];
  return basePath ? `/${basePath}/${slug}` : `/${slug}`;
}

function resolveSlug(item: RawContentItem): string | null {
  if (typeof item.slug === "string" && item.slug.trim()) {
    return item.slug.replace(/^\/+/, "").replace(/^shorts\//, "");
  }

  const raw = item._raw;
  if (typeof raw === "object" && raw && "flattenedPath" in raw) {
    const flattenedPath = (raw as { flattenedPath?: unknown }).flattenedPath;
    if (typeof flattenedPath === "string" && flattenedPath.trim()) {
      const leaf = flattenedPath.split("/").pop();
      return leaf || null;
    }
  }

  return null;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function getLoader(name: string): LoaderFn {
  const maybeLoader = (Content as Record<string, unknown>)[name];
  if (typeof maybeLoader === "function") {
    return maybeLoader as LoaderFn;
  }
  return () => [];
}

async function safeLoadContent(
  label: string,
  loader: LoaderFn,
  type: ContentType
): Promise<UnifiedContent[]> {
  try {
    const loaded = loader();
    const result = loaded instanceof Promise ? await loaded : loaded;

    if (!result || !Array.isArray(result)) return [];

    return result
      .filter((item): item is RawContentItem => !!item && typeof item === "object")
      .map((item) => {
        const slug = resolveSlug(item);
        if (!slug) return null;

        return {
          id: `${type}-${slug}`,
          type,
          slug,
          title: typeof item.title === "string" ? item.title : "Untitled",
          url: getContentUrl(type, slug),

          excerpt:
            typeof item.excerpt === "string"
              ? item.excerpt
              : typeof item.description === "string"
              ? item.description
              : typeof item.socialCaption === "string"
              ? item.socialCaption
              : undefined,

          description: typeof item.description === "string" ? item.description : undefined,
          date: typeof item.date === "string" ? item.date : undefined,
          coverImage:
            typeof item.coverImage === "string"
              ? item.coverImage
              : typeof item.coverimage === "string"
              ? item.coverimage
              : typeof item.image === "string"
              ? item.image
              : undefined,

          tags: normalizeStringArray(item.tags),
          featured: Boolean(item.featured),
          draft: Boolean(item.draft),
          published: item.published !== false,
          status:
            typeof item.status === "string"
              ? item.status
              : item.draft
              ? "draft"
              : "published",

          author: getAuthorName(item),
          category: typeof item.category === "string" ? item.category : undefined,

          readTime:
            typeof item.readTime === "string" || typeof item.readTime === "number"
              ? item.readTime
              : typeof item.readtime === "string" || typeof item.readtime === "number"
              ? item.readtime
              : typeof item.readingTime === "string" || typeof item.readingTime === "number"
              ? item.readingTime
              : undefined,

          accessLevel:
            typeof item.accessLevel === "string" ? item.accessLevel : undefined,
          lockMessage:
            typeof item.lockMessage === "string" ? item.lockMessage : undefined,

          ...(type === "canon"
            ? {
                volumeNumber:
                  typeof item.volumeNumber === "string" ||
                  typeof item.volumeNumber === "number"
                    ? item.volumeNumber
                    : undefined,
                order: typeof item.order === "number" ? item.order : undefined,
              }
            : {}),

          ...(type === "download"
            ? {
                downloadFile:
                  typeof item.downloadFile === "string" ? item.downloadFile : undefined,
                fileSize: typeof item.fileSize === "string" ? item.fileSize : undefined,
              }
            : {}),

          ...(type === "event"
            ? {
                eventDate: typeof item.eventDate === "string" ? item.eventDate : undefined,
                location: typeof item.location === "string" ? item.location : undefined,
              }
            : {}),

          ...(type === "short"
            ? {
                theme: typeof item.theme === "string" ? item.theme : undefined,
              }
            : {}),

          ...(type === "devotional"
            ? {
                bibleVerse:
                  typeof item.bibleVerse === "string" ? item.bibleVerse : undefined,
              }
            : {}),

          ...(type === "book"
            ? {
                isbn: typeof item.isbn === "string" ? item.isbn : undefined,
                publisher:
                  typeof item.publisher === "string" ? item.publisher : undefined,
              }
            : {}),

          ...(type === "video"
            ? {
                videoUrl: typeof item.videoUrl === "string" ? item.videoUrl : undefined,
              }
            : {}),

          ...(type === "podcast"
            ? {
                audioUrl: typeof item.audioUrl === "string" ? item.audioUrl : undefined,
              }
            : {}),

          _raw: item,
        } as UnifiedContent;
      })
      .filter((item): item is UnifiedContent => item !== null);
  } catch (error) {
    console.error(`[unified-content] Error processing ${label}:`, error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* 3. MAIN LOADERS (WITH CACHE)                                               */
/* -------------------------------------------------------------------------- */

let contentCache: UnifiedContent[] | null = null;

const CONTENT_LOADERS: Array<{
  label: string;
  exportName: string;
  type: ContentType;
}> = [
  { label: "posts", exportName: "getAllPosts", type: "post" },
  { label: "books", exportName: "getAllBooks", type: "book" },
  { label: "downloads", exportName: "getAllDownloads", type: "download" },
  { label: "canons", exportName: "getAllCanons", type: "canon" },
  { label: "shorts", exportName: "getAllShorts", type: "short" },
  { label: "events", exportName: "getAllEvents", type: "event" },
  { label: "prints", exportName: "getAllPrints", type: "print" },
  { label: "resources", exportName: "getAllResources", type: "resource" },
  { label: "strategies", exportName: "getAllStrategies", type: "strategy" },
  { label: "articles", exportName: "getAllArticles", type: "article" },
  { label: "guides", exportName: "getAllGuides", type: "guide" },
  { label: "tutorials", exportName: "getAllTutorials", type: "tutorial" },
  { label: "caseStudies", exportName: "getAllCaseStudies", type: "caseStudy" },
  { label: "whitepapers", exportName: "getAllWhitepapers", type: "whitepaper" },
  { label: "reports", exportName: "getAllReports", type: "report" },
  { label: "newsletters", exportName: "getAllNewsletters", type: "newsletter" },
  { label: "sermons", exportName: "getAllSermons", type: "sermon" },
  { label: "devotionals", exportName: "getAllDevotionals", type: "devotional" },
  { label: "prayers", exportName: "getAllPrayers", type: "prayer" },
  { label: "testimonies", exportName: "getAllTestimonies", type: "testimony" },
  { label: "podcasts", exportName: "getAllPodcasts", type: "podcast" },
  { label: "videos", exportName: "getAllVideos", type: "video" },
  { label: "courses", exportName: "getAllCourses", type: "course" },
  { label: "lessons", exportName: "getAllLessons", type: "lesson" },
];

export async function getAllUnifiedContent(
  forceRefresh = false
): Promise<UnifiedContent[]> {
  if (contentCache && !forceRefresh && process.env.NODE_ENV === "production") {
    return contentCache;
  }

  try {
    const results = await Promise.all(
      CONTENT_LOADERS.map(({ label, exportName, type }) =>
        safeLoadContent(label, getLoader(exportName), type)
      )
    );

    const allContent = results.flat();

    allContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    contentCache = allContent;
    return allContent;
  } catch (error) {
    console.error("[unified-content] Critical error loading content:", error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* 4. PUBLIC API                                                              */
/* -------------------------------------------------------------------------- */

export async function getUnifiedContentByType(
  type: ContentType
): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((item) => item.type === type);
}

export async function getUnifiedContentBySlug(
  slug: string,
  type?: ContentType
): Promise<UnifiedContent | null> {
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

export async function queryUnifiedContent(
  options: ContentQuery = {}
): Promise<UnifiedContent[]> {
  let content = await getPublishedUnifiedContent();

  if (options.type) {
    const types = Array.isArray(options.type) ? options.type : [options.type];
    content = content.filter((item) => types.includes(item.type));
  }

  if (options.tag) {
    const targetTag = options.tag.toLowerCase();
    content = content.filter((item) =>
      item.tags?.some((tag) => tag.toLowerCase() === targetTag)
    );
  }

  if (options.featured !== undefined) {
    content = content.filter((item) => item.featured === options.featured);
  }

  if (options.author) {
    const targetAuthor = options.author.toLowerCase();
    content = content.filter(
      (item) => typeof item.author === "string" && item.author.toLowerCase() === targetAuthor
    );
  }

  if (options.year) {
    content = content.filter((item) => getYearFromDate(item.date) === options.year);
  }

  if (options.search) {
    const term = options.search.toLowerCase();
    content = content.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.excerpt?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
    );
  }

  content.sort((a, b) => {
    if (options.sortBy === "title") {
      return options.sortOrder === "asc"
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }

    if (options.sortBy === "featured") {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      return options.sortOrder === "asc"
        ? aFeatured - bFeatured
        : bFeatured - aFeatured;
    }

    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return options.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const skip = options.skip || 0;
  const limit = options.limit || content.length;
  return safeSlice(content, skip, skip + limit);
}

export async function searchUnifiedContent(
  query: string
): Promise<UnifiedContent[]> {
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
    return Number.isNaN(year) ? "Undated" : year.toString();
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

    const year = getYearFromDate(item.date);
    stats.byYear[year] = (stats.byYear[year] || 0) + 1;

    if (item.featured) stats.featured += 1;
  });

  return stats;
}

export function formatReadTime(
  readTime?: string | number
): string | undefined {
  if (!readTime) return undefined;
  if (typeof readTime === "number") return `${readTime} min read`;
  return readTime.includes("min") ? readTime : `${readTime} min read`;
}

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
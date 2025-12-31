// lib/server/unified-content.ts
// Server-side unified content system for Abraham of London
// Now wired to Contentlayer via contentlayer-helper

import {
  getPublishedPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
} from "@/lib/contentlayer-helper";

/* -------------------------------------------------------------------------- */
/* STEP 2: Types                                                              */
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

export type ContentType =
  | "essay"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "canon"
  | "strategy"
  | "page";

export interface UnifiedContent extends BaseContent {
  id: string;
  type: ContentType;
  url: string;

  readTime?: string | number;
  accessLevel?: string;
  lockMessage?: string;

  volumeNumber?: number;
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
}

// Client-facing summary type (exported for client compatibility)
export type UnifiedContentSummaryType = "page" | "download" | "event";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getAuthorName(item: any): string | undefined {
  if (!item || !item.author) return undefined;
  if (typeof item.author === "string") return item.author;
  if (typeof item.author === "object" && item.author !== null) {
    return item.author.name;
  }
  return undefined;
}

function toSummaryType(type: ContentType): UnifiedContentSummaryType {
  const typeMap: Record<string, UnifiedContentSummaryType> = {
    download: "download",
    event: "event",
    essay: "page",
    book: "page",
    print: "page",
    resource: "page",
    canon: "page",
    strategy: "page",
    page: "page",
  };
  return typeMap[type] || "page";
}

async function safeLoadContent(
  label: string,
  loader: () => Promise<any[]> | any[] | undefined,
  type: ContentType,
): Promise<UnifiedContent[]> {
  try {
    console.log(`[unified-content] Loading ${label}...`);

    let result: any[] | undefined;
    try {
      const data = loader();
      result = data instanceof Promise ? await data : data;
    } catch (loaderError) {
      console.warn(
        `[unified-content] Loader for ${label} failed:`,
        loaderError,
      );
      return [];
    }

    if (!result || !Array.isArray(result)) {
      console.warn(
        `[unified-content] ${label} returned invalid data:`,
        typeof result,
      );
      return [];
    }

    const unified: UnifiedContent[] = result
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          (item as any).slug &&
          (item as any).title,
      )
      .map((item: any) => ({
        id: `${type}-${item.slug}`,
        type,
        slug: item.slug,
        title: item.title,
        url: getContentUrl(type, item.slug),

        excerpt: item.excerpt,
        description: item.description,
        date: item.date,
        coverImage: item.coverImage || item.image || item.heroImage,
        tags: Array.isArray(item.tags) ? item.tags : [],
        featured: Boolean(item.featured),
        draft: Boolean(item.draft),
        published: item.published !== false,
        status: item.status || (item.draft ? "draft" : "published"),
        author: getAuthorName(item),
        category: item.category,

        readTime: item.readTime || item.readingTime,
        accessLevel: item.accessLevel,
        lockMessage: item.lockMessage,

        ...(type === "book" || type === "canon"
          ? {
              volumeNumber: item.volumeNumber,
              order: item.order,
            }
          : {}),

        ...(type === "resource"
          ? {
              resourceType: item.resourceType,
              applications: item.applications,
            }
          : {}),

        ...(type === "download"
          ? {
              downloadFile: item.downloadFile,
              fileSize: item.fileSize,
            }
          : {}),

        ...(type === "event"
          ? {
              eventDate: item.eventDate,
              location: item.location,
            }
          : {}),

        ...(type === "book"
          ? {
              isbn: item.isbn,
              format: item.format,
              publisher: item.publisher,
              pages: item.pages,
            }
          : {}),

        _raw: item,
      }));

    console.log(`[unified-content] Loaded ${label}: ${unified.length} items`);
    return unified;
  } catch (error) {
    console.error(`[unified-content] Error loading ${label}:`, error);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Main API functions                                                         */
/* -------------------------------------------------------------------------- */

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  console.time("[unified-content] Total load time");

  try {
    const loaders = [
      {
        label: "essays",
        loader: () => getPublishedPosts(),
        type: "essay" as ContentType,
      },
      {
        label: "books",
        loader: () => getAllBooks(),
        type: "book" as ContentType,
      },
      {
        label: "canon",
        loader: () => getAllCanons(),
        type: "canon" as ContentType,
      },
      {
        label: "downloads",
        loader: () => getAllDownloads(),
        type: "download" as ContentType,
      },
      {
        label: "events",
        loader: () => getAllEvents(),
        type: "event" as ContentType,
      },
      {
        label: "prints",
        loader: () => getAllPrints(),
        type: "print" as ContentType,
      },
      {
        label: "resources",
        loader: () => getAllResources(),
        type: "resource" as ContentType,
      },
      {
        label: "strategies",
        loader: () => getAllStrategies(),
        type: "strategy" as ContentType,
      },
    ];

    const results = await Promise.all(
      loaders.map(({ label, loader, type }) =>
        safeLoadContent(label, loader, type),
      ),
    );

    const allContent = results.flat();

    allContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    console.timeEnd("[unified-content] Total load time");
    console.log(
      `[unified-content] Total items loaded: ${allContent.length}`,
    );

    return allContent;
  } catch (error) {
    console.error("[unified-content] Critical error loading content:", error);
    return [];
  }
}

export async function getUnifiedContentByType(
  type: ContentType,
): Promise<UnifiedContent[]> {
  try {
    const allContent = await getAllUnifiedContent();
    return allContent.filter((item) => item.type === type);
  } catch (error) {
    console.error(
      "[unified-content] Error getting content by type:",
      error,
    );
    return [];
  }
}

export async function getUnifiedContentBySlug(
  slug: string,
  type?: ContentType,
): Promise<UnifiedContent | null> {
  try {
    const allContent = await getAllUnifiedContent();

    const filteredContent = allContent.filter((item) => {
      const slugMatch = item.slug === slug;
      if (type) {
        return slugMatch && item.type === type;
      }
      return slugMatch;
    });

    if (filteredContent.length === 0) return null;
    return filteredContent[0];
  } catch (error) {
    console.error(
      "[unified-content] Error getting content by slug:",
      error,
    );
    return null;
  }
}

export async function getPublishedUnifiedContent(): Promise<UnifiedContent[]> {
  try {
    const allContent = await getAllUnifiedContent();
    return allContent.filter((item) => {
      const isDraft = item.draft === true;
      const isNotPublished = item.published === false;
      const isStatusDraft = item.status === "draft";
      const isStatusArchived = item.status === "archived";
      const isStatusPrivate = item.status === "private";
      const isStatusScheduled = item.status === "scheduled";

      return !(
        isDraft ||
        isNotPublished ||
        isStatusDraft ||
        isStatusArchived ||
        isStatusPrivate ||
        isStatusScheduled
      );
    });
  } catch (error) {
    console.error(
      "[unified-content] Error getting published content:",
      error,
    );
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Query & search                                                             */
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
  options: ContentQuery = {},
): Promise<UnifiedContent[]> {
  try {
    let content = await getPublishedUnifiedContent();

    if (options.type) {
      const types = Array.isArray(options.type)
        ? options.type
        : [options.type];
      content = content.filter((item) => types.includes(item.type));
    }

    if (options.tag) {
      content = content.filter((item) =>
        item.tags?.some(
          (tag) => tag.toLowerCase() === options.tag!.toLowerCase(),
        ),
      );
    }

    if (options.featured !== undefined) {
      content = content.filter((item) => item.featured === options.featured);
    }

    if (options.author) {
      const searchAuthor = options.author.toLowerCase();
      content = content.filter((item) =>
        (item.author || "").toLowerCase().includes(searchAuthor),
      );
    }

    if (options.year) {
      content = content.filter((item) => {
        if (!item.date) return false;
        const year = getYearFromDate(item.date);
        return year === options.year;
      });
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      content = content.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          item.excerpt?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm),
      );
    }

    const sortBy = options.sortBy || "date";
    const sortOrder = options.sortOrder || "desc";

    content.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case "date":
          aVal = a.date ? new Date(a.date).getTime() : 0;
          bVal = b.date ? new Date(b.date).getTime() : 0;
          break;
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "featured":
          aVal = a.featured ? 1 : 0;
          bVal = b.featured ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === "desc") {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    const skip = options.skip || 0;
    const limit = options.limit || content.length;

    return content.slice(skip, skip + limit);
  } catch (error) {
    console.error("[unified-content] Error querying content:", error);
    return [];
  }
}

export async function searchUnifiedContent(
  query: string,
): Promise<UnifiedContent[]> {
  return queryUnifiedContent({ search: query });
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

export function getContentUrl(type: ContentType, slug: string): string {
  const typeMap: Record<ContentType, string> = {
    essay: "blog",
    book: "books",
    download: "downloads",
    event: "events",
    print: "prints",
    resource: "resources",
    canon: "canon",
    strategy: "strategies",
    page: "",
  };
  const path = typeMap[type];
  return path ? `/${path}/${slug}` : `/${slug}`;
}

export function formatReadTime(
  readTime?: string | number,
): string | undefined {
  if (readTime === undefined || readTime === null) return undefined;

  if (typeof readTime === "number") {
    return `${readTime} min read`;
  }

  if (typeof readTime === "string") {
    const trimmed = readTime.trim();
    if (!trimmed) return undefined;

    const lower = trimmed.toLowerCase();
    if (lower.includes("min") || lower.includes("read")) {
      return trimmed;
    }

    const asNumber = Number(trimmed);
    if (!isNaN(asNumber)) {
      return `${asNumber} min read`;
    }

    return trimmed;
  }

  return undefined;
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

/* -------------------------------------------------------------------------- */
/* Stats & default export                                                     */
/* -------------------------------------------------------------------------- */

export interface ContentStats {
  total: number;
  byType: Record<ContentType, number>;
  byYear: Record<string, number>;
  featured: number;
}

export async function getContentStats(): Promise<ContentStats> {
  const allContent = await getAllUnifiedContent();

  const stats: ContentStats = {
    total: allContent.length,
    byType: {
      essay: 0,
      book: 0,
      download: 0,
      event: 0,
      print: 0,
      resource: 0,
      canon: 0,
      strategy: 0,
      page: 0,
    },
    byYear: {},
    featured: 0,
  };

  allContent.forEach((item) => {
    stats.byType[item.type]++;

    if (item.date) {
      const year = getYearFromDate(item.date);
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
    }

    if (item.featured) stats.featured++;
  });

  return stats;
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
  type: {} as {
    UnifiedContent: UnifiedContent;
    ContentType: ContentType;
    UnifiedContentSummaryType: UnifiedContentSummaryType;
    ContentQuery: ContentQuery;
    ContentStats: ContentStats;
  },
};

export default unifiedContent;

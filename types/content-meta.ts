// types/content-meta.ts

/**
 * Base interface for all content metadata across the site
 * Provides common fields for posts, books, downloads, etc.
 */
export interface ContentMeta {
  // Required core fields
  slug: string;
  title: string;

  // Content information
  subtitle?: string;
  excerpt?: string;
  description?: string;

  // Dates
  date?: string;
  lastModified?: string;
  publishedAt?: string;

  // Categorization
  category?: string;
  tags?: string[];
  categories?: string[];

  // Media
  coverImage?: string;
  coverAlt?: string;
  coverAspect?: string;
  coverFit?: "contain" | "cover" | "fill";
  coverPosition?: string;

  // Reading & SEO
  readTime?: string;
  wordCount?: number;
  canonicalUrl?: string;

  // Status & visibility
  published?: boolean;
  draft?: boolean;
  featured?: boolean;
  archived?: boolean;

  // Authorship
  author?: string;
  authors?: string[];

  // Allow additional fields
  [key: string]: unknown;
}

/**
 * Extended content with body/content for full documents
 */
export interface ContentDocument extends ContentMeta {
  content: string;
  body?: string; // alias for content
  html?: string; // rendered HTML if available
  raw?: string; // raw source content
}

/**
 * Content summary for listings and previews
 */
export interface ContentSummary {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  date?: string;
  category?: string;
  readTime?: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
}

/**
 * Content with navigation context
 */
export interface ContentWithNavigation {
  content: ContentDocument;
  previous?: ContentSummary;
  next?: ContentSummary;
  related?: ContentSummary[];
}

/**
 * Content list with pagination
 */
export interface ContentList {
  items: ContentSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Content filter parameters
 */
export interface ContentFilters {
  category?: string;
  tag?: string;
  author?: string;
  featured?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "title" | "readTime" | "popularity";
  sortOrder?: "asc" | "desc";
}

/**
 * Content statistics
 */
export interface ContentStats {
  total: number;
  byCategory: Record<string, number>;
  byTag: Record<string, number>;
  byAuthor: Record<string, number>;
  byYear: Record<string, number>;
}

// Type guards
export const isContentMeta = (obj: unknown): obj is ContentMeta => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "slug" in obj &&
    "title" in obj &&
    typeof (obj as ContentMeta).slug === "string" &&
    typeof (obj as ContentMeta).title === "string"
  );
};

export const isContentDocument = (obj: unknown): obj is ContentDocument => {
  return (
    isContentMeta(obj) &&
    "content" in obj &&
    typeof (obj as ContentDocument).content === "string"
  );
};

export const isContentSummary = (obj: unknown): obj is ContentSummary => {
  return isContentMeta(obj);
};

// Validation utilities
export const validateContentMeta = (meta: ContentMeta): string[] => {
  const errors: string[] = [];

  if (!meta.slug?.trim()) {
    errors.push("Slug is required");
  }

  if (!meta.title?.trim()) {
    errors.push("Title is required");
  }

  if (meta.slug && !/^[a-z0-9-]+$/.test(meta.slug)) {
    errors.push(
      "Slug must contain only lowercase letters, numbers, and hyphens"
    );
  }

  return errors;
};

export const sanitizeContentMeta = (
  meta: Partial<ContentMeta>
): ContentMeta => {
  return {
    slug: meta.slug?.toLowerCase().trim() || "",
    title: meta.title?.trim() || "",
    subtitle: meta.subtitle?.trim(),
    excerpt: meta.excerpt?.trim(),
    description: meta.description?.trim(),
    date: meta.date,
    category: meta.category?.trim(),
    tags: Array.isArray(meta.tags)
      ? meta.tags.filter((tag) => typeof tag === "string")
      : undefined,
    coverImage: meta.coverImage,
    readTime: meta.readTime,
    ...meta,
  };
};

// Factory functions
export const createContentMeta = (
  overrides: Partial<ContentMeta> = {}
): ContentMeta => ({
  slug: "",
  title: "",
  ...overrides,
});

export const createContentDocument = (
  overrides: Partial<ContentDocument> = {}
): ContentDocument => ({
  slug: "",
  title: "",
  content: "",
  ...overrides,
});

// Utility functions
export const getContentUrl = (
  content: ContentMeta,
  basePath: string = ""
): string => {
  return `${basePath}/${content.slug}`.replace(/\/+/g, "/");
};

export const getCoverImageUrl = (
  content: ContentMeta,
  baseUrl: string = ""
): string | undefined => {
  if (!content.coverImage) return undefined;

  if (
    content.coverImage.startsWith("http") ||
    content.coverImage.startsWith("/")
  ) {
    return content.coverImage;
  }

  return `${baseUrl}/${content.coverImage}`.replace(/\/+/g, "/");
};

export const formatReadTime = (
  readTime: string | number | undefined
): string => {
  if (!readTime) return "";

  if (typeof readTime === "number") {
    return `${readTime} min read`;
  }

  return readTime.toString();
};

export const sortContentByDate = (
  content: ContentMeta[],
  order: "asc" | "desc" = "desc"
): ContentMeta[] => {
  return content.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;

    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
};

export const filterContentByCategory = (
  content: ContentMeta[],
  category: string
): ContentMeta[] => {
  return content.filter(
    (item) =>
      item.category?.toLowerCase() === category.toLowerCase() ||
      item.categories?.some(
        (cat) => cat.toLowerCase() === category.toLowerCase()
      )
  );
};

export const filterContentByTag = (
  content: ContentMeta[],
  tag: string
): ContentMeta[] => {
  return content.filter((item) =>
    item.tags?.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
};

// Content grouping utilities
export interface ContentGroup {
  name: string;
  items: ContentMeta[];
  count: number;
}

export const groupContentByCategory = (
  content: ContentMeta[]
): ContentGroup[] => {
  const groups: Record<string, ContentMeta[]> = {};

  content.forEach((item) => {
    const categories =
      item.categories || (item.category ? [item.category] : ["Uncategorized"]);

    categories.forEach((cat) => {
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });
  });

  return Object.entries(groups).map(([name, items]) => ({
    name,
    items: sortContentByDate(items),
    count: items.length,
  }));
};

export const groupContentByYear = (content: ContentMeta[]): ContentGroup[] => {
  const groups: Record<string, ContentMeta[]> = {};

  content.forEach((item) => {
    if (!item.date) return;

    const year = new Date(item.date).getFullYear().toString();

    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(item);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .map(([name, items]) => ({
      name,
      items: sortContentByDate(items),
      count: items.length,
    }));
};

// types/index.ts

// ----- Core site configuration -----
export interface SiteConfig {
  url: string;
  title: string;
  subtitle?: string;
  description: string;
  logo?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    email?: string;
  };
}

// ----- Base content interface -----
export interface BaseContentMeta {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  description?: string;
  date?: string;
  lastModified?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  author?: string;
  readTime?: string;
  published?: boolean;
  draft?: boolean;
  featured?: boolean;
  // Add access control properties to base interface since they're used across content types
  accessLevel?: "public" | "inner-circle" | "premium";
  lockMessage?: string;
}

// ----- Posts -----
export interface PostMeta extends BaseContentMeta {
  ogImage?: string;
  canonicalUrl?: string;
  series?: string;
  seriesOrder?: number;
}

// ----- Books -----
export interface BookMeta extends BaseContentMeta {
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  pages?: number;
  language?: string;
  format?: "hardcover" | "paperback" | "ebook" | "audiobook";
  price?: string;
  purchaseLink?: string;
  rating?: number;
  status?: "published" | "draft" | "scheduled";
  content?: string; // Add content property for MDX
}

// ----- Downloads (from local module) -----
export type { DownloadItem, DownloadMeta } from "./download";

// ----- Strategy -----
export interface StrategyMeta extends BaseContentMeta {
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: string;
  tools?: string[];
  outcomes?: string[];
}

// ----- Generic content union -----
export type ContentMeta =
  | PostMeta
  | BookMeta
  | StrategyMeta
  | import("./download").DownloadMeta
  | BaseContentMeta;

// ----- Legacy compatibility -----
export interface PostData {
  slug: string;
  title: string;
  subtitle?: string;
  content?: string;
  [key: string]: unknown;
}

// ----- Type guards -----
export function isBookMeta(content: ContentMeta): content is BookMeta {
  return (
    typeof (content as BookMeta).isbn === "string" || "publisher" in content
  );
}

export function isPostMeta(content: ContentMeta): content is PostMeta {
  return (
    "ogImage" in content ||
    "series" in content ||
    typeof (content as PostMeta).canonicalUrl === "string"
  );
}

export function isStrategyMeta(content: ContentMeta): content is StrategyMeta {
  return (
    "difficulty" in content || Array.isArray((content as StrategyMeta).tools)
  );
}

export function isDownloadMeta(
  content: ContentMeta
): content is import("./download").DownloadMeta {
  return (
    typeof (content as import("./download").DownloadMeta).file === "string"
  );
}

// ----- Utility types -----
export type ContentType = "posts" | "books" | "strategies" | "downloads";

export interface ContentMap {
  posts: PostMeta;
  books: BookMeta;
  strategies: StrategyMeta;
  downloads: import("./download").DownloadMeta;
}

export type ContentByType<T extends ContentType> = ContentMap[T];

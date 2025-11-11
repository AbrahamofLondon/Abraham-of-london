// types/index.ts
export type { PostMeta as LibPostMeta } from "@/lib/mdx";

// Core site configuration
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

// Base content interface with common fields
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
}

// Extended interfaces for specific content types
export interface PostMeta extends BaseContentMeta {
  // Post-specific fields
  ogImage?: string;
  canonicalUrl?: string;
  series?: string;
  seriesOrder?: number;
}

// Export download types directly
export type { DownloadItem, DownloadMeta } from "./download";

// Book types
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
}

// Strategy types
export interface StrategyMeta extends BaseContentMeta {
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: string;
  tools?: string[];
  outcomes?: string[];
}

// Generic content interface (union type for flexibility)
export type ContentMeta =
  | PostMeta
  | BookMeta
  | StrategyMeta
  | DownloadMeta
  | BaseContentMeta;

// Legacy/compatibility types (keep for backward compatibility)
export interface PostData {
  slug: string;
  title: string;
  subtitle?: string;
  content?: string;
  [key: string]: unknown;
}

// Type guards for content discrimination
export function isBookMeta(content: ContentMeta): content is BookMeta {
  return "isbn" in content || "publisher" in content;
}

export function isPostMeta(content: ContentMeta): content is PostMeta {
  return "ogImage" in content || "series" in content;
}

export function isStrategyMeta(content: ContentMeta): content is StrategyMeta {
  return "difficulty" in content || "tools" in content;
}

export function isDownloadMeta(content: ContentMeta): content is DownloadMeta {
  return (
    "file" in content && typeof (content as DownloadMeta).file === "string"
  );
}

// Utility types for content handling
export type ContentType = "posts" | "books" | "strategies" | "downloads";

export interface ContentMap {
  posts: PostMeta;
  books: BookMeta;
  strategies: StrategyMeta;
  downloads: DownloadMeta;
}

// Type-safe content retrieval helper
export type ContentByType<T extends ContentType> = ContentMap[T];

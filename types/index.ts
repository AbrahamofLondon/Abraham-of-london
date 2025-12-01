// types/index.ts

// ----- Base -----
export interface BaseContentMeta {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  content?: string;
  [key: string]: unknown;
}

// ----- Pages (from contentlayer) -----
export type { Page } from "contentlayer/generated";

// ----- Events -----
export interface EventMeta extends BaseContentMeta {
  endDate?: string;
  location?: string;
  venue?: string;
  time?: string;
  featured?: boolean;
  registrationUrl?: string;
  heroImage?: string;
  coverImage?: string;
}

// ----- Downloads (from local module) -----
export type { DownloadMeta, DownloadItem } from "./download";

// Type guard for DownloadMeta
export function isDownloadMeta(
  content: any
): content is import("./download").DownloadMeta {
  return (
    typeof content === "object" &&
    content !== null &&
    typeof content.slug === "string" &&
    typeof content.title === "string" &&
    // Check for download-specific properties (any one will do)
    (typeof content.file === "string" || 
     typeof content.filePath === "string" || 
     typeof content.fileType === "string" ||
     typeof content.fileSizeLabel === "string")
  );
}

// ----- Strategy -----
export interface StrategyMeta extends BaseContentMeta {
  featured?: boolean;
  featuredImage?: string;
  updatedAt?: string;
}

// ----- Books -----
export interface BookMeta extends BaseContentMeta {
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  pageCount?: number;
  language?: string;
  buyLinks?: {
    amazon?: string;
    waterstones?: string;
    [key: string]: string;
  };
  coverImage?: string;
  rating?: number;
}

// ----- Resources -----
export interface ResourceMeta extends BaseContentMeta {
  type?: string;
  fileSize?: string;
  downloadUrl?: string;
  thumbnail?: string;
  featured?: boolean;
}

// ----- Content types -----
export type ContentType = 
  | "page" 
  | "event" 
  | "download" 
  | "strategy" 
  | "book" 
  | "resource";

// ----- Unified content type -----
export interface UnifiedContentItem {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  content?: string;
  url: string;
  [key: string]: unknown;
}

// ----- Utility types -----
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchFilters {
  type?: ContentType | ContentType[];
  category?: string;
  tags?: string[];
  author?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  featured?: boolean;
}

// ----- Site configuration -----
export interface SiteConfig {
  title: string;
  description: string;
  url: string;
  author: string;
  email: string;
  social: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
    [key: string]: string;
  };
  navigation: Array<{
    label: string;
    href: string;
    external?: boolean;
  }>;
  footer: {
    copyright: string;
    links: Array<{
      label: string;
      href: string;
      external?: boolean;
    }>;
  };
}

// ----- API response types -----
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
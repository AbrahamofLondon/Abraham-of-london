// lib/types/content-types.ts
// Central type definitions for all content

export interface ContentBase {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  readTime?: number | string;
  coverImage?: string;
  content?: string;
  draft?: boolean;
  published?: boolean;
  status?: "draft" | "published" | "archived" | "private";
  accessLevel?: "public" | "private" | "premium";
  lockMessage?: string;
  _raw?: any;
  _id?: string;
}

// Download specific types
export interface DownloadMeta extends ContentBase {
  downloadFile?: string;
  fileSize?: string | number; // Can be string or number
  downloadType?: string;
  version?: string;
}

export interface Download extends DownloadMeta {
  body?: any;
  toc?: any;
  [key: string]: any;
}

// Other content types
export type Post = ContentBase;

export interface Book extends ContentBase {
  isbn?: string;
  format?: string;
  publisher?: string;
  pages?: number;
}

export interface Event extends ContentBase {
  eventDate?: string;
  location?: string;
}

export interface Page extends ContentBase {
  pageType?: string;
  parentPage?: string;
  showInNav?: boolean;
}

export type Print = ContentBase;

export interface Resource extends ContentBase {
  resourceType?: string;
  applications?: string[];
}

export type Strategy = ContentBase;

export interface Canon extends ContentBase {
  volumeNumber?: string | number;
  order?: number;
}



/**
 * lib/content/pages.ts
 * Pages Router specific exports
 * Use this in getStaticProps/getServerSideProps
 */

import { normalizeSlug, isDraftContent } from "@/lib/content/shared";

// Import from books.ts
import {
  getAllBooks,
  getBookBySlug,
} from "@/lib/books";

// Import from canon.ts
import {
  getAllCanons,
  getCanonBySlug,
} from "@/lib/canon";

// Import from downloads.ts
import {
  getAllDownloads,
  getDownloadBySlug,
} from "@/lib/downloads";

// Import from posts
import {
  getPostBySlug,
} from "@/lib/posts";

// Import server-side functions directly from the SSOT facade
import {
  getPublishedPosts as getPublishedPostDocs,
  getPublishedDocuments,
  getDocKind as getServerDocKind,
} from "@/lib/content/server";

// Import types from the updated client library (only Post and PostForClient)
export type { Post, PostForClient } from "@/lib/contentlayer-client";

/**
 * Maps document types to their respective UI categories
 */
export const getDocKind = (doc: any): string => {
  return doc?.type || doc?.kind || doc?.docKind || getServerDocKind(doc) || "unknown";
};

/**
 * Generates the standardized URL path for any document within the institutional ecosystem
 */
export const getDocHref = (doc: any): string => {
  if (doc?.href) return doc.href;
  const kind = getDocKind(doc);
  const slug = doc?.slug || doc?._raw?.flattenedPath || "";
  
  // Clean the slug to ensure no leading/trailing slashes or recursive segments
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '').split('/').pop() || slug;
  
  switch (kind.toLowerCase()) {
    case 'post': 
    case 'blog': return `/blog/${cleanSlug}`;
    case 'book': return `/books/${cleanSlug}`;
    case 'canon': return `/canon/${cleanSlug}`;
    case 'download': return `/downloads/${cleanSlug}`;
    case 'event': return `/events/${cleanSlug}`;
    case 'print': return `/prints/${cleanSlug}`;
    case 'resource': return `/resources/${cleanSlug}`;
    case 'short': return `/shorts/${cleanSlug}`;
    case 'brief': return `/inner-circle/briefs/${cleanSlug}`;
    case 'strategy': return `/strategy/${cleanSlug}`;
    default: return `/${kind.toLowerCase()}/${cleanSlug}`;
  }
};

/**
 * Resolves the primary visual asset for a document
 * Re-exported from unified image resolver for consistency
 */
export { resolveDocCoverImage } from '@/lib/image-resolver';

/**
 * A composite lookup function that scans all local collection modules for a specific slug
 */
export const getDocBySlug = async (slug: string) => {
  const normalized = normalizeSlug(slug);

  // Try to find in books
  try {
    const book = await getBookBySlug(normalized);
    if (book) return book;
  } catch {}
  
  // Try to find in canon
  try {
    const canon = await getCanonBySlug(normalized);
    if (canon) return canon;
  } catch {}
  
  // Try to find in posts
  try {
    const post = await getPostBySlug(normalized);
    if (post) return post;
  } catch {}
  
  // Try to find in downloads (synchronous)
  try {
    const download = getDownloadBySlug(normalized);
    if (download) return download;
  } catch {}
  
  return null;
};

/* -----------------------------------------------------------------------------
   Server-side collection getters (Async wrappers for consistency)
----------------------------------------------------------------------------- */

export const getServerAllBooks = async () => {
  return getAllBooks();
};

export const getServerBookBySlug = async (slug: string) => {
  return getBookBySlug(slug);
};

export const getServerAllCanons = async () => {
  return getAllCanons();
};

export const getServerCanonBySlug = async (slug: string) => {
  return getCanonBySlug(slug);
};

export const getServerAllDownloads = async () => {
  return getAllDownloads();
};

export const getServerDownloadBySlug = async (slug: string) => {
  return getDownloadBySlug(slug);
};

/**
 * Retrieves all published posts from the server-side facade
 */
export const getPublishedPosts = () => {
  return getPublishedPostDocs();
};

/**
 * Retrieves all published documents across all collections
 */
export const getPublishedDocs = () => {
  return getPublishedDocuments();
};

export const getPostBySlugWithContent = getPostBySlug;

// Async version aliases for legacy support
export const getServerAllBooksAsync = getServerAllBooks;
export const getServerAllCanonsAsync = getServerAllCanons;
export const getServerAllDownloadsAsync = getServerAllDownloads;

// Re-export existing utilities from shared logic
export {
  normalizeSlug,
  isDraftContent,
};

/**
 * Standardized export object for clean imports in Pages Router files
 */
const pagesContent = {
  // Server collections
  getServerAllBooks,
  getServerBookBySlug,
  getServerAllCanons,
  getServerCanonBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getServerAllBooksAsync,
  getServerAllCanonsAsync,
  getServerAllDownloadsAsync,
  
  // Document utilities
  getDocKind,
  getDocHref,
  resolveDocCoverImage,
  getDocBySlug,
  
  // Posts
  getPostBySlug,
  getPostBySlugWithContent,
  getPublishedPosts,
  getPublishedDocs,
  
  // Utilities
  normalizeSlug,
  isDraftContent,
};

export default pagesContent;
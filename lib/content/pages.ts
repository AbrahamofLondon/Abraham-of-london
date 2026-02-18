// lib/content/pages.ts
/**
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

// Import server-side functions directly
import {
  getPublishedPosts as getPublishedPostDocs,
} from "@/lib/content/server";

// Import types from the updated client library (only Post and PostForClient)
export type { Post, PostForClient } from "@/lib/contentlayer-client";

// Define document utility functions locally
export const getDocKind = (doc: any): string => {
  return doc?.type || doc?.kind || doc?.docKind || "unknown";
};

export const getDocHref = (doc: any): string => {
  if (doc?.href) return doc.href;
  const kind = getDocKind(doc);
  const slug = doc?.slug || doc?._raw?.flattenedPath || "";
  
  // Clean the slug
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '').split('/').pop() || slug;
  
  switch (kind.toLowerCase()) {
    case 'post': return `/blog/${cleanSlug}`;
    case 'book': return `/books/${cleanSlug}`;
    case 'canon': return `/canon/${cleanSlug}`;
    case 'download': return `/downloads/${cleanSlug}`;
    case 'event': return `/events/${cleanSlug}`;
    case 'print': return `/prints/${cleanSlug}`;
    case 'resource': return `/resources/${cleanSlug}`;
    case 'short': return `/shorts/${cleanSlug}`;
    case 'brief': return `/briefs/${cleanSlug}`;
    case 'strategy': return `/strategy/${cleanSlug}`;
    default: return `/${kind.toLowerCase()}/${cleanSlug}`;
  }
};

export const resolveDocCoverImage = (doc: any): string | null => {
  return doc?.coverImage || doc?.image || doc?.cover || null;
};

// Define getDocBySlug locally if not imported
export const getDocBySlug = async (slug: string) => {
  // Try to find in books
  try {
    const book = await getBookBySlug(slug);
    if (book) return book;
  } catch {}
  
  // Try to find in canon
  try {
    const canon = await getCanonBySlug(slug);
    if (canon) return canon;
  } catch {}
  
  // Try to find in posts
  try {
    const post = await getPostBySlug(slug);
    if (post) return post;
  } catch {}
  
  // Try to find in downloads (synchronous)
  try {
    const download = getDownloadBySlug(slug);
    if (download) return download;
  } catch {}
  
  return null;
};

// Server-side collection getters
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

// Post-related exports
export const getPublishedPosts = () => {
  return getPublishedPostDocs();
};

export const getPostBySlugWithContent = getPostBySlug;

// Async versions (aliases for consistency)
export const getServerAllBooksAsync = getServerAllBooks;
export const getServerAllCanonsAsync = getServerAllCanons;
export const getServerAllDownloadsAsync = getServerAllDownloads;

// Re-export existing utilities
export {
  normalizeSlug,
  isDraftContent,
};

// Default export for convenience
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
  
  // Utilities
  normalizeSlug,
  isDraftContent,
};

export default pagesContent;
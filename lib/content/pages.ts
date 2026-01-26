// lib/content/pages.ts
/**
 * Pages Router specific exports
 * Use this in getStaticProps/getServerSideProps
 */

export {
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
} from "./index";

// Re-export types if needed
export type { Post, PostForClient } from "@/lib/contentlayer-client";
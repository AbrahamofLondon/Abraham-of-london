// lib/content.ts
// Centralised content exports - Contentlayer-based

// ============================================
// CONTENTLAYER HELPER (main source) - RE-EXPORT ALL
// ============================================
import {
  // Document getters
  getAllContentlayerDocs,
  getPublishedDocuments,
  getFeaturedDocuments,
  getDocumentBySlug,
  getCardPropsForDocument,
  getPublishedDocumentsByType,
  
  // Type-specific getters (imported with different names)
  getPublishedPosts as getPublishedPostsInternal,
  getPostBySlug as getPostBySlugInternal,
  getAllBooks as getAllBooksInternal,
  getAllDownloads as getAllDownloadsInternal,
  getAllEvents as getAllEventsInternal,
  getAllPrints as getAllPrintsInternal,
  getAllResources as getAllResourcesInternal,
  getAllStrategies as getAllStrategiesInternal,
  getAllCanons as getAllCanonsInternal,
  getPublishedShorts as getPublishedShortsInternal,
  getShortBySlug as getShortBySlugInternal,
  
  // Type guards
  isPost,
  isDownload,
  isBook,
  isEvent,
  isPrint,
  isResource,
  isCanon,
  isShort,
  isStrategy,
  isContentlayerLoaded,
  isDraft,
  isPublished,
  
  // Types
  type AnyDoc,
  type DocKind,
  type ContentlayerCardProps,
  type PostType,
  type BookType,
  type DownloadType,
  type EventType,
  type PrintType,
  type ResourceType,
  type StrategyType,
  type CanonType,
  type ShortType,
} from "./contentlayer-helper";

// ============================================
// TYPE ALIASES for backward compatibility
// ============================================
export type Post = PostType;
export type PostWithContent = PostType & { content?: string };
export type PostMeta = PostType;
export type PostForClient = PostType;
export type PostSummary = PostType;
export type Book = BookType;
export type Canon = CanonType;
export type Download = DownloadType;
export type Event = EventType;
export type Print = PrintType;
export type Resource = ResourceType;
export type Strategy = StrategyType;
export type Short = ShortType;
export type BasicDoc = AnyDoc;
export type ContentItem = AnyDoc;

// Export all types from contentlayer-helper
export type {
  AnyDoc,
  DocKind,
  ContentlayerCardProps,
  PostType,
  BookType,
  DownloadType,
  EventType,
  PrintType,
  ResourceType,
  StrategyType,
  CanonType,
  ShortType,
};

// ============================================
// MAIN CONTENT GETTERS (re-exported with proper names)
// ============================================

// Posts
export const getAllPosts = getPublishedPostsInternal;
export const getPostBySlug = getPostBySlugInternal;

// Books
export const getAllBooks = getAllBooksInternal;
export const getBookBySlug = (slug: string): BookType | undefined => {
  return getAllBooks().find(book => 
    book.slug === slug || 
    book._raw.flattenedPath.replace('books/', '') === slug
  );
};

// Downloads
export const getAllDownloads = getAllDownloadsInternal;
export const getDownloadBySlug = (slug: string): DownloadType | undefined => {
  return getAllDownloads().find(download => 
    download.slug === slug || 
    download._raw.flattenedPath.replace('downloads/', '') === slug
  );
};

// Events
export const getAllEvents = getAllEventsInternal;
export const getEventBySlug = (slug: string): EventType | undefined => {
  return getAllEvents().find(event => 
    event.slug === slug || 
    event._raw.flattenedPath.replace('events/', '') === slug
  );
};

// Prints
export const getAllPrints = getAllPrintsInternal;
export const getPrintBySlug = (slug: string): PrintType | undefined => {
  return getAllPrints().find(print => 
    print.slug === slug || 
    print._raw.flattenedPath.replace('prints/', '') === slug
  );
};

// Resources
export const getAllResources = getAllResourcesInternal;
export const getResourceBySlug = (slug: string): ResourceType | undefined => {
  return getAllResources().find(resource => 
    resource.slug === slug || 
    resource._raw.flattenedPath.replace('resources/', '') === slug
  );
};

// Strategies
export const getAllStrategies = getAllStrategiesInternal;
export const getStrategyBySlug = (slug: string): StrategyType | undefined => {
  return getAllStrategies().find(strategy => 
    strategy.slug === slug || 
    strategy._raw.flattenedPath.replace('strategy/', '') === slug
  );
};

// Canon
export const getAllCanon = getAllCanonsInternal;
export const getCanonBySlug = (slug: string): CanonType | undefined => {
  return getAllCanon().find(canon => 
    canon.slug === slug || 
    canon._raw.flattenedPath.replace('canon/', '') === slug
  );
};

// Shorts
export const getAllShorts = getPublishedShortsInternal;
export const getShortBySlug = getShortBySlugInternal;

// ============================================
// POST-SPECIFIC UTILITIES
// ============================================
export const getPublicPosts = (): PostType[] => {
  return getAllPosts().filter(post => !isDraft(post));
};

export const getFeaturedPosts = (): PostType[] => {
  return getAllPosts().filter(post => post.featured === true);
};

export const getPostSummaries = (): ContentlayerCardProps[] => {
  return getAllPosts().map(getCardPropsForDocument);
};

export const getSortedPosts = (): PostType[] => {
  return getAllPosts().sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
};

export const getPaginatedPosts = (page: number = 1, limit: number = 10): PostType[] => {
  const posts = getSortedPosts();
  const start = (page - 1) * limit;
  const end = start + limit;
  return posts.slice(start, end);
};

export const getRecentPosts = (limit: number = 5): PostType[] => {
  return getSortedPosts().slice(0, limit);
};

export const searchPosts = (query: string): PostType[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return getAllPosts().filter(post => {
    const searchable = [
      post.title || '',
      post.description || '',
      post.excerpt || '',
      ...(post.tags || []),
      (post as any).category || '',
    ].join(' ').toLowerCase();
    
    return searchable.includes(q);
  });
};

export const getPostsByCategory = (category: string): PostType[] => {
  return getAllPosts().filter(post => 
    (post as any).category?.toLowerCase() === category.toLowerCase()
  );
};

export const getPostsByTag = (tag: string): PostType[] => {
  return getAllPosts().filter(post => 
    post.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
  );
};

// Legacy posts module functions (stubs)
export const initializePosts = (posts?: PostType[]): void => {
  console.log('Posts initialized via Contentlayer');
};

export const createPost = (post: any): any => {
  console.warn('createPost not implemented for Contentlayer');
  return post;
};

export const postsAPI = {
  getAll: getAllPosts,
  getBySlug: getPostBySlug,
  getFeatured: getFeaturedPosts,
  search: searchPosts,
};

// ============================================
// CONTENT CATEGORIES (used by navigation / UI)
// ============================================
export const CONTENT_CATEGORIES = [
  {
    id: "essays",
    label: "Structural Essays",
    slug: "/blog",
    description: "Long-form thinking on purpose, power, and institutions.",
    getItems: getAllPosts,
  },
  {
    id: "canon",
    label: "Canon",
    slug: "/canon",
    description: "Foundational volumes shaping the Builders' Canon.",
    getItems: getAllCanon,
  },
  {
    id: "books",
    label: "Books",
    slug: "/books",
    description: "Published works, pre-releases, and manuscripts.",
    getItems: getAllBooks,
  },
  {
    id: "strategies",
    label: "Strategies",
    slug: "/strategy",
    description: "Practical operating playbooks and strategic frameworks.",
    getItems: getAllStrategies,
  },
  {
    id: "resources",
    label: "Resources",
    slug: "/resources",
    description: "Frameworks, templates, and council-ready artefacts.",
    getItems: getAllResources,
  },
  {
    id: "downloads",
    label: "Downloads",
    slug: "/downloads",
    description: "Toolkits, cue cards, and execution-ready packs.",
    getItems: getAllDownloads,
  },
  {
    id: "events",
    label: "Events",
    slug: "/events",
    description: "Workshops, salons, and live teaching sessions.",
    getItems: getAllEvents,
  },
  {
    id: "prints",
    label: "Prints",
    slug: "/prints",
    description: "Physical editions, cards, and wall-ready assets.",
    getItems: getAllPrints,
  },
  {
    id: "shorts",
    label: "Shorts",
    slug: "/shorts",
    description: "Bite-sized provocations for builders on the move.",
    getItems: getAllShorts,
  },
] as const;

// ============================================
// DOCUMENT UTILITIES (Generic)
// ============================================
export function indexBySlug<T extends AnyDoc>(docs: T[]): Record<string, T> {
  return docs.reduce((acc, doc) => {
    const slug = doc.slug || doc._raw.flattenedPath.split('/').pop() || '';
    if (slug) acc[slug] = doc;
    return acc;
  }, {} as Record<string, T>);
}

export function sortByDate<T extends AnyDoc>(docs: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...docs].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterPublished<T extends AnyDoc>(docs: T[]): T[] {
  return docs.filter(isPublished);
}

export function getAuthorName(doc: AnyDoc): string {
  return (doc as any).author || 'Abraham of London';
}

export function filterByTag<T extends AnyDoc>(docs: T[], tag: string): T[] {
  return docs.filter(doc => 
    doc.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export function groupByYear<T extends AnyDoc>(docs: T[]): Record<number, T[]> {
  return docs.reduce((acc, doc) => {
    if (doc.date) {
      const year = new Date(doc.date).getFullYear();
      if (!acc[year]) acc[year] = [];
      acc[year].push(doc);
    }
    return acc;
  }, {} as Record<number, T[]>);
}

export function searchDocuments<T extends AnyDoc>(docs: T[], query: string): T[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return docs.filter(doc => {
    const searchable = [
      doc.title || '',
      doc.description || '',
      doc.excerpt || '',
      ...(doc.tags || []),
    ].join(' ').toLowerCase();
    
    return searchable.includes(q);
  });
}

export function paginateDocuments<T extends AnyDoc>(docs: T[], page: number = 1, limit: number = 10): T[] {
  const start = (page - 1) * limit;
  const end = start + limit;
  return docs.slice(start, end);
}

// ============================================
// AGGREGATED HELPERS
// ============================================
export function initializeAllContent(): Promise<void> {
  return Promise.resolve(); // Contentlayer loads automatically
}

export function createContentLoader() {
  return {
    load: () => Promise.resolve(getAllContent()),
  };
}

export function loadPostsFromSource(): Promise<PostType[]> {
  return Promise.resolve(getAllPosts());
}

/**
 * Get all content grouped by type.
 */
export function getAllContent() {
  return {
    posts: getAllPosts(),
    books: getAllBooks(),
    canon: getAllCanon(),
    downloads: getAllDownloads(),
    events: getAllEvents(),
    prints: getAllPrints(),
    resources: getAllResources(),
    strategies: getAllStrategies(),
    shorts: getAllShorts(),
  };
}

/**
 * Flat list helper (one big array when needed).
 */
export function getAllContentFlat(): AnyDoc[] {
  const {
    posts,
    books,
    canon,
    downloads,
    events,
    prints,
    resources,
    strategies,
    shorts,
  } = getAllContent();

  return [
    ...posts,
    ...books,
    ...canon,
    ...downloads,
    ...events,
    ...prints,
    ...resources,
    ...strategies,
    ...shorts,
  ];
}

/**
 * Search across all content types.
 */
export function searchAllContent(query: string) {
  const q = query.trim().toLowerCase();
  
  return {
    posts: searchPosts(query),
    books: searchDocuments(getAllBooks(), query),
    canon: searchDocuments(getAllCanon(), query),
    downloads: searchDocuments(getAllDownloads(), query),
    events: searchDocuments(getAllEvents(), query),
    prints: searchDocuments(getAllPrints(), query),
    resources: searchDocuments(getAllResources(), query),
    strategies: searchDocuments(getAllStrategies(), query),
    shorts: searchDocuments(getAllShorts(), query),
  };
}

/**
 * Convenience function to load and initialize content.
 */
export async function loadAndInitializeContent() {
  await initializeAllContent();
  return getAllContent();
}

// ============================================
// BACKWARD-COMPATIBILITY EXPORTS
// Arrays – safe for .length, .map, etc.
// ============================================
export const posts = getAllPosts();
export const books = getAllBooks();
export const canons = getAllCanon();
export const events = getAllEvents();
export const prints = getAllPrints();
export const strategies = getAllStrategies();
export const resources = getAllResources();
export const downloads = getAllDownloads();
export const shorts = getAllShorts();

// ============================================
// RE-EXPORT EVERYTHING FROM HELPER
// ============================================
export {
  // From contentlayer-helper
  getAllContentlayerDocs,
  getFeaturedDocuments,
  getPublishedDocuments,
  getCardPropsForDocument,
  getPublishedDocumentsByType,
  getDocumentBySlug,
  
  // Type guards
  isPost,
  isDownload,
  isBook,
  isEvent,
  isPrint,
  isResource,
  isCanon,
  isShort,
  isStrategy,
  isContentlayerLoaded,
  isDraft,
  isPublished,
};
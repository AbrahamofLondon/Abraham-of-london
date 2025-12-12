// lib/content-fallback.ts
// Direct imports from contentlayer/generated as fallback - NO DEPENDENCIES
import { 
  allPosts, 
  allBooks, 
  allDownloads, 
  allEvents, 
  allPrints, 
  allResources, 
  allStrategies, 
  allCanons, 
  allShorts 
} from 'contentlayer/generated';
import type {
  Post as PostType,
  Book as BookType,
  Download as DownloadType,
  Event as EventType,
  Print as PrintType,
  Resource as ResourceType,
  Strategy as StrategyType,
  Canon as CanonType,
  Short as ShortType,
} from 'contentlayer/generated';

// Union type for all documents
export type AnyDoc = 
  | PostType 
  | BookType 
  | DownloadType 
  | EventType 
  | PrintType 
  | ResourceType 
  | StrategyType 
  | CanonType 
  | ShortType;

export type DocKind = 
  | 'Post' 
  | 'Book' 
  | 'Download' 
  | 'Event' 
  | 'Print' 
  | 'Resource' 
  | 'Strategy' 
  | 'Canon' 
  | 'Short';

// ============================================
// SLUG HELPER
// ============================================
export function getDocSlug(doc: any): string {
  // First try the slug field
  if (doc.slug && typeof doc.slug === 'string' && doc.slug.trim()) {
    return doc.slug.trim();
  }
  
  // Fallback to flattened path
  if (doc._raw?.flattenedPath) {
    const path = doc._raw.flattenedPath;
    const parts = path.split('/');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      return lastPart === 'index' ? parts[parts.length - 2] || lastPart : lastPart;
    }
    return path;
  }
  
  // Last resort: use title as slug
  if (doc.title) {
    return doc.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  
  return 'untitled';
}

// ============================================
// TYPE GUARDS
// ============================================
export const isPost = (doc: AnyDoc): doc is PostType => doc._type === 'Post';
export const isBook = (doc: AnyDoc): doc is BookType => doc._type === 'Book';
export const isDownload = (doc: AnyDoc): doc is DownloadType => doc._type === 'Download';
export const isEvent = (doc: AnyDoc): doc is EventType => doc._type === 'Event';
export const isPrint = (doc: AnyDoc): doc is PrintType => doc._type === 'Print';
export const isResource = (doc: AnyDoc): doc is ResourceType => doc._type === 'Resource';
export const isStrategy = (doc: AnyDoc): doc is StrategyType => doc._type === 'Strategy';
export const isCanon = (doc: AnyDoc): doc is CanonType => doc._type === 'Canon';
export const isShort = (doc: AnyDoc): doc is ShortType => doc._type === 'Short';

export const isDraft = (doc: AnyDoc): boolean => Boolean(doc.draft);
export const isPublished = (doc: AnyDoc): boolean => !isDraft(doc);

// ============================================
// CONTENT GETTERS - ALL TYPES
// ============================================

// Posts
export const getAllPostsDirect = (): PostType[] => {
  return allPosts.filter(post => !post.draft) as PostType[];
};

export const getPostBySlugDirect = (slug: string): PostType | undefined => {
  return getAllPostsDirect().find(post => getDocSlug(post) === slug);
};

// Books
export const getAllBooksDirect = (): BookType[] => {
  return allBooks.filter(book => !book.draft) as BookType[];
};

export const getBookBySlugDirect = (slug: string): BookType | undefined => {
  return getAllBooksDirect().find(book => getDocSlug(book) === slug);
};

// Downloads
export const getAllDownloadsDirect = (): DownloadType[] => {
  return allDownloads.filter(download => !download.draft) as DownloadType[];
};

export const getDownloadBySlugDirect = (slug: string): DownloadType | undefined => {
  return getAllDownloadsDirect().find(download => getDocSlug(download) === slug);
};

// Events
export const getAllEventsDirect = (): EventType[] => {
  return allEvents.filter(event => !event.draft) as EventType[];
};

export const getEventBySlugDirect = (slug: string): EventType | undefined => {
  return getAllEventsDirect().find(event => getDocSlug(event) === slug);
};

// Prints
export const getAllPrintsDirect = (): PrintType[] => {
  return allPrints.filter(print => !print.draft) as PrintType[];
};

export const getPrintBySlugDirect = (slug: string): PrintType | undefined => {
  return getAllPrintsDirect().find(print => getDocSlug(print) === slug);
};

// Resources
export const getAllResourcesDirect = (): ResourceType[] => {
  return allResources.filter(resource => !resource.draft) as ResourceType[];
};

export const getResourceBySlugDirect = (slug: string): ResourceType | undefined => {
  return getAllResourcesDirect().find(resource => getDocSlug(resource) === slug);
};

// Strategies
export const getAllStrategiesDirect = (): StrategyType[] => {
  return allStrategies.filter(strategy => !strategy.draft) as StrategyType[];
};

export const getStrategyBySlugDirect = (slug: string): StrategyType | undefined => {
  return getAllStrategiesDirect().find(strategy => getDocSlug(strategy) === slug);
};

// Canon
export const getAllCanonsDirect = (): CanonType[] => {
  return allCanons.filter(canon => !canon.draft) as CanonType[];
};

export const getCanonBySlugDirect = (slug: string): CanonType | undefined => {
  return getAllCanonsDirect().find(canon => getDocSlug(canon) === slug);
};

// Shorts
export const getAllShortsDirect = (): ShortType[] => {
  return allShorts.filter(short => !short.draft) as ShortType[];
};

export const getShortBySlugDirect = (slug: string): ShortType | undefined => {
  return getAllShortsDirect().find(short => getDocSlug(short) === slug);
};

// ============================================
// UNIVERSAL GETTERS
// ============================================
export const getAllContentlayerDocsDirect = (): AnyDoc[] => {
  return [
    ...allPosts,
    ...allBooks,
    ...allDownloads,
    ...allEvents,
    ...allPrints,
    ...allResources,
    ...allStrategies,
    ...allCanons,
    ...allShorts,
  ] as AnyDoc[];
};

export const getPublishedDocumentsDirect = (): AnyDoc[] => {
  return getAllContentlayerDocsDirect().filter(isPublished);
};

export const getFeaturedDocumentsDirect = (): AnyDoc[] => {
  return getPublishedDocumentsDirect().filter(doc => doc.featured === true);
};

export const getPublishedDocumentsByTypeDirect = (type: DocKind): AnyDoc[] => {
  const docs = getPublishedDocumentsDirect();
  switch(type) {
    case 'Post': return docs.filter(isPost);
    case 'Book': return docs.filter(isBook);
    case 'Download': return docs.filter(isDownload);
    case 'Event': return docs.filter(isEvent);
    case 'Print': return docs.filter(isPrint);
    case 'Resource': return docs.filter(isResource);
    case 'Strategy': return docs.filter(isStrategy);
    case 'Canon': return docs.filter(isCanon);
    case 'Short': return docs.filter(isShort);
    default: return [];
  }
};

export const getDocumentBySlugDirect = (slug: string): AnyDoc | undefined => {
  const allDocs = [
    ...getAllPostsDirect(),
    ...getAllBooksDirect(),
    ...getAllDownloadsDirect(),
    ...getAllEventsDirect(),
    ...getAllPrintsDirect(),
    ...getAllResourcesDirect(),
    ...getAllStrategiesDirect(),
    ...getAllCanonsDirect(),
    ...getAllShortsDirect(),
  ];
  
  return allDocs.find(doc => getDocSlug(doc) === slug);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
export interface ContentlayerCardProps {
  title: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  date?: string;
  slug: string;
  tags?: string[];
  category?: string;
  readTime?: string;
  author?: string;
  url?: string;
  type: DocKind;
}

export const getCardPropsForDocumentDirect = (doc: AnyDoc): ContentlayerCardProps => {
  const type = doc._type.toLowerCase();
  const url = doc._type === 'Post' 
    ? `/blog/${getDocSlug(doc)}`
    : `/${type === 'canon' ? 'canon' : type}s/${getDocSlug(doc)}`;

  return {
    title: doc.title || 'Untitled',
    description: doc.description,
    excerpt: doc.excerpt,
    coverImage: doc.coverImage,
    date: doc.date,
    slug: getDocSlug(doc),
    tags: doc.tags,
    category: (doc as any).category,
    readTime: (doc as any).readTime,
    author: (doc as any).author,
    url: (doc as any).url || url,
    type: doc._type as DocKind,
  };
};

export function indexBySlugDirect<T extends AnyDoc>(docs: T[]): Record<string, T> {
  return docs.reduce((acc, doc) => {
    const slug = getDocSlug(doc);
    if (slug) acc[slug] = doc;
    return acc;
  }, {} as Record<string, T>);
}

export function sortByDateDirect<T extends AnyDoc>(docs: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...docs].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterPublishedDirect<T extends AnyDoc>(docs: T[]): T[] {
  return docs.filter(isPublished);
}

export function searchDocumentsDirect<T extends AnyDoc>(docs: T[], query: string): T[] {
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

export function paginateDocumentsDirect<T extends AnyDoc>(docs: T[], page: number = 1, limit: number = 10): T[] {
  const start = (page - 1) * limit;
  const end = start + limit;
  return docs.slice(start, end);
}

// ============================================
// AGGREGATED HELPERS
// ============================================
export function getAllContentDirect() {
  return {
    posts: getAllPostsDirect(),
    books: getAllBooksDirect(),
    canon: getAllCanonsDirect(),
    downloads: getAllDownloadsDirect(),
    events: getAllEventsDirect(),
    prints: getAllPrintsDirect(),
    resources: getAllResourcesDirect(),
    strategies: getAllStrategiesDirect(),
    shorts: getAllShortsDirect(),
  };
}

export function getAllContentFlatDirect(): AnyDoc[] {
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
  } = getAllContentDirect();

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

export function searchAllContentDirect(query: string) {
  const q = query.trim().toLowerCase();
  
  return {
    posts: searchDocumentsDirect(getAllPostsDirect(), query),
    books: searchDocumentsDirect(getAllBooksDirect(), query),
    canon: searchDocumentsDirect(getAllCanonsDirect(), query),
    downloads: searchDocumentsDirect(getAllDownloadsDirect(), query),
    events: searchDocumentsDirect(getAllEventsDirect(), query),
    prints: searchDocumentsDirect(getAllPrintsDirect(), query),
    resources: searchDocumentsDirect(getAllResourcesDirect(), query),
    strategies: searchDocumentsDirect(getAllStrategiesDirect(), query),
    shorts: searchDocumentsDirect(getAllShortsDirect(), query),
  };
}

// ============================================
// POST-SPECIFIC UTILITIES (for backward compatibility)
// ============================================
export const getPublicPostsDirect = (): PostType[] => {
  return getAllPostsDirect().filter(post => !isDraft(post));
};

export const getFeaturedPostsDirect = (): PostType[] => {
  return getAllPostsDirect().filter(post => post.featured === true);
};

export const getPostSummariesDirect = (): ContentlayerCardProps[] => {
  return getAllPostsDirect().map(getCardPropsForDocumentDirect);
};

export const getSortedPostsDirect = (): PostType[] => {
  return getAllPostsDirect().sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
};

export const getPaginatedPostsDirect = (page: number = 1, limit: number = 10): PostType[] => {
  const posts = getSortedPostsDirect();
  const start = (page - 1) * limit;
  const end = start + limit;
  return posts.slice(start, end);
};

export const getRecentPostsDirect = (limit: number = 5): PostType[] => {
  return getSortedPostsDirect().slice(0, limit);
};

export const searchPostsDirect = (query: string): PostType[] => {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return getAllPostsDirect().filter(post => {
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

export const getPostsByCategoryDirect = (category: string): PostType[] => {
  return getAllPostsDirect().filter(post => 
    (post as any).category?.toLowerCase() === category.toLowerCase()
  );
};

export const getPostsByTagDirect = (tag: string): PostType[] => {
  return getAllPostsDirect().filter(post => 
    post.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
  );
};

// ============================================
// CONVENIENCE EXPORTS (arrays for .map, .length, etc.)
// ============================================
export const postsDirect = getAllPostsDirect();
export const booksDirect = getAllBooksDirect();
export const canonsDirect = getAllCanonsDirect();
export const eventsDirect = getAllEventsDirect();
export const printsDirect = getAllPrintsDirect();
export const strategiesDirect = getAllStrategiesDirect();
export const resourcesDirect = getAllResourcesDirect();
export const downloadsDirect = getAllDownloadsDirect();
export const shortsDirect = getAllShortsDirect();

// ============================================
// EXPORT ALL TYPES
// ============================================
export type {
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

// Type aliases for backward compatibility
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
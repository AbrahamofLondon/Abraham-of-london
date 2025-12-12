// lib/contentlayer-helper.ts - COMPLETE VERSION with Fallback Integration
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

// ============================================
// CONTENTLAYER STATUS CHECK
// ============================================
export const isContentlayerAvailable = (): boolean => {
  return (
    typeof allPosts !== 'undefined' &&
    typeof allBooks !== 'undefined' &&
    typeof allShorts !== 'undefined'
  );
};

// ============================================
// SLUG HELPER FUNCTION (Robust)
// ============================================
function getDocSlug(doc: any): string {
  if (!doc) return 'untitled';
  
  // Priority 1: Explicit slug field
  if (doc.slug && typeof doc.slug === 'string' && doc.slug.trim()) {
    return doc.slug.trim();
  }
  
  // Priority 2: Flattened path from _raw
  if (doc._raw?.flattenedPath) {
    const path = doc._raw.flattenedPath;
    const parts = path.split('/');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      return lastPart === 'index' ? parts[parts.length - 2] || lastPart : lastPart;
    }
    return path;
  }
  
  // Priority 3: Title-based slug
  if (doc.title) {
    return doc.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  }
  
  return 'untitled';
}

// ============================================
// TYPE EXPORTS
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
export type Short = ShortType;
export type Book = BookType;
export type Canon = CanonType;
export type Download = DownloadType;
export type Event = EventType;
export type Print = PrintType;
export type Resource = ResourceType;
export type Strategy = StrategyType;

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
  featured?: boolean;
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
// SAFE CONTENT GETTERS (with fallback handling)
// ============================================

// Posts
export const getPublishedPosts = (): PostType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty posts array');
    return [];
  }
  try {
    return allPosts.filter(post => !post.draft) as PostType[];
  } catch (error) {
    console.error('Error getting published posts:', error);
    return [];
  }
};

// Shorts
export const getPublishedShorts = (): ShortType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty shorts array');
    return [];
  }
  try {
    return allShorts.filter(short => !short.draft) as ShortType[];
  } catch (error) {
    console.error('Error getting published shorts:', error);
    return [];
  }
};

// Books
export const getAllBooks = (): BookType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty books array');
    return [];
  }
  try {
    return allBooks.filter(book => !book.draft) as BookType[];
  } catch (error) {
    console.error('Error getting all books:', error);
    return [];
  }
};

// Canon
export const getAllCanons = (): CanonType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty canon array');
    return [];
  }
  try {
    return allCanons.filter(canon => !canon.draft) as CanonType[];
  } catch (error) {
    console.error('Error getting all canon entries:', error);
    return [];
  }
};

// Downloads
export const getAllDownloads = (): DownloadType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty downloads array');
    return [];
  }
  try {
    return allDownloads.filter(download => !download.draft) as DownloadType[];
  } catch (error) {
    console.error('Error getting all downloads:', error);
    return [];
  }
};

// Events
export const getAllEvents = (): EventType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty events array');
    return [];
  }
  try {
    return allEvents.filter(event => !event.draft) as EventType[];
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
};

// Prints
export const getAllPrints = (): PrintType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty prints array');
    return [];
  }
  try {
    return allPrints.filter(print => !print.draft) as PrintType[];
  } catch (error) {
    console.error('Error getting all prints:', error);
    return [];
  }
};

// Resources
export const getAllResources = (): ResourceType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty resources array');
    return [];
  }
  try {
    return allResources.filter(resource => !resource.draft) as ResourceType[];
  } catch (error) {
    console.error('Error getting all resources:', error);
    return [];
  }
};

// Strategies
export const getAllStrategies = (): StrategyType[] => {
  if (!isContentlayerAvailable()) {
    console.warn('Contentlayer not available, returning empty strategies array');
    return [];
  }
  try {
    return allStrategies.filter(strategy => !strategy.draft) as StrategyType[];
  } catch (error) {
    console.error('Error getting all strategies:', error);
    return [];
  }
};

// ============================================
// BY SLUG GETTERS
// ============================================

export const getPostBySlug = (slug: string): PostType | undefined => {
  return getPublishedPosts().find(post => getDocSlug(post) === slug);
};

export const getShortBySlug = (slug: string): ShortType | undefined => {
  return getPublishedShorts().find(short => getDocSlug(short) === slug);
};

export const getBookBySlug = (slug: string): BookType | undefined => {
  return getAllBooks().find(book => getDocSlug(book) === slug);
};

export const getCanonBySlug = (slug: string): CanonType | undefined => {
  return getAllCanons().find(canon => getDocSlug(canon) === slug);
};

export const getDownloadBySlug = (slug: string): DownloadType | undefined => {
  return getAllDownloads().find(download => getDocSlug(download) === slug);
};

export const getEventBySlug = (slug: string): EventType | undefined => {
  return getAllEvents().find(event => getDocSlug(event) === slug);
};

export const getPrintBySlug = (slug: string): PrintType | undefined => {
  return getAllPrints().find(print => getDocSlug(print) === slug);
};

export const getResourceBySlug = (slug: string): ResourceType | undefined => {
  return getAllResources().find(resource => getDocSlug(resource) === slug);
};

export const getStrategyBySlug = (slug: string): StrategyType | undefined => {
  return getAllStrategies().find(strategy => getDocSlug(strategy) === slug);
};

// ============================================
// UNIVERSAL GETTERS
// ============================================

export const getAllContentlayerDocs = (): AnyDoc[] => {
  try {
    return [
      ...(allPosts || []),
      ...(allBooks || []),
      ...(allDownloads || []),
      ...(allEvents || []),
      ...(allPrints || []),
      ...(allResources || []),
      ...(allStrategies || []),
      ...(allCanons || []),
      ...(allShorts || []),
    ] as AnyDoc[];
  } catch (error) {
    console.error('Error getting all contentlayer docs:', error);
    return [];
  }
};

export const getPublishedDocuments = (): AnyDoc[] => {
  try {
    return getAllContentlayerDocs().filter(isPublished);
  } catch (error) {
    console.error('Error getting published documents:', error);
    return [];
  }
};

export const getFeaturedDocuments = (): AnyDoc[] => {
  try {
    return getPublishedDocuments().filter(doc => doc.featured === true);
  } catch (error) {
    console.error('Error getting featured documents:', error);
    return [];
  }
};

export const getPublishedDocumentsByType = (type: DocKind): AnyDoc[] => {
  try {
    const docs = getPublishedDocuments();
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
  } catch (error) {
    console.error('Error getting documents by type:', error);
    return [];
  }
};

export const getDocumentBySlug = (slug: string): AnyDoc | undefined => {
  try {
    const allDocs = [
      ...getPublishedPosts(),
      ...getAllBooks(),
      ...getAllDownloads(),
      ...getAllEvents(),
      ...getAllPrints(),
      ...getAllResources(),
      ...getAllStrategies(),
      ...getAllCanons(),
      ...getPublishedShorts(),
    ];
    
    return allDocs.find(doc => getDocSlug(doc) === slug);
  } catch (error) {
    console.error('Error getting document by slug:', error);
    return undefined;
  }
};

// ============================================
// URL & PATH HELPERS
// ============================================

export const getDocUrl = (doc: AnyDoc): string => {
  const slug = getDocSlug(doc);
  
  switch(doc._type) {
    case 'Post':
      return `/blog/${slug}`;
    case 'Short':
      return `/shorts/${slug}`;
    case 'Book':
      return `/books/${slug}`;
    case 'Canon':
      return `/canon/${slug}`;
    case 'Download':
      return `/downloads/${slug}`;
    case 'Event':
      return `/events/${slug}`;
    case 'Print':
      return `/prints/${slug}`;
    case 'Resource':
      return `/resources/${slug}`;
    case 'Strategy':
      return `/strategies/${slug}`;
    default:
      return `/${slug}`;
  }
};

export const getShortUrl = (short: ShortType): string => {
  return getDocUrl(short);
};

// ============================================
// CARD PROPS GENERATOR
// ============================================

export const getCardPropsForDocument = (doc: AnyDoc): ContentlayerCardProps => {
  const url = getDocUrl(doc);
  
  return {
    title: doc.title || 'Untitled',
    description: doc.description,
    excerpt: doc.excerpt,
    coverImage: doc.coverImage,
    date: doc.date,
    slug: getDocSlug(doc),
    tags: doc.tags || [],
    category: (doc as any).category,
    readTime: (doc as any).readTime,
    author: (doc as any).author,
    url,
    type: doc._type as DocKind,
    featured: Boolean(doc.featured),
  };
};

// ============================================
// QUERY HELPERS
// ============================================

export const getRecentShorts = (limit: number = 3): ShortType[] => {
  try {
    const shorts = getPublishedShorts();
    return shorts
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent shorts:', error);
    return [];
  }
};

export const getFeaturedShorts = (limit: number = 3): ShortType[] => {
  try {
    const shorts = getPublishedShorts();
    return shorts
      .filter(short => short.featured)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting featured shorts:', error);
    return [];
  }
};

// ============================================
// EXPORT ALL UTILITIES
// ============================================

export { isContentlayerAvailable as isContentlayerLoaded };
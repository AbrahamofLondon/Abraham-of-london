// lib/contentlayer-helper.ts
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

export interface ContentlayerCardProps {
  title: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  date?: string;
  slug?: string;
  tags?: string[];
  category?: string;
  readTime?: string;
  author?: string;
  url?: string;
  type: DocKind;
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
export const isContentlayerLoaded = true;

// ============================================
// HELPER GETTERS
// ============================================
export const getAllContentlayerDocs = (): AnyDoc[] => {
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

export const getPublishedDocuments = (): AnyDoc[] => {
  return getAllContentlayerDocs().filter(isPublished);
};

export const getFeaturedDocuments = (): AnyDoc[] => {
  return getPublishedDocuments().filter(doc => doc.featured === true);
};

export const getPublishedDocumentsByType = (type: DocKind): AnyDoc[] => {
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
};

// ============================================
// TYPE-SPECIFIC GETTERS
// ============================================
// Posts
export const getPublishedPosts = (): PostType[] => {
  return allPosts.filter(post => !post.draft) as PostType[];
};

export const getPostBySlug = (slug: string): PostType | undefined => {
  return getPublishedPosts().find(post => 
    post.slug === slug || 
    post._raw.flattenedPath.replace('blog/', '') === slug
  );
};

// Books
export const getAllBooks = (): BookType[] => {
  return allBooks.filter(book => !book.draft) as BookType[];
};

export const getBookBySlug = (slug: string): BookType | undefined => {
  return getAllBooks().find(book => 
    book.slug === slug || 
    book._raw.flattenedPath.replace('books/', '') === slug
  );
};

// Downloads
export const getAllDownloads = (): DownloadType[] => {
  return allDownloads.filter(download => !download.draft) as DownloadType[];
};

export const getDownloadBySlug = (slug: string): DownloadType | undefined => {
  return getAllDownloads().find(download => 
    download.slug === slug || 
    download._raw.flattenedPath.replace('downloads/', '') === slug
  );
};

// Events
export const getAllEvents = (): EventType[] => {
  return allEvents.filter(event => !event.draft) as EventType[];
};

export const getEventBySlug = (slug: string): EventType | undefined => {
  return getAllEvents().find(event => 
    event.slug === slug || 
    event._raw.flattenedPath.replace('events/', '') === slug
  );
};

// Prints
export const getAllPrints = (): PrintType[] => {
  return allPrints.filter(print => !print.draft) as PrintType[];
};

export const getPrintBySlug = (slug: string): PrintType | undefined => {
  return getAllPrints().find(print => 
    print.slug === slug || 
    print._raw.flattenedPath.replace('prints/', '') === slug
  );
};

// Resources
export const getAllResources = (): ResourceType[] => {
  return allResources.filter(resource => !resource.draft) as ResourceType[];
};

export const getResourceBySlug = (slug: string): ResourceType | undefined => {
  return getAllResources().find(resource => 
    resource.slug === slug || 
    resource._raw.flattenedPath.replace('resources/', '') === slug
  );
};

// Strategies
export const getAllStrategies = (): StrategyType[] => {
  return allStrategies.filter(strategy => !strategy.draft) as StrategyType[];
};

export const getStrategyBySlug = (slug: string): StrategyType | undefined => {
  return getAllStrategies().find(strategy => 
    strategy.slug === slug || 
    strategy._raw.flattenedPath.replace('strategy/', '') === slug
  );
};

// Canon
export const getAllCanons = (): CanonType[] => {
  return allCanons.filter(canon => !canon.draft) as CanonType[];
};

export const getCanonBySlug = (slug: string): CanonType | undefined => {
  return getAllCanons().find(canon => 
    canon.slug === slug || 
    canon._raw.flattenedPath.replace('canon/', '') === slug
  );
};

// Shorts
export const getPublishedShorts = (): ShortType[] => {
  return allShorts.filter(short => !short.draft) as ShortType[];
};

export const getShortBySlug = (slug: string): ShortType | undefined => {
  return getPublishedShorts().find(short => 
    short.slug === slug || 
    short._raw.flattenedPath.replace('shorts/', '') === slug
  );
};

// ============================================
// UNIVERSAL GETTERS
// ============================================
export const getDocumentBySlug = (slug: string): AnyDoc | undefined => {
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
  
  return allDocs.find(doc => {
    const docSlug = doc.slug || doc._raw.flattenedPath.split('/').pop();
    return docSlug === slug;
  });
};

export const getCardPropsForDocument = (doc: AnyDoc): ContentlayerCardProps => {
  return {
    title: doc.title || '',
    description: doc.description,
    excerpt: doc.excerpt,
    coverImage: doc.coverImage,
    date: doc.date,
    slug: doc.slug || doc._raw.flattenedPath.split('/').pop(),
    tags: doc.tags,
    category: (doc as any).category,
    readTime: (doc as any).readTime,
    author: (doc as any).author,
    url: (doc as any).url || `/${doc._raw.sourceFileDir}/${doc.slug || doc._raw.flattenedPath.split('/').pop()}`,
    type: doc._type as DocKind,
  };
};
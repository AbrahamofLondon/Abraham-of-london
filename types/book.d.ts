// types/book.d.ts
export interface BookImageType {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
}

// ---------------------------------------------------------------------------
// BOOK INTERFACES BASED ON CONTENTLAYER CONFIG
// ---------------------------------------------------------------------------

// This matches what you have in contentlayer.config.ts
export interface BookMeta {
  // Core fields from contentlayer
  title: string;
  subtitle?: string;
  date?: string;
  slug?: string;
  href?: string;
  description?: string;
  excerpt?: string;
  category?: string;
  author?: string;
  authorTitle?: string;
  readTime?: string;
  readtime?: string;
  
  // Visual & Layout
  coverImage?: string;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  layout?: string;
  theme?: string;
  
  // SEO & Social
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;
  
  // Content Management
  draft?: boolean;
  featured?: boolean;
  archived?: boolean;
  published?: boolean;
  lockMessage?: string;
  accessLevel?: string;
  available?: boolean;
  
  // Access Control
  requiredTier?: string;
  tier?: string;
  
  // Taxonomy
  tags?: string[];
  audience?: string;
  resourceType?: string;
  
  // Book-specific identifiers
  volumeNumber?: string;
  order?: number;
  isbn?: string;
  bibleVerse?: string;
  
  // File & Download
  file?: string;
  downloadFile?: string;
  pdfPath?: string;
  downloadUrl?: string;
  fileUrl?: string;
  fileSize?: string;
  
  // Additional fields from contentlayer
  canonicalUrl?: string;
  updated?: string;
  version?: string;
  language?: string;
  format?: string;
  readingTime?: string;
  
  // CTA fields
  ctaPrimary?: any;
  ctaSecondary?: any;
  
  // Relationships
  related?: string[];
  resources?: any;
  relatedDownloads?: string[];
  
  // Content structure
  toc?: boolean;
  showToc?: boolean;
  showComments?: boolean;
  
  // Series
  series?: string;
  part?: number;
  next?: string;
  prev?: string;
  
  // Content restrictions
  ageRestriction?: number;
  requiresLogin?: boolean;
  requiresSubscription?: boolean;
  
  // Statistics
  views?: number;
  likes?: number;
  shares?: number;
  
  // Scheduling
  publishDate?: string;
  expireDate?: string;
  
  // Content format
  contentType?: string;
  wordCount?: number;
  characterCount?: number;
  
  // Source
  source?: string;
  originalUrl?: string;
  license?: string;
  
  // Status
  stage?: string;
  milestone?: string;
  
  // Generic fields
  metaDescription?: string;
  keywords?: string[];
  status?: string;
  priority?: number;
  meta?: any;
  customFields?: any;
  categories?: string[];
  authors?: string[];
  
  // Contentlayer internal
  _id?: string;
  _raw?: any;
  type?: string;
  body?: any;
}

// Book with content (extends Contentlayer's Book type)
export interface Book extends BookMeta {
  // Computed fields from contentlayer
  url?: string;
  sourcePath?: string;
  isPublished?: boolean;
  effectiveReadingTime?: string;
  effectiveUpdatedDate?: string;
  computedTier?: string;
  
  // Content
  body?: any;
  rawBody?: string;
  content?: string;
  html?: string;
  compiledSource?: string;
}

// Book for client-side
export interface BookForClient extends Book {
  content: string;
  html: string;
  coverImageUrl?: string;
}

// Book summary
export interface BookSummary {
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  date?: string;
  author?: string;
  readTime?: string;
  coverImage?: string;
  categories?: string[];
  featured?: boolean;
  url?: string;
}

// ---------------------------------------------------------------------------
// TYPE GUARDS AND UTILITIES
// ---------------------------------------------------------------------------

export const BookUtils = {
  // Check if a book is published
  isPublished: (book: BookMeta): boolean => {
    if (book.draft === true) return false;
    if (book.archived === true) return false;
    return book.published !== false;
  },
  
  // Get cover image URL
  getCoverImageUrl: (book: BookMeta): string | undefined => {
    if (typeof book.coverImage === 'string') return book.coverImage;
    return undefined;
  },
  
  // Get reading time
  getReadingTime: (book: BookMeta): string => {
    return book.readTime || book.readtime || book.readingTime || "5 min read";
  },
  
  // Convert to summary
  toSummary: (book: Book): BookSummary => ({
    slug: book.slug || book._raw?.flattenedPath?.split('/').pop() || '',
    title: book.title || 'Untitled',
    subtitle: book.subtitle,
    excerpt: book.excerpt || '',
    date: book.date,
    author: book.author,
    readTime: BookUtils.getReadingTime(book),
    coverImage: BookUtils.getCoverImageUrl(book),
    categories: book.categories || [],
    featured: book.featured || false,
    url: book.url,
  }),
};
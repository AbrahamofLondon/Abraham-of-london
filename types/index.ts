// types/index.ts - COMPLETE TYPE SYSTEM WITH IMAGE FIX

// ---------------------------------------------------------------------------
// 1. SHARED IMAGE TYPE
// ---------------------------------------------------------------------------

/**
 * Image can be either a string URL or an object with src property
 */
export type ImageType = string | { src?: string } | null | undefined;

/**
 * Normalize image to string
 */
export function normalizeImage(image: ImageType): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && 'src' in image && image.src) return image.src;
  return null;
}

// ---------------------------------------------------------------------------
// 2. BASE TYPES - Foundation for all content
// ---------------------------------------------------------------------------

/**
 * Base interface for all content types
 */
export interface ContentBase {
  // Core identifiers
  slug: string;
  title: string;
  
  // Metadata
  date?: string;
  description?: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  featured?: boolean;
  
  // Visual - FIXED: Allow object or string
  coverImage?: ImageType;
  image?: ImageType;
  
  // Content
  content?: string;
  body?: {
    code: string;
    raw: string;
  };
  
  // State
  draft?: boolean;
  published?: boolean;
  status?: "draft" | "published" | "scheduled" | "archived" | "private";
  
  // Access
  accessLevel?: "public" | "premium" | "private";
  lockMessage?: string;
  
  // Raw data
  _raw?: {
    flattenedPath?: string;
    sourceFilePath?: string;
    sourceFileDir?: string;
    contentType?: string;
    flatData?: Record<string, any>;
    [key: string]: any;
  };
  
  // System fields
  _id?: string;
  url?: string;
  type?: string;
  readTime?: number | string;
  readingTime?: number | string;
  author?: string;
  
  // Flexible additional properties
  [key: string]: any;
}

/**
 * Metadata-only version (for listings)
 */
export type ContentMeta = Omit<ContentBase, 'content' | 'body'>;

/**
 * Content with ID for database operations
 */
export interface ContentWithId extends ContentBase {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 3. SPECIFIC CONTENT TYPES
// ---------------------------------------------------------------------------

/**
 * POST / BLOG / ESSAY
 */
export interface Post extends ContentBase {
  subtitle?: string;
  updated?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  series?: string;
  part?: number;
  layout?: "post" | "article" | "essay";
  template?: string;
  ogImage?: ImageType;
}

/**
 * BOOK / VOLUME
 */
export interface Book extends ContentBase {
  subtitle?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  language?: string;
  price?: string;
  purchaseLink?: string;
  pages?: number;
  format?: "hardcover" | "paperback" | "ebook" | "audiobook" | "pdf";
  series?: string;
  volume?: number | string;
  edition?: string;
  rating?: number;
  genre?: string[];
  translator?: string;
  illustrator?: string;
  forewordBy?: string;
  introductionBy?: string;
  dimensions?: string;
  weight?: string;
  binding?: string;
}

/**
 * DOWNLOAD / TOOL / RESOURCE
 */
export interface Download extends ContentBase {
  downloadFile?: string;
  fileName?: string;
  fileSize?: string | number;
  fileFormat?: string;
  fileUrl?: string;
  downloadUrl?: string;
  version?: string;
  versionDate?: string;
  changelog?: string[];
  requirements?: string[];
  compatibility?: string[];
  systemRequirements?: string;
  license?: string;
  licenseUrl?: string;
  termsOfUse?: string;
  useCases?: string[];
  applications?: string[];
  industries?: string[];
  framework?: string;
  dependencies?: string[];
  installation?: string;
  supportEmail?: string;
  documentationUrl?: string;
  tutorialUrl?: string;
}

export type DownloadMeta = Download;

/**
 * EVENT / SESSION / MASTERCLASS
 */
export interface Event extends ContentBase {
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  duration?: string;
  location?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  isOnline?: boolean;
  onlineUrl?: string;
  registrationUrl?: string;
  registrationDeadline?: string;
  price?: string | number;
  currency?: string;
  capacity?: number;
  seatsAvailable?: number;
  speakers?: string[];
  host?: string;
  organizer?: string;
  eventType?: "workshop" | "conference" | "webinar" | "masterclass" | "meetup";
  level?: "beginner" | "intermediate" | "advanced" | "all";
  requirements?: string[];
  materials?: string[];
  takeaways?: string[];
  isUpcoming?: boolean;
  isPast?: boolean;
  isCancelled?: boolean;
}

export type EventMeta = Event;

export interface EventResources {
  articles?: any[];
  downloads?: any[];
  relatedEvents?: any[];
  books?: any[];
  canonicalReferences?: any[];
}

export interface EventResourceLink {
  type: string;
  title: string;
  url: string;
  description?: string;
}

/**
 * PRINT / EDITION / ARTWORK
 */
export interface Print extends ContentBase {
  dimensions?: string;
  material?: string;
  finish?: string;
  weight?: string;
  editionNumber?: string | number;
  editionSize?: number;
  limitedEdition?: boolean;
  signed?: boolean;
  numbered?: boolean;
  printMethod?: string;
  paperType?: string;
  inkType?: string;
  price?: string | number;
  currency?: string;
  salePrice?: string | number;
  inStock?: boolean;
  stockQuantity?: number;
  shippingWeight?: string;
  shippingCost?: string | number;
  shipsFrom?: string;
  artist?: string;
  yearCreated?: string | number;
  style?: string;
  medium?: string;
  frame?: string;
  orientation?: "portrait" | "landscape" | "square";
}

export type PrintMeta = Print;

/**
 * RESOURCE / FRAMEWORK / TEMPLATE
 */
export interface Resource extends ContentBase {
  resourceType?: "framework" | "template" | "checklist" | "guide" | "worksheet" | string;
  applications?: string[];
  useCases?: string[];
  industries?: string[];
  format?: "pdf" | "doc" | "xls" | "notion" | "figma" | "miro" | string;
  complexity?: "simple" | "moderate" | "complex";
  timeRequired?: string;
  version?: string;
  lastUpdated?: string;
  prerequisites?: string[];
  toolsRequired?: string[];
  deliverables?: string[];
  outcomes?: string[];
  instructions?: string;
  examples?: string[];
  tips?: string[];
}

export type ResourceMeta = Resource;

/**
 * STRATEGY / METHODOLOGY
 */
export interface Strategy extends ContentBase {
  strategyType?: "business" | "marketing" | "product" | "operational" | "financial" | string;
  framework?: string;
  methodology?: string;
  scope?: "department" | "team" | "organization" | "project";
  scale?: "small" | "medium" | "large" | "enterprise";
  timeframe?: "short-term" | "mid-term" | "long-term";
  implementationTime?: string;
  kpis?: string[];
  successMetrics?: string[];
  roi?: string;
  steps?: string[];
  phases?: string[];
  milestones?: string[];
  risks?: string[];
  challenges?: string[];
  mitigation?: string[];
  tools?: string[];
  templates?: string[];
  software?: string[];
}

export type StrategyMeta = Strategy;

/**
 * CANON / REFERENCE / ARCHIVE
 */
export interface Canon extends ContentBase {
  canonType?: "principle" | "law" | "rule" | "heuristic" | "maxim" | string;
  origin?: string;
  source?: string;
  attributedTo?: string;
  era?: string;
  domain?: string[];
  context?: string[];
  exceptions?: string[];
  strength?: "weak" | "moderate" | "strong" | "absolute";
  evidence?: string;
  counterpoints?: string[];
  relatedCanons?: string[];
  derivedFrom?: string;
  variations?: string[];
  volumeNumber?: string | number;
  order?: number;
  importance?: number;
  frequency?: string;
  memorability?: string;
  icon?: string;
  color?: string;
  symbol?: string;
}

export type CanonMeta = Canon;

/**
 * PAGE / STATIC PAGE
 */
export interface Page extends ContentBase {
  pageType?: string;
  parentPage?: string;
  showInNav?: boolean;
  layout?: "default" | "wide" | "narrow" | "fullscreen";
  template?: string;
  metaTitle?: string;
  metaDescription?: string;
  noIndex?: boolean;
  navOrder?: number;
  navTitle?: string;
  navGroup?: string;
  components?: any[];
  sections?: any[];
}

export type PageMeta = Page;

// ---------------------------------------------------------------------------
// 4. UNIFIED TYPES
// ---------------------------------------------------------------------------

/**
 * Union type of all content types
 */
export type DocumentTypes = 
  | Post 
  | Book 
  | Download 
  | Event 
  | Print 
  | Resource 
  | Strategy 
  | Canon
  | Page;

/**
 * Generic content entry for backward compatibility
 */
export interface ContentEntry {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: {
    flattenedPath?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Search result type
 */
export interface SearchResult {
  type: string;
  score: number;
  document: DocumentTypes;
  highlights: {
    field: string;
    snippet: string;
  }[];
}

/**
 * Filter options for content queries
 */
export interface ContentFilter {
  type?: string;
  category?: string;
  tags?: string[];
  author?: string;
  featured?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'title' | 'featured' | 'readTime';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Statistics about content
 */
export interface ContentStats {
  total: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
  featured: number;
  recentAdditions: number;
}

// ---------------------------------------------------------------------------
// 5. FIELD KEY TYPES
// ---------------------------------------------------------------------------

export type DownloadFieldKey = keyof DownloadMeta;
export type EventFieldKey = keyof EventMeta;
export type PostFieldKey = keyof Post;
export type BookFieldKey = keyof Book;
export type PrintFieldKey = keyof PrintMeta;
export type ResourceFieldKey = keyof ResourceMeta;
export type StrategyFieldKey = keyof StrategyMeta;
export type CanonFieldKey = keyof CanonMeta;
export type PageFieldKey = keyof PageMeta;

// ---------------------------------------------------------------------------
// 6. TYPE GUARD FUNCTIONS
// ---------------------------------------------------------------------------

export function isPost(doc: any): doc is Post {
  return doc && (doc.type === 'post' || doc.type === 'essay' || doc._raw?.sourceFilePath?.includes('/posts/'));
}

export function isBook(doc: any): doc is Book {
  return doc && doc.type === 'book';
}

export function isDownload(doc: any): doc is Download {
  return doc && doc.type === 'download';
}

export function isEvent(doc: any): doc is Event {
  return doc && doc.type === 'event';
}

export function isPrint(doc: any): doc is Print {
  return doc && doc.type === 'print';
}

export function isResource(doc: any): doc is Resource {
  return doc && doc.type === 'resource';
}

export function isStrategy(doc: any): doc is Strategy {
  return doc && doc.type === 'strategy';
}

export function isCanon(doc: any): doc is Canon {
  return doc && doc.type === 'canon';
}

export function isPage(doc: any): doc is Page {
  return doc && doc.type === 'page';
}

// ---------------------------------------------------------------------------
// 7. UTILITY FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Get content type from document
 */
export function getContentType(doc: any): string {
  if (isPost(doc)) return 'post';
  if (isBook(doc)) return 'book';
  if (isDownload(doc)) return 'download';
  if (isEvent(doc)) return 'event';
  if (isPrint(doc)) return 'print';
  if (isResource(doc)) return 'resource';
  if (isStrategy(doc)) return 'strategy';
  if (isCanon(doc)) return 'canon';
  if (isPage(doc)) return 'page';
  return 'unknown';
}

/**
 * Convert any document to ContentEntry for backward compatibility
 */
export function toContentEntry(doc: DocumentTypes): ContentEntry {
  return {
    slug: doc.slug,
    title: doc.title,
    date: doc.date,
    excerpt: doc.excerpt,
    description: doc.description,
    category: doc.category,
    tags: doc.tags,
    featured: doc.featured,
    readTime: doc.readTime,
    _raw: doc._raw,
  };
}

/**
 * Safe type assertion with defaults
 */
export function safeCast<T extends ContentBase>(obj: any, defaults: Partial<T> = {}): T {
  return {
    ...defaults,
    ...obj,
  } as T;
}

// ---------------------------------------------------------------------------
// 8. UTILITY OBJECT EXPORT
// ---------------------------------------------------------------------------

export const TypeUtils = {
  isPost,
  isBook,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isStrategy,
  isCanon,
  isPage,
  getContentType,
  toContentEntry,
  safeCast,
  normalizeImage,
};

// ---------------------------------------------------------------------------
// 9. DEFAULT EXPORT
// ---------------------------------------------------------------------------

const ContentTypes = {
  utils: TypeUtils,
};

export default ContentTypes;

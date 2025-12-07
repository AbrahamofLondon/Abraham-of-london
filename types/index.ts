// types/index.ts
// COMPREHENSIVE CONTENT TYPE SYSTEM
// Centralized type definitions for all content collections

// ---------------------------------------------------------------------------
// 1. BASE TYPES - Foundation for all content
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
  
  // Visual
  coverImage?: string;
  image?: string;
  
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

// ---------------------------------------------------------------------------
// 2. SPECIFIC CONTENT TYPES (Aligned with actual data structure)
// ---------------------------------------------------------------------------

/**
 * POST / BLOG / ESSAY
 */
export interface Post extends ContentBase {
  // Post-specific fields
  subtitle?: string;
  updated?: string;
  
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  
  // Series
  series?: string;
  part?: number;
  
  // Layout
  layout?: "post" | "article" | "essay";
  template?: string;
}

/**
 * BOOK / VOLUME
 */
export interface Book extends ContentBase {
  // Book-specific fields
  subtitle?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  language?: string;
  price?: string;
  purchaseLink?: string;
  pages?: number;
  
  // Format
  format?: "hardcover" | "paperback" | "ebook" | "audiobook" | "pdf";
  
  // Book details
  series?: string;
  volume?: number | string;
  edition?: string;
  rating?: number;
  
  // Additional metadata
  genre?: string[];
  translator?: string;
  illustrator?: string;
  forewordBy?: string;
  introductionBy?: string;
  
  // Physical properties
  dimensions?: string;
  weight?: string;
  binding?: string;
}

/**
 * DOWNLOAD / TOOL / RESOURCE
 */
export interface Download extends ContentBase {
  // File information - CRITICAL: match actual field names
  downloadFile?: string;
  fileName?: string;
  fileSize?: string | number;
  fileFormat?: string;
  fileUrl?: string;
  downloadUrl?: string;
  
  // Versioning
  version?: string;
  versionDate?: string;
  changelog?: string[];
  
  // Requirements
  requirements?: string[];
  compatibility?: string[];
  systemRequirements?: string;
  
  // Licensing
  license?: string;
  licenseUrl?: string;
  termsOfUse?: string;
  
  // Usage
  useCases?: string[];
  applications?: string[];
  industries?: string[];
  
  // Technical
  framework?: string;
  dependencies?: string[];
  installation?: string;
  
  // Support
  supportEmail?: string;
  documentationUrl?: string;
  tutorialUrl?: string;
}

export type DownloadMeta = Download;

/**
 * EVENT / SESSION / MASTERCLASS
 */
export interface Event extends ContentBase {
  // Timing - CRITICAL: match actual field names
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  duration?: string;
  
  // Location
  location?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  isOnline?: boolean;
  onlineUrl?: string;
  
  // Registration
  registrationUrl?: string;
  registrationDeadline?: string;
  price?: string | number;
  currency?: string;
  capacity?: number;
  seatsAvailable?: number;
  
  // Speakers
  speakers?: string[];
  host?: string;
  organizer?: string;
  
  // Event details
  eventType?: "workshop" | "conference" | "webinar" | "masterclass" | "meetup";
  level?: "beginner" | "intermediate" | "advanced" | "all";
  
  // Logistics
  requirements?: string[];
  materials?: string[];
  takeaways?: string[];
  
  // Status
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
  // Physical properties
  dimensions?: string;
  material?: string;
  finish?: string;
  weight?: string;
  
  // Edition details
  editionNumber?: string | number;
  editionSize?: number;
  limitedEdition?: boolean;
  signed?: boolean;
  numbered?: boolean;
  
  // Production
  printMethod?: string;
  paperType?: string;
  inkType?: string;
  
  // Pricing
  price?: string | number;
  currency?: string;
  salePrice?: string | number;
  inStock?: boolean;
  stockQuantity?: number;
  
  // Shipping
  shippingWeight?: string;
  shippingCost?: string | number;
  shipsFrom?: string;
  
  // Art details
  artist?: string;
  yearCreated?: string | number;
  style?: string;
  medium?: string;
  
  // Display
  frame?: string;
  orientation?: "portrait" | "landscape" | "square";
}

export type PrintMeta = Print;

/**
 * RESOURCE / FRAMEWORK / TEMPLATE
 */
export interface Resource extends ContentBase {
  // Type classification - CRITICAL: match actual field names
  resourceType?: "framework" | "template" | "checklist" | "guide" | "worksheet" | string;
  applications?: string[];
  
  // Additional fields
  useCases?: string[];
  industries?: string[];
  
  // Format
  format?: "pdf" | "doc" | "xls" | "notion" | "figma" | "miro" | string;
  
  // Complexity
  complexity?: "simple" | "moderate" | "complex";
  timeRequired?: string;
  
  // Version
  version?: string;
  lastUpdated?: string;
  
  // Dependencies
  prerequisites?: string[];
  toolsRequired?: string[];
  
  // Output
  deliverables?: string[];
  outcomes?: string[];
  
  // Support
  instructions?: string;
  examples?: string[];
  tips?: string[];
}

export type ResourceMeta = Resource;

/**
 * STRATEGY / METHODOLOGY
 */
export interface Strategy extends ContentBase {
  // Strategy classification
  strategyType?: "business" | "marketing" | "product" | "operational" | "financial" | string;
  
  // Framework details
  framework?: string;
  methodology?: string;
  
  // Application scope
  scope?: "department" | "team" | "organization" | "project";
  scale?: "small" | "medium" | "large" | "enterprise";
  
  // Timeframe
  timeframe?: "short-term" | "mid-term" | "long-term";
  implementationTime?: string;
  
  // Metrics
  kpis?: string[];
  successMetrics?: string[];
  roi?: string;
  
  // Implementation
  steps?: string[];
  phases?: string[];
  milestones?: string[];
  
  // Risks
  risks?: string[];
  challenges?: string[];
  mitigation?: string[];
  
  // Tools
  tools?: string[];
  templates?: string[];
  software?: string[];
}

export type StrategyMeta = Strategy;

/**
 * CANON / REFERENCE / ARCHIVE
 */
export interface Canon extends ContentBase {
  // Canon classification
  canonType?: "principle" | "law" | "rule" | "heuristic" | "maxim" | string;
  
  // Origin
  origin?: string;
  source?: string;
  attributedTo?: string;
  era?: string;
  
  // Application
  domain?: string[];
  context?: string[];
  exceptions?: string[];
  
  // Strength
  strength?: "weak" | "moderate" | "strong" | "absolute";
  evidence?: string;
  counterpoints?: string[];
  
  // Related
  relatedCanons?: string[];
  derivedFrom?: string;
  variations?: string[];
  
  // Metadata - CRITICAL: match actual field names
  volumeNumber?: string | number;
  order?: number;
  importance?: number;
  frequency?: string;
  memorability?: string;
  
  // Presentation
  icon?: string;
  color?: string;
  symbol?: string;
}

export type CanonMeta = Canon;

/**
 * PAGE / STATIC PAGE
 */
export interface Page extends ContentBase {
  // Page-specific fields
  pageType?: string;
  parentPage?: string;
  showInNav?: boolean;
  layout?: "default" | "wide" | "narrow" | "fullscreen";
  template?: string;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  noIndex?: boolean;
  
  // Navigation
  navOrder?: number;
  navTitle?: string;
  navGroup?: string;
  
  // Components
  components?: any[];
  sections?: any[];
}

export type PageMeta = Page;

// ---------------------------------------------------------------------------
// 3. UNIFIED TYPES
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

// ---------------------------------------------------------------------------
// 4. HELPER TYPES & UTILITIES
// ---------------------------------------------------------------------------

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
// 5. TYPE UTILITY FUNCTIONS
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
 * Type guard functions
 */
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
// 6. FIELD KEY TYPES (For lib/ modules)
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
// 7. EXPORT EVERYTHING
// ---------------------------------------------------------------------------

export default {
  // Base Types
  ContentBase,
  ContentMeta,
  ContentWithId,
  
  // Specific Types
  Post,
  Book,
  Download,
  DownloadMeta,
  Event,
  EventMeta,
  EventResources,
  EventResourceLink,
  Print,
  PrintMeta,
  Resource,
  ResourceMeta,
  Strategy,
  StrategyMeta,
  Canon,
  CanonMeta,
  Page,
  PageMeta,
  
  // Union Types
  DocumentTypes,
  ContentEntry,
  
  // Helper Types
  SearchResult,
  ContentFilter,
  PaginatedResponse,
  ContentStats,
  
  // Field Key Types
  DownloadFieldKey,
  EventFieldKey,
  PostFieldKey,
  BookFieldKey,
  PrintFieldKey,
  ResourceFieldKey,
  StrategyFieldKey,
  CanonFieldKey,
  PageFieldKey,
  
  // Utility Functions
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
};
// Unified content index for all content types - Type-safe and robust

import { getAllPages } from "./pages-data";
import { getAllDownloadsMeta } from "./downloads-data";
import { getAllEventsMeta } from "./events-data";
import { getAllPostsMeta } from "./posts-data";
import { getAllBooksMeta } from "./books-data";
import { getAllPrintsMeta } from "./prints-data";
import { getAllResourcesMeta } from "./resources-data";
import { getAllCanon } from "./canon-data";
import { getAllStrategiesMeta } from "./strategies-data";

import type {
  ContentBase,
  Post,
  Book,
  Download,
  Event,
  Print,
  Resource,
  Strategy,
  Canon,
  ContentEntry,
} from "@/types/index";

export type UnifiedType =
  | "essay"
  | "book"
  | "download"
  | "event"
  | "print"
  | "page"
  | "resource"
  | "canon"
  | "strategy";

export interface UnifiedContent extends ContentBase {
  id: string;
  type: UnifiedType;
  url: string;
  // Type-specific fields
  resourceType?: string;
  applications?: string[];
  // Canon-specific
  volumeNumber?: string | number;
  order?: number;
  // Event-specific
  eventDate?: string;
  location?: string;
  // Download-specific
  downloadFile?: string;
  fileSize?: string;
  // Book-specific
  isbn?: string;
  format?: string;
  // Page-specific
  pageType?: string;
  parentPage?: string;
  showInNav?: boolean;
}

// Content validation utility
export function validateContentItem(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  
  // Required fields check
  if (!item.slug && !item._raw?.flattenedPath) {
    console.warn('[unified-content] Item missing slug:', item.title || 'Unknown');
    return false;
  }
  
  if (!item.title || item.title.trim() === '') {
    console.warn('[unified-content] Item missing title:', item.slug || 'Unknown');
    return false;
  }
  
  return true;
}

// Safe loader helper with comprehensive error handling - FIXED VERSION
async function safeLoad<T>(
  label: string,
  loader: () => Promise<T[]> | T[],
  fallback: T[] = []
): Promise<T[]> {
  try {
    console.time(`[unified-content] Loading ${label}`);
    
    // FIX: Properly handle both sync and async loaders
    const loaderResult = loader();
    const result = loaderResult instanceof Promise 
      ? await loaderResult 
      : loaderResult;
    
    if (!Array.isArray(result)) {
      console.warn(`[unified-content] ${label} returned non-array:`, typeof result);
      return fallback;
    }
    
    const validItems = result.filter(item => validateContentItem(item));
    console.timeEnd(`[unified-content] Loading ${label}`);
    console.log(`[unified-content] Loaded ${label}: ${validItems.length} items`);
    
    return validItems;
  } catch (error) {
    console.error(`[unified-content] Failed loading ${label}:`, error);
    return fallback;
  }
}

// Type mapper functions
function mapToUnifiedContent(
  item: any,
  type: UnifiedType,
  baseUrl: string = ""
): UnifiedContent | null {
  if (!item || typeof item !== 'object') return null;
  
  const slug = item.slug || item._raw?.flattenedPath || '';
  if (!slug) return null;
  
  const title = item.title || 'Untitled';
  const id = `${type}-${slug}`;
  
  // Build URL based on type with robust handling
  let url = baseUrl || '';
  if (!url) {
    if (type === 'page') {
      // For pages, use slug directly or with / prefix
      url = slug.startsWith('/') ? slug : `/${slug}`;
      // Ensure home page is '/'
      if (url === '/index' || url === '/home') url = '/';
    } else {
      url = `/${type === 'essay' ? 'blog' : type + 's'}/${slug}`;
    }
  }
  
  return {
    id,
    type,
    slug,
    title,
    url,
    
    // ContentBase fields
    description: item.description || item.excerpt || undefined,
    excerpt: item.excerpt || item.description || undefined,
    date: item.date || item.publishedDate || item.eventDate || undefined,
    author: item.author || undefined,
    category: item.category || undefined,
    tags: Array.isArray(item.tags) ? item.tags : [],
    featured: Boolean(item.featured),
    readTime: item.readTime || item.readingTime || undefined,
    coverImage: item.coverImage || item.image || undefined,
    content: item.content || undefined,
    draft: Boolean(item.draft),
    published: Boolean(item.published),
    status: item.status || (item.draft ? 'draft' : 'published'),
    accessLevel: item.accessLevel || 'public',
    lockMessage: item.lockMessage || undefined,
    _raw: item._raw || undefined,
    _id: item._id || undefined,
    
    // Type-specific fields
    ...(type === 'resource' && {
      resourceType: item.resourceType || 'Framework',
      applications: Array.isArray(item.applications) ? item.applications : ['Strategy', 'Execution']
    }),
    ...(type === 'canon' && {
      volumeNumber: item.volumeNumber,
      order: item.order
    }),
    ...(type === 'event' && {
      eventDate: item.eventDate,
      location: item.location
    }),
    ...(type === 'download' && {
      downloadFile: item.downloadFile,
      fileSize: item.fileSize
    }),
    ...(type === 'book' && {
      isbn: item.isbn,
      format: item.format,
      publisher: item.publisher,
      pages: item.pages
    }),
    ...(type === 'page' && {
      pageType: item.pageType || 'standard',
      parentPage: item.parentPage || undefined,
      showInNav: item.showInNav !== false, // Default to true
    }),
    
    // Preserve additional fields
    ...Object.fromEntries(
      Object.entries(item).filter(([key]) => ![
        'slug', 'title', 'description', 'excerpt', 'date', 'author',
        'category', 'tags', 'featured', 'readTime', 'coverImage', 'image',
        'content', 'draft', 'published', 'status', 'accessLevel', 'lockMessage',
        '_raw', '_id', 'type', 'resourceType', 'applications', 'volumeNumber',
        'order', 'eventDate', 'location', 'downloadFile', 'fileSize', 'isbn',
        'format', 'publisher', 'pages', 'pageType', 'parentPage', 'showInNav'
      ].includes(key))
    ),
  };
}

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  console.time('[unified-content] Total load time');
  
  // Load all content types in parallel
  const [
    pages,
    essays,
    books,
    downloads,
    events,
    prints,
    resources,
    canons,
    strategies,
  ] = await Promise.all([
    safeLoad('pages', () => getAllPages()),
    safeLoad('essays', () => getAllPostsMeta()),
    safeLoad('books', () => getAllBooksMeta()),
    safeLoad('downloads', () => getAllDownloadsMeta()),
    safeLoad('events', () => getAllEventsMeta()),
    safeLoad('prints', () => getAllPrintsMeta()),
    safeLoad('resources', () => getAllResourcesMeta()),
    safeLoad('canons', () => getAllCanon()),
    safeLoad('strategies', () => getAllStrategiesMeta()),
  ]);
  
  const unified: UnifiedContent[] = [];
  
  // Map each type to unified format
  const mappers: Array<[any[], UnifiedType, string?]> = [
    [pages, 'page', ''],
    [essays, 'essay'],
    [books, 'book'],
    [downloads, 'download'],
    [events, 'event'],
    [prints, 'print'],
    [resources, 'resource'],
    [canons, 'canon'],
    [strategies, 'strategy'],
  ];
  
  for (const [items, type, baseUrl] of mappers) {
    let count = 0;
    for (const item of items) {
      const unifiedItem = mapToUnifiedContent(item, type, baseUrl);
      if (unifiedItem) {
        unified.push(unifiedItem);
        count++;
      }
    }
    console.log(`[unified-content] Mapped ${count} ${type} items`);
  }
  
  // Sort by date (newest first)
  unified.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  console.timeEnd('[unified-content] Total load time');
  console.log(`[unified-content] Total unified items: ${unified.length}`);
  
  return unified;
}

export async function getUnifiedContentByType(type: UnifiedType): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter(item => item.type === type);
}

export async function searchUnifiedContent(
  query: string,
  options?: {
    types?: UnifiedType[];
    fields?: ('title' | 'description' | 'excerpt' | 'tags' | 'content' | 'author')[];
    limit?: number;
  }
): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) return options?.limit ? all.slice(0, options.limit) : all;
  
  // Filter by type if specified
  let filtered = all;
  if (options?.types && options.types.length > 0) {
    filtered = filtered.filter(item => options.types!.includes(item.type));
  }
  
  // Search in specified fields
  const searchFields = options?.fields || ['title', 'description', 'excerpt', 'tags'];
  const results = filtered.filter(item => {
    for (const field of searchFields) {
      if (field === 'tags') {
        if (item.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) {
          return true;
        }
      } else {
        const value = item[field];
        if (typeof value === 'string' && value.toLowerCase().includes(normalizedQuery)) {
          return true;
        }
      }
    }
    return false;
  });
  
  return options?.limit ? results.slice(0, options.limit) : results;
}

export async function getContentStats(): Promise<{
  total: number;
  byType: Record<UnifiedType, number>;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
  featured: number;
}> {
  const all = await getAllUnifiedContent();
  
  const stats = {
    total: all.length,
    byType: {} as Record<UnifiedType, number>,
    byCategory: {} as Record<string, number>,
    byYear: {} as Record<string, number>,
    featured: 0,
  };
  
  all.forEach(item => {
    // Count by type
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
    
    // Count by category
    if (item.category) {
      stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
    }
    
    // Count by year
    if (item.date) {
      const year = new Date(item.date).getFullYear().toString();
      stats.byYear[year] = (stats.byYear[year] || 0) + 1;
    }
    
    // Count featured
    if (item.featured) {
      stats.featured++;
    }
  });
  
  return stats;
}

export default {
  getAllUnifiedContent,
  getUnifiedContentByType,
  searchUnifiedContent,
  getContentStats,
  validateContentItem,
};
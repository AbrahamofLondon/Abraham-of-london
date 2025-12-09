// lib/server/pages-data.ts - FIXED VERSION
// Pages under content/pages/* - Using MDX collections

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Page, ContentEntry, ContentMeta } from "@/types/index";

export type PageWithContent = Page & {
  content: string;
};

// Extended MDX meta with page-specific fields
type PageishMdxMeta = MdxMeta & Partial<Page> & {
  publishDate?: string;
  releaseDate?: string;
  [key: string]: any;
};

type PageishMdxDocument = MdxDocument & {
  content: string;
} & Partial<Page>;

// ---------------------------------------------------------------------------
// SAFE TYPE CONVERTERS
// ---------------------------------------------------------------------------

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true") return true;
    if (lower === "false") return false;
    if (lower === "yes") return true;
    if (lower === "no") return false;
    if (lower === "1") return true;
    if (lower === "0") return false;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return undefined;
}

function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}

function safeStatus(
  value: unknown
): "draft" | "published" | "scheduled" | "archived" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled" || value === "archived") {
    return value;
  }
  return undefined;
}

function safeAccessLevel(
  value: unknown
): "public" | "premium" | "private" | undefined {
  if (value === "public" || value === "premium" || value === "private") {
    return value;
  }
  return undefined;
}

/**
 * Safely convert layout field to allowed values
 */
function safeLayout(
  value: unknown
): "narrow" | "default" | "wide" | "fullscreen" | undefined {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "narrow") return "narrow";
    if (lowerValue === "default") return "default";
    if (lowerValue === "wide") return "wide";
    if (lowerValue === "fullscreen") return "fullscreen";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// MAIN CONVERSION FUNCTIONS
// ---------------------------------------------------------------------------

function fromMdxMeta(meta: MdxMeta): Page {
  const m = meta as PageishMdxMeta;

  // Handle different date fields
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate);
  
  // Ensure required fields have defaults
  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled Page";
  
  if (!slug || !title) {
    console.warn(`Page metadata missing slug or title: ${slug} - ${title}`);
  }

  return {
    // Core identifiers
    slug,
    title,

    // Content fields
    description: safeString(m.description),
    excerpt: safeString(m.excerpt),
    subtitle: safeString(m.subtitle),

    // Metadata
    date,
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    readTime: safeString(m.readTime) || safeNumber(m.readTime),

    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),

    // Page-specific fields
    pageType: safeString(m.pageType) || "page",
    parentPage: safeString(m.parentPage),
    order: safeNumber(m.order),
    template: safeString(m.template),
    layout: safeLayout(m.layout) || "default", // Use safeLayout converter with default
    showInNav: safeBoolean(m.showInNav),
    navOrder: safeNumber(m.navOrder),
    navTitle: safeString(m.navTitle),
    metaTitle: safeString(m.metaTitle),
    metaDescription: safeString(m.metaDescription),
    keywords: safeArray(m.keywords),
    lastModified: safeString(m.lastModified),

    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    status: safeStatus(m.status),

    // Access
    accessLevel: safeAccessLevel(m.accessLevel) || "public",
    lockMessage: safeString(m.lockMessage),

    // System fields
    _raw: m._raw,
    _id: safeString(m._id),
    url: safeString(m.url),
    type: safeString(m.type) || "page",

    // Preserve any additional fields
    ...Object.fromEntries(
      Object.entries(m)
        .filter(([key]) => ![
          'slug', 'title', 'description', 'excerpt', 'subtitle',
          'date', 'author', 'category', 'tags', 'featured', 'readTime',
          'coverImage', 'image', 'pageType', 'parentPage', 'order',
          'template', 'layout', 'showInNav', 'navOrder', 'navTitle',
          'metaTitle', 'metaDescription', 'keywords', 'lastModified',
          'draft', 'published', 'status', 'accessLevel', 'lockMessage',
          '_raw', '_id', 'url', 'type', 'publishDate', 'releaseDate'
        ].includes(key))
        .map(([key, value]) => [key, value])
    ),
  };
}

function fromMdxDocument(doc: MdxDocument): PageWithContent {
  const pageDoc = doc as PageishMdxDocument;
  const { content, ...rest } = pageDoc;
  const meta = fromMdxMeta(rest);
  
  return { 
    ...meta, 
    content: typeof content === "string" ? content : "",
    body: pageDoc.body || undefined,
  };
}

export function pageToContentMeta(page: Page): ContentMeta {
  const { content, body, ...meta } = page;
  return meta;
}

export function pageToContentEntry(page: Page): ContentEntry {
  return {
    slug: page.slug,
    title: page.title,
    date: page.date,
    excerpt: page.excerpt,
    description: page.description,
    category: page.category,
    tags: page.tags,
    featured: page.featured,
    readTime: page.readTime,
    _raw: page._raw,
    ...Object.fromEntries(
      Object.entries(page)
        .filter(([key]) => ![
          'slug', 'title', 'date', 'excerpt', 'description', 'category',
          'tags', 'featured', 'readTime', '_raw', 'content', 'body'
        ].includes(key))
    ),
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API FUNCTIONS
// ---------------------------------------------------------------------------

export function getAllPagesMeta(): Page[] {
  try {
    const metas = getMdxCollectionMeta("pages");
    if (!metas || !Array.isArray(metas)) {
      console.warn("No pages metadata found or metadata is not an array");
      return [];
    }
    
    const pages = metas.map((m) => fromMdxMeta(m));
    
    // Filter out invalid pages (missing required fields)
    const validPages = pages.filter(page => {
      const isValid = page.slug && page.title;
      if (!isValid) {
        console.warn(`Invalid page skipped: ${page.slug || 'no-slug'} - ${page.title || 'no-title'}`);
      }
      return isValid;
    });
    
    console.log(`Found ${validPages.length} valid pages out of ${metas.length} total`);
    return validPages;
  } catch (error) {
    console.error("Error fetching all pages meta:", error);
    return [];
  }
}

export function getPageBySlug(slug: string): PageWithContent | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.error("getPageBySlug called with invalid slug:", slug);
      return null;
    }
    
    const doc = getMdxDocumentBySlug("pages", slug);
    if (!doc) {
      console.warn(`No page found for slug: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`Error fetching page by slug (${slug}):`, error);
    return null;
  }
}

export function getAllPages(): PageWithContent[] {
  try {
    const metas = getAllPagesMeta();
    if (metas.length === 0) return [];
    
    const pagesWithContent: PageWithContent[] = [];
    
    for (const meta of metas) {
      const page = getPageBySlug(meta.slug);
      if (page) {
        pagesWithContent.push(page);
      } else {
        console.warn(`Could not load content for page: ${meta.slug}`);
      }
    }
    
    return pagesWithContent;
  } catch (error) {
    console.error("Error fetching all pages:", error);
    return [];
  }
}

export function getPagesByCategory(category: string): Page[] {
  try {
    const pages = getAllPagesMeta();
    if (!category || typeof category !== 'string') return [];
    
    const normalizedCategory = category.toLowerCase().trim();
    
    return pages.filter(page => {
      const pageCategory = page.category?.toLowerCase().trim();
      return pageCategory === normalizedCategory;
    });
  } catch (error) {
    console.error(`Error fetching pages by category (${category}):`, error);
    return [];
  }
}

export function getPagesByTag(tag: string): Page[] {
  try {
    const pages = getAllPagesMeta();
    if (!tag || typeof tag !== 'string') return [];
    
    const normalizedTag = tag.toLowerCase().trim();
    
    return pages.filter(page => {
      return page.tags?.some(t => t.toLowerCase().trim() === normalizedTag);
    });
  } catch (error) {
    console.error(`Error fetching pages by tag (${tag}):`, error);
    return [];
  }
}

export function getFeaturedPages(): Page[] {
  try {
    const pages = getAllPagesMeta();
    return pages.filter(page => page.featured === true);
  } catch (error) {
    console.error("Error fetching featured pages:", error);
    return [];
  }
}

export function getPublishedPages(): Page[] {
  try {
    const pages = getAllPagesMeta();
    return pages.filter(page => 
      page.draft !== true && 
      page.status !== "draft" && 
      (page.published === true || page.status === "published")
    );
  } catch (error) {
    console.error("Error fetching published pages:", error);
    return [];
  }
}

export function getNavPages(): Page[] {
  try {
    const pages = getPublishedPages();
    return pages
      .filter(page => page.showInNav !== false)
      .sort((a, b) => {
        // Sort by navOrder, then by title
        const orderA = a.navOrder || 999;
        const orderB = b.navOrder || 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.navTitle || a.title || '').localeCompare(b.navTitle || b.title || '');
      });
  } catch (error) {
    console.error("Error fetching nav pages:", error);
    return [];
  }
}

export function getChildPages(parentSlug: string): Page[] {
  try {
    const pages = getPublishedPages();
    if (!parentSlug || typeof parentSlug !== 'string') return [];
    
    return pages
      .filter(page => page.parentPage === parentSlug)
      .sort((a, b) => {
        // Sort by order, then by title
        const orderA = a.order || 999;
        const orderB = b.order || 999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.title || '').localeCompare(b.title || '');
      });
  } catch (error) {
    console.error(`Error fetching child pages for ${parentSlug}:`, error);
    return [];
  }
}

export function getPagesByType(pageType: string): Page[] {
  try {
    const pages = getPublishedPages();
    if (!pageType || typeof pageType !== 'string') return [];
    
    const normalizedType = pageType.toLowerCase().trim();
    
    return pages.filter(page => 
      page.pageType?.toLowerCase().trim() === normalizedType
    );
  } catch (error) {
    console.error(`Error fetching pages by type (${pageType}):`, error);
    return [];
  }
}

export function searchPages(query: string): Page[] {
  try {
    const pages = getPublishedPages();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return pages;
    
    return pages.filter(page => {
      // Search in title
      if (page.title?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in subtitle
      if (page.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in description
      if (page.description?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in excerpt
      if (page.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in tags
      if (page.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in category
      if (page.category?.toLowerCase().includes(normalizedQuery)) return true;
      
      return false;
    });
  } catch (error) {
    console.error(`Error searching pages (${query}):`, error);
    return [];
  }
}

export function getRecentPages(limit?: number): Page[] {
  try {
    const pages = getPublishedPages();
    
    // Sort by date (newest first), then by title for same dates
    const sorted = pages.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (dateB !== dateA) return dateB - dateA;
      
      // Same date, sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
    
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent pages:", error);
    return [];
  }
}

export function getAllPageCategories(): string[] {
  try {
    const pages = getAllPagesMeta();
    const categories = pages
      .map(page => page.category)
      .filter((category): category is string => 
        typeof category === "string" && category.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(categories)].sort();
  } catch (error) {
    console.error("Error fetching page categories:", error);
    return [];
  }
}

export function getAllPageTags(): string[] {
  try {
    const pages = getAllPagesMeta();
    const allTags = pages
      .flatMap(page => page.tags || [])
      .filter((tag): tag is string => typeof tag === "string");
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error fetching page tags:", error);
    return [];
  }
}

export function getAllPageAuthors(): string[] {
  try {
    const pages = getAllPagesMeta();
    const authors = pages
      .map(page => page.author)
      .filter((author): author is string => 
        typeof author === "string" && author.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(authors)].sort();
  } catch (error) {
    console.error("Error fetching page authors:", error);
    return [];
  }
}

export function getAllPageSlugs(): string[] {
  try {
    const pages = getAllPagesMeta();
    return pages
      .map(page => page.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch (error) {
    console.error("Error fetching page slugs:", error);
    return [];
  }
}

export function getHomePage(): PageWithContent | null {
  try {
    // Try common home page slugs
    const homeSlugs = ["", "/", "home", "index", "welcome"];
    
    for (const slug of homeSlugs) {
      const page = getPageBySlug(slug);
      if (page) {
        return page;
      }
    }
    
    // Try to find any page marked as home
    const pages = getAllPagesMeta();
    const homePage = pages.find(page => 
      page.pageType === "home" || 
      page.template === "home" ||
      page.tags?.includes("home")
    );
    
    if (homePage) {
      return getPageBySlug(homePage.slug);
    }
    
    // Return first published page as fallback
    const publishedPages = getPublishedPages();
    if (publishedPages.length > 0) {
      return getPageBySlug(publishedPages[0].slug);
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching home page:", error);
    return null;
  }
}

export function getPageStats(): {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  byYear: Record<string, number>;
} {
  try {
    const pages = getAllPagesMeta();
    
    const stats = {
      total: pages.length,
      published: pages.filter(p => p.published === true || p.status === "published").length,
      drafts: pages.filter(p => p.draft === true || p.status === "draft").length,
      featured: pages.filter(p => p.featured === true).length,
      byCategory: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
    };
    
    pages.forEach(page => {
      // Count by category
      if (page.category) {
        stats.byCategory[page.category] = (stats.byCategory[page.category] || 0) + 1;
      }
      
      // Count by type
      if (page.pageType) {
        stats.byType[page.pageType] = (stats.byType[page.pageType] || 0) + 1;
      }
      
      // Count by year
      if (page.date) {
        const year = new Date(page.date).getFullYear().toString();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error fetching page stats:", error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      featured: 0,
      byCategory: {},
      byType: {},
      byYear: {},
    };
  }
}

// ---------------------------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

const pagesData = {
  // Core functions
  getAllPagesMeta,
  getPageBySlug,
  getAllPages,
  
  // Filter functions
  getPagesByCategory,
  getPagesByTag,
  getFeaturedPages,
  getPublishedPages,
  getNavPages,
  getChildPages,
  getPagesByType,
  searchPages,
  getRecentPages,
  
  // Special pages
  getHomePage,
  
  // List functions
  getAllPageCategories,
  getAllPageTags,
  getAllPageAuthors,
  getAllPageSlugs,
  
  // Stats
  getPageStats,
  
  // Utility functions
  pageToContentMeta,
  pageToContentEntry,
};

export default pagesData;
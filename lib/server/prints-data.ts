// lib/server/prints-data.ts
// Prints under content/prints/* - COMPLETE ROBUST VERSION

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Print, ContentEntry, ContentMeta } from "@/types/index";

export type PrintWithContent = Print & {
  content: string;
};

// Extended MDX meta with print-specific fields
type PrintishMdxMeta = MdxMeta & Partial<Print> & {
  publishDate?: string;
  releaseDate?: string;
  [key: string]: any;
};

type PrintishMdxDocument = MdxDocument & {
  content: string;
} & Partial<Print>;

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
 * Safely convert print type field
 */
function safePrintType(
  value: unknown
): "digital" | "physical" | "limited" | "open" | undefined {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "digital") return "digital";
    if (lowerValue === "physical") return "physical";
    if (lowerValue === "limited") return "limited";
    if (lowerValue === "open") return "open";
  }
  return undefined;
}

/**
 * Safely convert print status field
 */
function safePrintStatus(
  value: unknown
): "available" | "sold-out" | "coming-soon" | "discontinued" | undefined {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "available") return "available";
    if (lowerValue === "sold-out") return "sold-out";
    if (lowerValue === "coming-soon") return "coming-soon";
    if (lowerValue === "discontinued") return "discontinued";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// MAIN CONVERSION FUNCTIONS
// ---------------------------------------------------------------------------

function fromMdxMeta(meta: MdxMeta): Print {
  const m = meta as PrintishMdxMeta;

  // Handle different date fields
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate);
  
  // Ensure required fields have defaults
  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled Print";
  
  if (!slug || !title) {
    console.warn(`Print metadata missing slug or title: ${slug} - ${title}`);
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

    // Print-specific fields
    printType: safePrintType(m.printType) || "digital",
    printStatus: safePrintStatus(m.printStatus) || "available",
    price: safeNumber(m.price),
    originalPrice: safeNumber(m.originalPrice),
    currency: safeString(m.currency) || "USD",
    dimensions: safeString(m.dimensions),
    paperType: safeString(m.paperType),
    printSize: safeString(m.printSize),
    editionSize: safeNumber(m.editionSize),
    editionNumber: safeNumber(m.editionNumber),
    signature: safeBoolean(m.signature),
    numbered: safeBoolean(m.numbered),
    certificate: safeBoolean(m.certificate),
    frameIncluded: safeBoolean(m.frameIncluded),
    inStock: safeBoolean(m.inStock) || true, // Default to true
    stockQuantity: safeNumber(m.stockQuantity),
    purchaseUrl: safeString(m.purchaseUrl),
    maxPurchaseQuantity: safeNumber(m.maxPurchaseQuantity),
    sale: safeBoolean(m.sale),
    saleEndDate: safeString(m.saleEndDate),
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
    type: safeString(m.type) || "print",

    // Preserve any additional fields
    ...Object.fromEntries(
      Object.entries(m)
        .filter(([key]) => ![
          'slug', 'title', 'description', 'excerpt', 'subtitle',
          'date', 'author', 'category', 'tags', 'featured', 'readTime',
          'coverImage', 'image', 'printType', 'printStatus', 'price',
          'originalPrice', 'currency', 'dimensions', 'paperType',
          'printSize', 'editionSize', 'editionNumber', 'signature',
          'numbered', 'certificate', 'frameIncluded', 'inStock',
          'stockQuantity', 'purchaseUrl', 'maxPurchaseQuantity', 'sale',
          'saleEndDate', 'lastModified', 'draft', 'published', 'status',
          'accessLevel', 'lockMessage', '_raw', '_id', 'url', 'type',
          'publishDate', 'releaseDate'
        ].includes(key))
        .map(([key, value]) => [key, value])
    ),
  };
}

function fromMdxDocument(doc: MdxDocument): PrintWithContent {
  const printDoc = doc as PrintishMdxDocument;
  const { content, body, ...rest } = printDoc;
  const meta = fromMdxMeta(rest);
  
  return { 
    ...meta, 
    content: typeof content === "string" ? content : "",
    body: body || undefined,
  };
}

export function printToContentMeta(print: Print): ContentMeta {
  const { content, body, ...meta } = print;
  return meta;
}

export function printToContentEntry(print: Print): ContentEntry {
  return {
    slug: print.slug,
    title: print.title,
    date: print.date,
    excerpt: print.excerpt,
    description: print.description,
    category: print.category,
    tags: print.tags,
    featured: print.featured,
    readTime: print.readTime,
    _raw: print._raw,
    ...Object.fromEntries(
      Object.entries(print)
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

export function getAllPrintsMeta(): Print[] {
  try {
    const metas = getMdxCollectionMeta("prints");
    if (!metas || !Array.isArray(metas)) {
      console.warn("No prints metadata found or metadata is not an array");
      return [];
    }
    
    const prints = metas.map((m) => fromMdxMeta(m));
    
    // Filter out invalid prints (missing required fields)
    const validPrints = prints.filter(print => {
      const isValid = print.slug && print.title;
      if (!isValid) {
        console.warn(`Invalid print skipped: ${print.slug || 'no-slug'} - ${print.title || 'no-title'}`);
      }
      return isValid;
    });
    
    console.log(`Found ${validPrints.length} valid prints out of ${metas.length} total`);
    return validPrints;
  } catch (error) {
    console.error("Error fetching all prints meta:", error);
    return [];
  }
}

export function getPrintBySlug(slug: string): PrintWithContent | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.error("getPrintBySlug called with invalid slug:", slug);
      return null;
    }
    
    const doc = getMdxDocumentBySlug("prints", slug);
    if (!doc) {
      console.warn(`No print found for slug: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`Error fetching print by slug (${slug}):`, error);
    return null;
  }
}

export function getAllPrints(): PrintWithContent[] {
  try {
    const metas = getAllPrintsMeta();
    if (metas.length === 0) return [];
    
    const printsWithContent: PrintWithContent[] = [];
    
    for (const meta of metas) {
      const print = getPrintBySlug(meta.slug);
      if (print) {
        printsWithContent.push(print);
      } else {
        console.warn(`Could not load content for print: ${meta.slug}`);
      }
    }
    
    return printsWithContent;
  } catch (error) {
    console.error("Error fetching all prints:", error);
    return [];
  }
}

export function getPrintsByCategory(category: string): Print[] {
  try {
    const prints = getAllPrintsMeta();
    if (!category || typeof category !== 'string') return [];
    
    const normalizedCategory = category.toLowerCase().trim();
    
    return prints.filter(print => {
      const printCategory = print.category?.toLowerCase().trim();
      return printCategory === normalizedCategory;
    });
  } catch (error) {
    console.error(`Error fetching prints by category (${category}):`, error);
    return [];
  }
}

export function getPrintsByTag(tag: string): Print[] {
  try {
    const prints = getAllPrintsMeta();
    if (!tag || typeof tag !== 'string') return [];
    
    const normalizedTag = tag.toLowerCase().trim();
    
    return prints.filter(print => {
      return print.tags?.some(t => t.toLowerCase().trim() === normalizedTag);
    });
  } catch (error) {
    console.error(`Error fetching prints by tag (${tag}):`, error);
    return [];
  }
}

export function getFeaturedPrints(): Print[] {
  try {
    const prints = getAllPrintsMeta();
    return prints.filter(print => print.featured === true);
  } catch (error) {
    console.error("Error fetching featured prints:", error);
    return [];
  }
}

export function getPublishedPrints(): Print[] {
  try {
    const prints = getAllPrintsMeta();
    return prints.filter(print => 
      print.draft !== true && 
      print.status !== "draft" && 
      (print.published === true || print.status === "published")
    );
  } catch (error) {
    console.error("Error fetching published prints:", error);
    return [];
  }
}

export function getAvailablePrints(): Print[] {
  try {
    return getAllPrintsMeta()
      .filter(p => 
        !p.draft && 
        (p.inStock === true || (p.stockQuantity !== undefined && p.stockQuantity > 0))
      );
  } catch (error) {
    console.error("[prints-data] Error getting available prints:", error);
    return [];
  }
}

export function getPrintsByType(printType: string): Print[] {
  try {
    const prints = getAllPrintsMeta();
    if (!printType || typeof printType !== 'string') return [];
    
    const normalizedType = printType.toLowerCase().trim();
    
    return prints.filter(print => 
      print.printType?.toLowerCase().trim() === normalizedType
    );
  } catch (error) {
    console.error(`Error fetching prints by type (${printType}):`, error);
    return [];
  }
}

export function getPrintsByStatus(status: string): Print[] {
  try {
    const prints = getAllPrintsMeta();
    if (!status || typeof status !== 'string') return [];
    
    const normalizedStatus = status.toLowerCase().trim();
    
    return prints.filter(print => 
      print.printStatus?.toLowerCase().trim() === normalizedStatus
    );
  } catch (error) {
    console.error(`Error fetching prints by status (${status}):`, error);
    return [];
  }
}

export function getPrintsOnSale(): Print[] {
  try {
    const prints = getAvailablePrints();
    return prints.filter(print => print.sale === true);
  } catch (error) {
    console.error("Error fetching prints on sale:", error);
    return [];
  }
}

export function searchPrints(query: string): Print[] {
  try {
    const prints = getAvailablePrints();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return prints;
    
    return prints.filter(print => {
      // Search in title
      if (print.title?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in subtitle
      if (print.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in description
      if (print.description?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in excerpt
      if (print.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in author
      if (print.author?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in tags
      if (print.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in category
      if (print.category?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in paper type
      if (print.paperType?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in dimensions
      if (print.dimensions?.toLowerCase().includes(normalizedQuery)) return true;
      
      return false;
    });
  } catch (error) {
    console.error(`Error searching prints (${query}):`, error);
    return [];
  }
}

export function getRecentPrints(limit?: number): Print[] {
  try {
    const prints = getAvailablePrints();
    
    // Sort by date (newest first), then by title for same dates
    const sorted = prints.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (dateB !== dateA) return dateB - dateA;
      
      // Same date, sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
    
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent prints:", error);
    return [];
  }
}

export function getLimitedEditionPrints(): Print[] {
  try {
    const prints = getAvailablePrints();
    return prints.filter(print => 
      print.printType === "limited" || 
      print.editionSize !== undefined
    );
  } catch (error) {
    console.error("Error fetching limited edition prints:", error);
    return [];
  }
}

export function getDigitalPrints(): Print[] {
  try {
    const prints = getAvailablePrints();
    return prints.filter(print => print.printType === "digital");
  } catch (error) {
    console.error("Error fetching digital prints:", error);
    return [];
  }
}

export function getPhysicalPrints(): Print[] {
  try {
    const prints = getAvailablePrints();
    return prints.filter(print => print.printType === "physical");
  } catch (error) {
    console.error("Error fetching physical prints:", error);
    return [];
  }
}

export function getAllPrintCategories(): string[] {
  try {
    const prints = getAllPrintsMeta();
    const categories = prints
      .map(print => print.category)
      .filter((category): category is string => 
        typeof category === "string" && category.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(categories)].sort();
  } catch (error) {
    console.error("Error fetching print categories:", error);
    return [];
  }
}

export function getAllPrintTags(): string[] {
  try {
    const prints = getAllPrintsMeta();
    const allTags = prints
      .flatMap(print => print.tags || [])
      .filter((tag): tag is string => typeof tag === "string");
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error fetching print tags:", error);
    return [];
  }
}

export function getAllPrintAuthors(): string[] {
  try {
    const prints = getAllPrintsMeta();
    const authors = prints
      .map(print => print.author)
      .filter((author): author is string => 
        typeof author === "string" && author.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(authors)].sort();
  } catch (error) {
    console.error("Error fetching print authors:", error);
    return [];
  }
}

export function getAllPrintSlugs(): string[] {
  try {
    const prints = getAllPrintsMeta();
    return prints
      .map(print => print.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch (error) {
    console.error("Error fetching print slugs:", error);
    return [];
  }
}

export function getPrintStats(): {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  available: number;
  digital: number;
  physical: number;
  limited: number;
  onSale: number;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
} {
  try {
    const prints = getAllPrintsMeta();
    const availablePrints = getAvailablePrints();
    
    const stats = {
      total: prints.length,
      published: prints.filter(p => p.published === true || p.status === "published").length,
      drafts: prints.filter(p => p.draft === true || p.status === "draft").length,
      featured: prints.filter(p => p.featured === true).length,
      available: availablePrints.length,
      digital: availablePrints.filter(p => p.printType === "digital").length,
      physical: availablePrints.filter(p => p.printType === "physical").length,
      limited: availablePrints.filter(p => p.printType === "limited").length,
      onSale: availablePrints.filter(p => p.sale === true).length,
      byCategory: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
    };
    
    prints.forEach(print => {
      // Count by category
      if (print.category) {
        stats.byCategory[print.category] = (stats.byCategory[print.category] || 0) + 1;
      }
      
      // Count by year
      if (print.date) {
        const year = new Date(print.date).getFullYear().toString();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error fetching print stats:", error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      featured: 0,
      available: 0,
      digital: 0,
      physical: 0,
      limited: 0,
      onSale: 0,
      byCategory: {},
      byYear: {},
    };
  }
}

// ---------------------------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

const printsData = {
  // Core functions
  getAllPrintsMeta,
  getPrintBySlug,
  getAllPrints,
  
  // Filter functions
  getPrintsByCategory,
  getPrintsByTag,
  getFeaturedPrints,
  getPublishedPrints,
  getAvailablePrints,
  getPrintsByType,
  getPrintsByStatus,
  getPrintsOnSale,
  searchPrints,
  getRecentPrints,
  getLimitedEditionPrints,
  getDigitalPrints,
  getPhysicalPrints,
  
  // List functions
  getAllPrintCategories,
  getAllPrintTags,
  getAllPrintAuthors,
  getAllPrintSlugs,
  
  // Stats
  getPrintStats,
  
  // Utility functions
  printToContentMeta,
  printToContentEntry,
};

export default printsData;


// lib/prints.ts - FIXED VERSION
// Prints data facade

import { getAllPrintsMeta } from "@/lib/server/prints-data";
import { safeSlice } from "@/lib/utils/safe";


// SAFE string helper
function safeString(value: any): string {
  if (typeof value === "string") return value;
  return String(value || "");
}

// SAFE lowercase helper
function safeLowerCase(value: any): string {
  return safeString(value).toLowerCase();
}

// Server types (what comes from prints-data)
type PrintFromServer = {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
  draft?: boolean;
  published?: boolean;
  status?: string;
  author?: string | { name: string; [key: string]: any } | null;
  category?: string;
  // Print-specific fields
  format?: string;
  dimensions?: string;
  price?: string | number; // Server accepts both string and number
  inStock?: boolean;
  [key: string]: any;
};

// Client-facing types
export interface PrintMeta {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  coverImage?: string;
  tags?: string[];
  featured?: boolean;
  draft?: boolean;
  published?: boolean;
  status?: string;
  author?: string | { name: string; [key: string]: any } | null;
  category?: string;
  // Print-specific fields
  format?: string;
  dimensions?: string;
  price?: number; // Client expects only number
  inStock?: boolean;
  [key: string]: any;
}

// Export PrintDocument type (used in pages/prints/[slug].tsx)
export type PrintDocument = PrintMeta & {
  content?: string;
  // Additional print-specific content fields
  details?: string;
  materials?: string[];
  images?: string[];
  sizeChart?: Record<string, any>;
  // For MDX content
  body?: {
    raw?: string;
  };
};

// Alias for backward compatibility
export type Print = PrintDocument;

export type PrintFieldKey = keyof PrintMeta;

/**
 * Transform server print to client print (convert price to number)
 */
function transformPrintForClient(print: PrintFromServer): PrintMeta {
  // Convert price to number if it's a string
  let price: number | undefined;
  if (print.price !== undefined && print.price !== null) {
    if (typeof print.price === 'string') {
      // Try to parse string price
      const parsed = parseFloat(print.price);
      price = isNaN(parsed) ? undefined : parsed;
    } else if (typeof print.price === 'number') {
      price = print.price;
    }
  }
  
  // SAFE transform all string fields
  return {
    ...print,
    slug: safeString(print.slug),
    title: safeString(print.title),
    excerpt: safeString(print.excerpt),
    description: safeString(print.description),
    date: safeString(print.date),
    category: safeString(print.category),
    format: safeString(print.format),
    dimensions: safeString(print.dimensions),
    tags: Array.isArray(print.tags) ? print.tags.map(t => safeString(t)) : [],
    price,
  };
}

/**
 * Get all prints (transformed for client)
 */
export function getAllPrints(): PrintMeta[] {
  try {
    const prints = getAllPrintsMeta();
    if (!Array.isArray(prints)) return [];
    
    return prints.map(print => transformPrintForClient(print as PrintFromServer));
  } catch {
    return [];
  }
}

/**
 * Get print by slug
 */
export function getPrintBySlug(slug: string): PrintDocument | null {
  try {
    const prints = getAllPrints();
    const printMeta = prints.find(p => p.slug === slug);
    
    if (!printMeta) return null;
    
    // Convert PrintMeta to PrintDocument (add content field)
    return {
      ...printMeta,
      content: '',
    };
  } catch {
    return null;
  }
}

/**
 * Get print slugs
 */
export function getAllPrintSlugs(): string[] {
  const prints = getAllPrints();
  return prints.map(p => safeString(p.slug)).filter(Boolean);
}

/**
 * Get public prints
 */
export function getPublicPrints(): PrintMeta[] {
  const prints = getAllPrints();
  return prints.filter(print => {
    const isDraft = print.draft === true;
    const isNotPublished = print.published === false;
    const isStatusDraft = print.status === 'draft';
    const isStatusArchived = print.status === 'archived';
    const isStatusPrivate = print.status === 'private';
    const isStatusScheduled = print.status === 'scheduled';
    
    return !(isDraft || isNotPublished || isStatusDraft || 
             isStatusArchived || isStatusPrivate || isStatusScheduled);
  });
}

/**
 * Get featured prints
 */
export function getFeaturedPrints(limit?: number): PrintMeta[] {
  const prints = getPublicPrints();
  const featured = prints.filter(p => p.featured === true);
  return limit ? safeSlice(featured, 0, limit) : featured;
}

/**
 * Get prints by category
 */
export function getPrintsByCategory(category: string): PrintMeta[] {
  const prints = getPublicPrints();
  return prints.filter(print => 
    safeString(print.category) === safeString(category)
  );
}

/**
 * Get prints by tag - FIXED
 */
export function getPrintsByTag(tag: string): PrintMeta[] {
  const prints = getPublicPrints();
  const normalizedTag = safeLowerCase(tag);
  
  return prints.filter(print => {
    if (!Array.isArray(print.tags)) return false;
    return print.tags.some(t => safeLowerCase(t) === normalizedTag);
  });
}

/**
 * Alias for backward compatibility with pages/prints/[slug].tsx
 * This function was likely referenced in your prints page
 */
export const getPrintDocumentBySlug = getPrintBySlug;

/**
 * Get prints sorted by date (newest first)
 */
export function getPrintsByDate(): PrintMeta[] {
  const prints = getPublicPrints();
  return prints.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Get in-stock prints
 */
export function getInStockPrints(): PrintMeta[] {
  const prints = getPublicPrints();
  return prints.filter(print => print.inStock !== false);
}

/**
 * Get prints by price range
 */
export function getPrintsByPriceRange(min?: number, max?: number): PrintMeta[] {
  const prints = getPublicPrints();
  return prints.filter(print => {
    const price = print.price || 0;
    if (min !== undefined && price < min) return false;
    if (max !== undefined && price > max) return false;
    return true;
  });
}

/**
 * Format price for display
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return 'Price not available';
  return `$${price.toFixed(2)}`;
}



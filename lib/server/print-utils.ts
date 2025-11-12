// lib/server/print-utils.ts

export type PrintDocument = {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  content?: string;
  type: 'download' | 'book' | 'strategy';
  source: 'downloads' | 'books'; // Track source for debugging
};

// Cache for performance
let printSlugsCache: string[] | null = null;
let printDocumentsCache: PrintDocument[] | null = null;

export function getPrintSlugs(): string[] {
  if (printSlugsCache) {
    return printSlugsCache;
  }

  try {
    const { getDownloadSlugs } = require("./downloads-data");
    const { getBookSlugs } = require("./books-data");
    
    const downloadSlugs = getDownloadSlugs();
    const bookSlugs = getBookSlugs();
    
    console.log(`📚 Raw slugs - Downloads: ${downloadSlugs.length}, Books: ${bookSlugs.length}`);
    
    // Normalize all slugs to strings and track sources
    const allSlugs: { slug: string; source: string }[] = [];
    
    // Process download slugs
    downloadSlugs.forEach((item: any) => {
      const slug = normalizeSlug(item, 'download');
      if (slug) {
        allSlugs.push({ slug, source: 'download' });
      }
    });
    
    // Process book slugs
    bookSlugs.forEach((item: any) => {
      const slug = normalizeSlug(item, 'book');
      if (slug) {
        allSlugs.push({ slug, source: 'book' });
      }
    });
    
    // Check for duplicates
    const slugCounts = new Map<string, number>();
    const duplicateSources = new Map<string, string[]>();
    
    allSlugs.forEach(({ slug, source }) => {
      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
      
      if (!duplicateSources.has(slug)) {
        duplicateSources.set(slug, []);
      }
      duplicateSources.get(slug)!.push(source);
    });
    
    // Log duplicates for debugging
    const duplicates = Array.from(slugCounts.entries())
      .filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.warn('⚠️ DUPLICATE SLUGS FOUND:');
      duplicates.forEach(([slug, count]) => {
        const sources = duplicateSources.get(slug) || [];
        console.warn(`  - "${slug}" (${count} times) from: ${sources.join(', ')}`);
      });
    }
    
    // Remove duplicates - keep first occurrence
    const uniqueSlugs: string[] = [];
    const seenSlugs = new Set<string>();
    
    allSlugs.forEach(({ slug }) => {
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        uniqueSlugs.push(slug);
      }
    });
    
    console.log(`✅ Final unique slugs: ${uniqueSlugs.length} (from ${allSlugs.length} total)`);
    
    printSlugsCache = uniqueSlugs;
    return uniqueSlugs;
    
  } catch (error) {
    console.error('❌ Error getting print slugs:', error);
    return [];
  }
}

// Helper function to normalize any input to a valid slug string
function normalizeSlug(item: any, source: string): string | null {
  if (typeof item === 'string') {
    return item.trim();
  }
  
  if (item && typeof item === 'object') {
    // Object with slug property
    if (item.slug && typeof item.slug === 'string') {
      return item.slug.trim();
    }
    // Object with id property
    if (item.id && typeof item.id === 'string') {
      return item.id.trim();
    }
    // Object with title property - generate slug
    if (item.title && typeof item.title === 'string') {
      return generateSlugFromTitle(item.title);
    }
    // Last resort: stringify with source prefix
    console.warn(`⚠️ Unusual object in ${source} slugs:`, item);
    return `${source}-${JSON.stringify(item).slice(0, 30).replace(/[^a-z0-9]/gi, '-')}`;
  }
  
  // Numbers, booleans, etc.
  if (item !== null && item !== undefined) {
    return String(item).trim();
  }
  
  console.warn(`⚠️ Invalid item in ${source} slugs:`, item);
  return null;
}

// Generate consistent slug from title
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
}

export function getPrintSlugsWithType(): Array<{ slug: string; type: string; source: string }> {
  const slugs = getPrintSlugs();
  
  // We need to determine the actual type for each slug
  return slugs.map(slug => {
    // Try to determine type by checking which data source has this slug
    try {
      const { getDownloadBySlug } = require("./downloads-data");
      const download = getDownloadBySlug(slug, [], true);
      if (download && download.title !== "Download Not Found") {
        return { slug, type: 'download', source: 'downloads' };
      }
    } catch (error) {
      // Continue to next check
    }
    
    try {
      const { getBookBySlug } = require("./books-data");
      const book = getBookBySlug(slug, [], true);
      if (book && book.title !== "Book Not Found") {
        return { slug, type: 'book', source: 'books' };
      }
    } catch (error) {
      // Continue
    }
    
    // Default fallback
    return { slug, type: 'download', source: 'unknown' };
  });
}

export function getPrintBySlug(slug: string): PrintDocument | null {
  if (!slug || typeof slug !== 'string') {
    console.warn('❌ Invalid slug provided to getPrintBySlug:', slug);
    return null;
  }

  try {
    // Try downloads first
    const { getDownloadBySlug } = require("./downloads-data");
    const download = getDownloadBySlug(slug, [], true);
    if (download && download.title !== "Download Not Found") {
      console.log(`✅ Found download: "${download.title}" (${slug})`);
      return {
        ...download,
        type: 'download' as const,
        description: download.excerpt || download.description || undefined,
        source: 'downloads' as const
      };
    }

    // Try books next
    const { getBookBySlug } = require("./books-data");
    const book = getBookBySlug(slug, [], true);
    if (book && book.title !== "Book Not Found") {
      console.log(`✅ Found book: "${book.title}" (${slug})`);
      return {
        ...book,
        type: 'book' as const,
        description: book.excerpt || book.description || undefined,
        source: 'books' as const
      };
    }

    console.warn(`❌ No document found for slug: "${slug}"`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error loading print document for slug "${slug}":`, error);
    return null;
  }
}

export function getPrintDocumentBySlug(slug: string, type?: string): PrintDocument | null {
  // If type is specified, we can optimize the lookup
  if (type === 'download') {
    try {
      const { getDownloadBySlug } = require("./downloads-data");
      const download = getDownloadBySlug(slug, [], true);
      if (download && download.title !== "Download Not Found") {
        return {
          ...download,
          type: 'download' as const,
          description: download.excerpt || download.description || undefined,
          source: 'downloads' as const
        };
      }
    } catch (error) {
      console.error('Error loading download:', error);
    }
    return null;
  }
  
  if (type === 'book') {
    try {
      const { getBookBySlug } = require("./books-data");
      const book = getBookBySlug(slug, [], true);
      if (book && book.title !== "Book Not Found") {
        return {
          ...book,
          type: 'book' as const,
          description: book.excerpt || book.description || undefined,
          source: 'books' as const
        };
      }
    } catch (error) {
      console.error('Error loading book:', error);
    }
    return null;
  }
  
  // No type specified, try both
  return getPrintBySlug(slug);
}

export function getAllPrintSlugs(): Array<{slug: string, type: string, source: string}> {
  return getPrintSlugsWithType();
}

export function getAllPrintDocuments(): PrintDocument[] {
  if (printDocumentsCache) {
    return printDocumentsCache;
  }

  const slugs = getPrintSlugs();
  const documents: PrintDocument[] = [];
  
  slugs.forEach(slug => {
    const doc = getPrintBySlug(slug);
    if (doc) {
      documents.push(doc);
    }
  });
  
  console.log(`📄 Loaded ${documents.length} print documents`);
  printDocumentsCache = documents;
  return documents;
}

// Debug function to analyze slug sources
export function debugSlugSources(): void {
  console.log('🔍 DEBUG: Slug Sources Analysis');
  
  try {
    const { getDownloadSlugs } = require("./downloads-data");
    const { getBookSlugs } = require("./books-data");
    
    const downloadSlugs = getDownloadSlugs();
    const bookSlugs = getBookSlugs();
    
    console.log('Downloads raw:', downloadSlugs);
    console.log('Books raw:', bookSlugs);
    
    const normalizedDownloads = downloadSlugs.map((item: any) => normalizeSlug(item, 'download'));
    const normalizedBooks = bookSlugs.map((item: any) => normalizeSlug(item, 'book'));
    
    console.log('Downloads normalized:', normalizedDownloads);
    console.log('Books normalized:', normalizedBooks);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Clear cache (useful for development)
export function clearPrintCache(): void {
  printSlugsCache = null;
  printDocumentsCache = null;
  console.log('🧹 Print cache cleared');
}
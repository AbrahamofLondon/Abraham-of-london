// lib/server/books-data.ts - COMPLETE FIXED VERSION
import { allBooks } from "@/lib/contentlayer";
import type { BookDocument } from "@/lib/contentlayer";

// Define a complete Book type that includes all properties we need
export type Book = BookDocument & {
  // Properties from Contentlayer config that aren't in BookDocument interface
  readTime?: string;
  published?: boolean;
  archived?: boolean;
  available?: boolean;
  toc?: any[];
  language?: string;
  pages?: number;
  weight?: number;
  dimensions?: string;
  edition?: string;
  image?: string;
  cover?: string;
  
  // Computed properties
  normalizedReadTime: string;
  normalizedCoverImage: string;
};

// Helper to check if book is draft
function isDraft(book: BookDocument & { published?: boolean }): boolean {
  // Handle boolean or string "true"
  if (book.draft === true || String(book.draft).toLowerCase() === "true") return true;
  
  // Check published property if it exists
  const bookAny = book as any;
  if ('published' in bookAny && bookAny.published === false) return true;
  
  // Check status field
  if (book.status === 'draft') return true;
  if (book.status === 'archived') return false;
  
  return false;
}

// Helper to normalize slug
function normalizeSlug(slug: string): string {
  return String(slug || "").trim().toLowerCase();
}

// Helper to get book reading time
function getBookReadTime(book: BookDocument & { readTime?: string }): string {
  const bookAny = book as any;
  
  // Try readTime first
  if (bookAny.readTime && typeof bookAny.readTime === 'string') {
    return bookAny.readTime;
  }
  
  // Try readingTime (might be in the data)
  if (bookAny.readingTime && typeof bookAny.readingTime === 'string') {
    return bookAny.readingTime;
  }
  
  // Calculate from body content
  if (book.body?.raw) {
    const wordCount = book.body.raw.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    return `${readingTime} min`;
  }
  
  return "5 min";
}

// Helper to get book cover image
function getBookCoverImage(book: BookDocument & { image?: string; cover?: string }): string {
  const bookAny = book as any;
  
  // Check all possible image properties
  if (book.coverImage) return book.coverImage;
  if (bookAny.image) return bookAny.image;
  if (bookAny.cover) return bookAny.cover;
  if (bookAny.coverImage) return bookAny.coverImage;
  
  return "/assets/images/writing-desk.webp";
}

// Helper to convert BookDocument to our enhanced Book type
function enhanceBook(book: BookDocument): Book {
  const bookAny = book as any;
  
  return {
    ...book,
    // Add computed properties
    normalizedReadTime: getBookReadTime(book),
    normalizedCoverImage: getBookCoverImage(book),
    
    // Ensure optional properties exist with defaults when needed
    readTime: bookAny.readTime || bookAny.readingTime || undefined,
    published: bookAny.published ?? (book.status === 'published'),
    archived: bookAny.archived ?? (book.status === 'archived') ?? false,
    available: bookAny.available ?? true,
    toc: bookAny.toc ?? [],
    language: bookAny.language ?? 'en',
    pages: bookAny.pages ?? 0,
    weight: bookAny.weight ?? 0,
    dimensions: bookAny.dimensions ?? '',
    edition: bookAny.edition ?? '',
    image: bookAny.image,
    cover: bookAny.cover,
  };
}

/**
 * Get all books metadata (non-draft only)
 */
export function getAllBooksMeta(): Book[] {
  try {
    const books = (allBooks || []).filter(book => !isDraft(book));
    return books.map(enhanceBook);
  } catch (error) {
    console.error("Error fetching all books meta:", error);
    return [];
  }
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): Book | null {
  try {
    if (!slug || typeof slug !== 'string') {
      return null;
    }
    
    const normalizedSlug = normalizeSlug(slug);
    
    const book = (allBooks || []).find(b => {
      if (isDraft(b)) return false;
      
      const bookSlug = b.slug || b._raw?.flattenedPath?.split('/').pop() || '';
      return normalizeSlug(bookSlug) === normalizedSlug;
    });
    
    if (!book) return null;
    
    return enhanceBook(book);
  } catch (error) {
    console.error(`Error fetching book by slug (${slug}):`, error);
    return null;
  }
}

/**
 * Get all books with content
 */
export function getAllBooks(): Book[] {
  try {
    return getAllBooksMeta();
  } catch (error) {
    console.error("Error fetching all books:", error);
    return [];
  }
}

/**
 * Get all book slugs
 */
export function getBookSlugs(): string[] {
  try {
    const books = getAllBooksMeta();
    return books.map(book => book.slug || book._raw?.flattenedPath?.split('/').pop() || '');
  } catch (error) {
    console.error("Error fetching book slugs:", error);
    return [];
  }
}

/**
 * Get featured books
 */
export function getFeaturedBooks(count?: number): Book[] {
  try {
    const books = getAllBooksMeta();
    const featured = books.filter(book => book.featured === true);
    
    if (count && count > 0) {
      return featured.slice(0, count);
    }
    
    return featured;
  } catch (error) {
    console.error("Error fetching featured books:", error);
    return [];
  }
}

/**
 * Get recent books
 */
export function getRecentBooks(count?: number): Book[] {
  try {
    const books = getAllBooksMeta();
    
    // Sort by date (most recent first)
    const sorted = [...books].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    if (count && count > 0) {
      return sorted.slice(0, count);
    }
    
    return sorted;
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

const booksData = {
  // Core functions
  getAllBooksMeta,
  getBookBySlug,
  getAllBooks,
  getBookSlugs,
  
  // Filter functions
  getFeaturedBooks,
  getRecentBooks,
};

export default booksData;
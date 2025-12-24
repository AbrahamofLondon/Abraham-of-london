// lib/server/books-data.ts - SIMPLIFIED VERSION FOR STATIC GENERATION
// This version works with ContentLayer during build time

import { allBooks } from "@/lib/contentlayer";
import type { Book as ContentlayerBook } from "@/lib/contentlayer";

export type Book = ContentlayerBook;
export type BookWithContent = Book;

// Helper to check if book is draft
function isDraft(book: any): boolean {
  if (book.draft === true || book.draft === "true") return true;
  if (book.published === false) return true;
  if (book.status === 'draft') return true;
  return false;
}

// Helper to normalize slug
function normalizeSlug(slug: string): string {
  return String(slug || "").trim().toLowerCase();
}

/**
 * Get all books metadata (non-draft only)
 */
export function getAllBooksMeta(): Book[] {
  try {
    const books = (allBooks || []).filter(book => !isDraft(book));
    
    // Ensure required fields
    return books.map(book => ({
      ...book,
      slug: book.slug || book._raw?.flattenedPath?.split('/').pop() || '',
      title: book.title || "Untitled",
    }));
  } catch (error) {
    console.error("Error fetching all books meta:", error);
    return [];
  }
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): BookWithContent | null {
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
    
    return book || null;
  } catch (error) {
    console.error(`Error fetching book by slug (${slug}):`, error);
    return null;
  }
}

/**
 * Get all books with content
 */
export function getAllBooks(): BookWithContent[] {
  try {
    const books = getAllBooksMeta();
    return books;
  } catch (error) {
    console.error("Error fetching all books:", error);
    return [];
  }
}

/**
 * Get book slugs for static generation
 */
export function getBookSlugs(): string[] {
  try {
    const books = getAllBooksMeta();
    return books
      .map(book => book.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch (error) {
    console.error("Error fetching book slugs:", error);
    return [];
  }
}

/**
 * Get featured books
 */
export function getFeaturedBooks(): Book[] {
  try {
    const books = getAllBooksMeta();
    return books.filter(book => book.featured === true);
  } catch (error) {
    console.error("Error fetching featured books:", error);
    return [];
  }
}

/**
 * Get recent books
 */
export function getRecentBooks(limit?: number): Book[] {
  try {
    const books = getAllBooksMeta();
    
    // Sort by date (newest first)
    const sorted = [...books].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}

/**
 * Get books by category
 */
export function getBooksByCategory(category: string): Book[] {
  try {
    const books = getAllBooksMeta();
    const normalizedCategory = category.toLowerCase().trim();
    
    return books.filter(book => 
      book.category?.toLowerCase().trim() === normalizedCategory
    );
  } catch (error) {
    console.error(`Error fetching books by category (${category}):`, error);
    return [];
  }
}

/**
 * Search books
 */
export function searchBooks(query: string): Book[] {
  try {
    const books = getAllBooksMeta();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return books;
    
    return books.filter(book => {
      // Search in various fields
      if (book.title?.toLowerCase().includes(normalizedQuery)) return true;
      if (book.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      if (book.description?.toLowerCase().includes(normalizedQuery)) return true;
      if (book.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      if (book.author?.toLowerCase().includes(normalizedQuery)) return true;
      if (book.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      if (book.category?.toLowerCase().includes(normalizedQuery)) return true;
      if (book.series?.toLowerCase().includes(normalizedQuery)) return true;
      return false;
    });
  } catch (error) {
    console.error(`Error searching books (${query}):`, error);
    return [];
  }
}

/**
 * Get book statistics
 */
export function getBookStats() {
  try {
    const books = allBooks || [];
    
    return {
      total: books.length,
      published: books.filter(b => !isDraft(b)).length,
      drafts: books.filter(isDraft).length,
      featured: books.filter(b => b.featured && !isDraft(b)).length,
      byFormat: {},
      byCategory: {},
      byYear: {},
    };
  } catch (error) {
    console.error("Error fetching book stats:", error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      featured: 0,
      byFormat: {},
      byCategory: {},
      byYear: {},
    };
  }
}

// ---------------------------------------------------------------------------
// COMPATIBILITY FUNCTIONS FOR YOUR EXISTING CODE
// ---------------------------------------------------------------------------

/**
 * Convert Book to ContentMeta for listings (if needed)
 */
export function bookToContentMeta(book: Book): any {
  const { content, body, ...meta } = book as any;
  return meta;
}

/**
 * Convert Book to ContentEntry for backward compatibility
 */
export function bookToContentEntry(book: Book): any {
  return {
    slug: book.slug,
    title: book.title,
    date: book.date,
    excerpt: book.excerpt,
    description: book.description,
    category: book.category,
    tags: book.tags,
    featured: book.featured,
    readTime: book.readTime,
    _raw: book._raw,
    ...Object.fromEntries(
      Object.entries(book)
        .filter(([key]) => ![
          'slug', 'title', 'date', 'excerpt', 'description', 'category',
          'tags', 'featured', 'readTime', '_raw', 'content', 'body'
        ].includes(key))
    ),
  };
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
  getBooksByCategory,
  searchBooks,
  
  // Stats
  getBookStats,
  
  // Utility functions
  bookToContentMeta,
  bookToContentEntry,
};

export default booksData;
// lib/books.ts - FIXED VERSION
// Direct ContentLayer access without server-side dependencies

import { allBooks } from "contentlayer/generated";
import type { Book as ContentlayerBook } from "contentlayer/generated";

export type Book = ContentlayerBook;
export type BookWithContent = Book;

// SAFE string helper
function safeString(value: any): string {
  if (typeof value === "string") return value;
  return String(value || "");
}

// SAFE lowercase helper
function safeToLowerCase(value: any): string {
  return safeString(value).toLowerCase();
}

// Helper to check if book is draft
function isDraft(book: any): boolean {
  if (book.draft === true || book.draft === "true") return true;
  if (book.published === false) return true;
  if (book.status === 'draft') return true;
  return false;
}

// Helper to normalize slug
function normalizeSlug(slug: string): string {
  return safeString(slug).trim().toLowerCase();
}

/**
 * Get all books metadata (non-draft only)
 */
export function getAllBooksMeta(): Book[] {
  try {
    return (allBooks || []).filter(book => !isDraft(book));
  } catch (error) {
    console.error("Error in getAllBooksMeta:", error);
    return [];
  }
}

/**
 * Get all books
 */
export function getAllBooks(): BookWithContent[] {
  return getAllBooksMeta();
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): BookWithContent | null {
  try {
    if (!slug) return null;
    
    const normalizedSlug = normalizeSlug(slug);
    
    const book = (allBooks || []).find(b => {
      if (isDraft(b)) return false;
      
      const bookSlug = b.slug || b._raw?.flattenedPath?.split('/').pop() || '';
      return normalizeSlug(bookSlug) === normalizedSlug;
    });
    
    return book || null;
  } catch (error) {
    console.error(`Error in getBookBySlug(${slug}):`, error);
    return null;
  }
}

/**
 * Get book slugs
 */
export function getBookSlugs(): string[] {
  const books = getAllBooksMeta();
  return books
    .map(b => safeString(b.slug || b._raw?.flattenedPath?.split('/').pop()))
    .filter(slug => slug && slug !== "index");
}

/**
 * Get public books (filter out drafts)
 */
export function getPublicBooks(): Book[] {
  const books = getAllBooksMeta();
  return books.filter(book => {
    const isDraftBook = book.draft === true;
    const isNotPublished = book.published === false;
    const isStatusDraft = book.status === 'draft';
    return !(isDraftBook || isNotPublished || isStatusDraft);
  });
}

/**
 * Get featured books
 */
export function getFeaturedBooks(limit?: number): Book[] {
  const books = getPublicBooks();
  const featured = books.filter(b => b.featured === true);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get recent books
 */
export function getRecentBooks(limit?: number): Book[] {
  const books = getPublicBooks();
  
  // Sort by date (newest first)
  const sorted = [...books].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * SAFE search books - FIXED
 */
export function searchBooks(query: string): Book[] {
  const books = getPublicBooks();
  
  if (!query?.trim()) {
    return books;
  }
  
  const searchTerm = safeToLowerCase(query);
  
  return books.filter(book => {
    // SAFE: Use safeToLowerCase for all fields
    if (safeToLowerCase(book.title).includes(searchTerm)) return true;
    if (safeToLowerCase(book.subtitle).includes(searchTerm)) return true;
    if (safeToLowerCase(book.description).includes(searchTerm)) return true;
    if (safeToLowerCase(book.excerpt).includes(searchTerm)) return true;
    if (safeToLowerCase(book.author).includes(searchTerm)) return true;
    
    // SAFE: Search in tags
    if (Array.isArray(book.tags)) {
      if (book.tags.some(tag => safeToLowerCase(tag).includes(searchTerm))) return true;
    }
    
    // SAFE: Search in category
    if (safeToLowerCase(book.category).includes(searchTerm)) return true;
    
    // SAFE: Search in series
    if (safeToLowerCase(book.series).includes(searchTerm)) return true;
    
    return false;
  });
}

/**
 * Get books by category
 */
export function getBooksByCategory(category: string): Book[] {
  const books = getPublicBooks();
  
  if (!category) {
    return books;
  }
  
  const normalizedCategory = safeToLowerCase(category);
  
  return books.filter(book => 
    safeToLowerCase(book.category) === normalizedCategory
  );
}

/**
 * Get books by tag
 */
export function getBooksByTag(tag: string): Book[] {
  const books = getPublicBooks();
  
  if (!tag) {
    return books;
  }
  
  const normalizedTag = safeToLowerCase(tag);
  
  return books.filter(book => {
    if (!Array.isArray(book.tags)) return false;
    return book.tags.some(t => safeToLowerCase(t) === normalizedTag);
  });
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const books = getPublicBooks();
  const categories = books
    .map(book => safeString(book.category))
    .filter(category => category.trim().length > 0);
  
  // Remove duplicates and sort
  return [...new Set(categories)].sort();
}

/**
 * Get all tags
 */
export function getAllTags(): string[] {
  const books = getPublicBooks();
  const allTags = books
    .flatMap(book => Array.isArray(book.tags) ? book.tags : [])
    .map(tag => safeString(tag));
  
  // Remove duplicates and sort
  return [...new Set(allTags)].sort();
}

/**
 * Get all authors
 */
export function getAllAuthors(): string[] {
  const books = getPublicBooks();
  const authors = books
    .map(book => safeString(book.author))
    .filter(author => author.trim().length > 0);
  
  // Remove duplicates and sort
  return [...new Set(authors)].sort();
}

/**
 * Get book statistics
 */
export function getBookStats() {
  const books = getAllBooksMeta();
  const published = getPublicBooks();
  
  const stats = {
    total: books.length,
    published: published.length,
    drafts: books.length - published.length,
    featured: published.filter(b => b.featured === true).length,
    byFormat: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    byYear: {} as Record<string, number>,
  };
  
  published.forEach(book => {
    // Count by format
    const format = safeString(book.format);
    if (format) {
      stats.byFormat[format] = (stats.byFormat[format] || 0) + 1;
    }
    
    // Count by category
    const category = safeString(book.category);
    if (category) {
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
    
    // Count by year
    if (book.date) {
      const year = new Date(book.date).getFullYear().toString();
      if (year !== "NaN") {
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
    }
  });
  
  return stats;
}

// Default export with all functions
const books = {
  // Core functions
  getAllBooksMeta,
  getAllBooks,
  getBookBySlug,
  getBookSlugs,
  
  // Filter functions
  getPublicBooks,
  getFeaturedBooks,
  getRecentBooks,
  searchBooks,
  getBooksByCategory,
  getBooksByTag,
  
  // List functions
  getAllCategories,
  getAllTags,
  getAllAuthors,
  
  // Stats
  getBookStats,
};

export default books;
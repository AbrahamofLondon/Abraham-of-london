// lib/books.ts
// Robust books data facade with book-specific utilities

import booksData from "@/lib/server/books-data";
import type { Book as ServerBook, BookWithContent as ServerBookWithContent } from "@/lib/server/books-data";

// Re-export the types with their original names
export type Book = ServerBook;
export type BookWithContent = ServerBookWithContent;

// Type definitions
export type BookMeta = Book;
export type BookFieldKey = keyof BookMeta;

// Helper to get server-side function
function getBookBySlugServer(slug: string): BookWithContent | null {
  try {
    return booksData.getBookBySlug(slug);
  } catch {
    return null;
  }
}

/**
 * Get all books metadata
 */
export function getAllBooksMeta(): BookMeta[] {
  try {
    const books = booksData.getAllBooksMeta();
    return Array.isArray(books) ? books : [];
  } catch {
    return [];
  }
}

/**
 * Get all books (including content)
 */
export function getAllBooks(): BookWithContent[] {
  try {
    const books = booksData.getAllBooks();
    return Array.isArray(books) ? books : [];
  } catch {
    return [];
  }
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): BookWithContent | null {
  return getBookBySlugServer(slug);
}

/**
 * Get book slugs
 */
export function getBookSlugs(): string[] {
  const books = getAllBooksMeta();
  return books.map(b => b.slug).filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
}

/**
 * Get public books (filter out drafts)
 */
export function getPublicBooks(): BookMeta[] {
  const books = getAllBooksMeta();
  return books.filter(book => {
    const isDraft = book.draft === true;
    const isNotPublished = book.published === false;
    const isStatusDraft = book.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get featured books
 */
export function getFeaturedBooks(limit?: number): BookMeta[] {
  const books = getPublicBooks();
  const featured = books.filter(b => b.featured === true);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get recent books
 */
export function getRecentBooks(limit?: number): BookMeta[] {
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
 * Search books
 */
export function searchBooks(query: string): BookMeta[] {
  const books = getPublicBooks();
  
  if (!query?.trim()) {
    return books;
  }
  
  const searchTerm = query.toLowerCase().trim();
  
  return books.filter(book => {
    // Search in various fields
    if (book.title?.toLowerCase().includes(searchTerm)) return true;
    if (book.subtitle?.toLowerCase().includes(searchTerm)) return true;
    if (book.description?.toLowerCase().includes(searchTerm)) return true;
    if (book.excerpt?.toLowerCase().includes(searchTerm)) return true;
    if (book.author?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in tags
    if (book.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) return true;
    
    // Search in category
    if (book.category?.toLowerCase().includes(searchTerm)) return true;
    
    // Search in series
    if (book.series?.toLowerCase().includes(searchTerm)) return true;
    
    return false;
  });
}

/**
 * Get books by category
 */
export function getBooksByCategory(category: string): BookMeta[] {
  const books = getPublicBooks();
  
  if (!category) {
    return books;
  }
  
  const normalizedCategory = category.toLowerCase().trim();
  
  return books.filter(book => 
    book.category?.toLowerCase().trim() === normalizedCategory
  );
}

/**
 * Get books by tag
 */
export function getBooksByTag(tag: string): BookMeta[] {
  const books = getPublicBooks();
  
  if (!tag) {
    return books;
  }
  
  const normalizedTag = tag.toLowerCase().trim();
  
  return books.filter(book => 
    book.tags?.some(t => t.toLowerCase().trim() === normalizedTag)
  );
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const books = getPublicBooks();
  const categories = books
    .map(book => book.category)
    .filter((category): category is string => 
      typeof category === "string" && category.trim().length > 0
    );
  
  // Remove duplicates and sort
  return [...new Set(categories)].sort();
}

/**
 * Get all tags
 */
export function getAllTags(): string[] {
  const books = getPublicBooks();
  const allTags = books
    .flatMap(book => book.tags || [])
    .filter((tag): tag is string => typeof tag === "string");
  
  // Remove duplicates and sort
  return [...new Set(allTags)].sort();
}

/**
 * Get all authors
 */
export function getAllAuthors(): string[] {
  const books = getPublicBooks();
  const authors = books
    .map(book => book.author)
    .filter((author): author is string => 
      typeof author === "string" && author.trim().length > 0
    );
  
  // Remove duplicates and sort
  return [...new Set(authors)].sort();
}

/**
 * Get book statistics
 */
export function getBookStats() {
  try {
    return booksData.getBookStats();
  } catch {
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
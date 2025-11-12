// lib/books.ts - PRODUCTION SAFE VERSION
import allBooks from "contentlayer/generated";

// Type-safe fallback for Book type
interface SafeBook {
  _id: string;
  title: string;
  slug: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  url: string;
  description?: string;
  coverImage?: string;
  [key: string]: any;
}

/**
 * Safely get all books with comprehensive error handling
 */
export function getAllBooks(): SafeBook[] {
  try {
    if (typeof allBooks === 'undefined') {
      console.warn('⚠️ ContentLayer books data is undefined - returning empty array');
      return [];
    }

    if (!Array.isArray(allBooks)) {
      console.error('❌ ContentLayer books is not an array:', typeof allBooks);
      return [];
    }

    const safeBooks = allBooks.filter((book): book is SafeBook => {
      const isValid = book && 
                     typeof book === 'object' &&
                     typeof book._id === 'string' &&
                     typeof book.title === 'string' &&
                     typeof book.slug === 'string' &&
                     typeof book.date === 'string' &&
                     typeof book.author === 'string' &&
                     typeof book.readTime === 'string' &&
                     typeof book.category === 'string' &&
                     typeof book.url === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid book:', book);
      }

      return isValid;
    });

    if (safeBooks.length !== allBooks.length) {
      console.warn(`🔄 Filtered ${allBooks.length - safeBooks.length} invalid books`);
    }

    return safeBooks;

  } catch (error) {
    console.error('💥 Critical error in getAllBooks:', error);
    return [];
  }
}

/**
 * Safely get a book by slug with fallbacks
 */
export function getBookBySlug(slug: string): SafeBook | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to getBookBySlug:', slug);
      return null;
    }

    const books = getAllBooks();
    const book = books.find(book => book.slug === slug);

    if (!book) {
      console.warn(`🔍 Book not found for slug: "${slug}"`);
      return null;
    }

    return book;

  } catch (error) {
    console.error(`💥 Error finding book with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Get books by category with validation
 */
export function getBooksByCategory(category: string): SafeBook[] {
  try {
    if (!category || typeof category !== 'string') {
      console.warn('⚠️ Invalid category provided to getBooksByCategory:', category);
      return [];
    }

    return getAllBooks().filter(book => 
      book.category?.toLowerCase() === category.toLowerCase()
    );

  } catch (error) {
    console.error(`💥 Error getting books by category "${category}":`, error);
    return [];
  }
}

// Export types for use in other files
export type { SafeBook as Book };
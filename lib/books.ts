// lib/books.ts
// Robust books data facade with book-specific utilities

import { getAllBooksMeta, getBookBySlug as getBookBySlugServer } from "@/lib/server/books-data";

// Type definitions
export type Book = any;
export type BookMeta = Book;
export type BookFieldKey = keyof BookMeta;

/**
 * Get all books
 */
export function getAllBooks(): BookMeta[] {
  try {
    const books = getAllBooksMeta();
    return Array.isArray(books) ? books : [];
  } catch {
    return [];
  }
}

/**
 * Get book by slug
 */
export function getBookBySlug(slug: string): Book | null {
  try {
    return getBookBySlugServer(slug);
  } catch {
    return null;
  }
}

/**
 * Get book slugs
 */
export function getBookSlugs(): string[] {
  const books = getAllBooks();
  return books.map(b => b.slug).filter(Boolean);
}

/**
 * Get public books
 */
export function getPublicBooks(): BookMeta[] {
  const books = getAllBooks();
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

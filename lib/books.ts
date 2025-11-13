// lib/books.ts

export interface Book {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  date?: string;
  [key: string]: unknown;
}

// If Contentlayer is available, you can wire it here.
// For now, keep a simple in-memory list to satisfy types.
const books: Book[] = [];

export function getAllBooks(): Book[] {
  return books;
}

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}
// lib/server/books-data.ts

// Server-only safety guard (defensive)
if (typeof window !== "undefined") {
  throw new Error("lib/server/books-data.ts must not be imported on the client");
}

import type { BookMeta, BookFilters, BookListResponse } from "@/types/book";

// ---------------------------------------------------------------------------
// MOCK DATA
// ---------------------------------------------------------------------------
// Replace `mockBooks` later with a real data source (filesystem, CMS, DB, etc.)
const mockBooks: BookMeta[] = [
  {
    slug: "sample-book",
    title: "Sample Book Title",
    author: "Sample Author",
    publisher: "Sample Publisher",
    publishedDate: "2024-01-01",
    isbn: "978-0-00-000000-0",
    description: "This is a sample book description that provides an overview.",
    summary: "A brief summary of the sample book content and key insights.",
    coverImage: "/images/books/sample-cover.jpg",
    heroImage: "/images/books/sample-hero.jpg",
    tags: ["technology", "programming", "web-development"],
    category: "Technology",
    content:
      "# Sample Book Content\n\nThis is sample book content in MDX format.\n\n## Chapter 1: Introduction\n\nWelcome to this sample book.\n\n## Key Features\n\n- Feature one\n- Feature two\n- Feature three",
    excerpt: "A short excerpt from the book that highlights key concepts.",
    status: "published",
    featured: true,
    rating: 4.5,
    pages: 300,
    language: "English",
    format: "paperback",
    purchaseLinks: [
      {
        platform: "Amazon",
        url: "https://amazon.com/sample-book",
        price: "$29.99",
      },
      {
        platform: "Bookshop",
        url: "https://bookshop.org/sample-book",
        price: "$27.99",
      },
    ],
    resources: {
      downloads: [{ href: "/downloads/sample-chapter", title: "Sample Chapter PDF" }],
      reads: [{ href: "/blog/sample-review", title: "Book Review" }],
    },
  },
  {
    slug: "another-book",
    title: "Another Great Book",
    author: "Another Author",
    publisher: "Tech Press",
    publishedDate: "2023-06-15",
    description: "Another excellent book on modern web technologies.",
    tags: ["javascript", "react", "nextjs"],
    category: "Web Development",
    status: "published",
    featured: false,
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Normalise slug input (strip leading/trailing slashes).
 */
function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, "");
}

/**
 * Ensure we never return drafts.
 */
function isVisibleBook(book: BookMeta): boolean {
  return (book as any)?.status !== "draft";
}

// ---------------------------------------------------------------------------
// EXPORTS
// ---------------------------------------------------------------------------

/**
 * Get all book slugs for static generation.
 */
export function getBookSlugs(): string[] {
  return mockBooks.filter(isVisibleBook).map((book) => normalizeSlug(book.slug));
}

/**
 * Get a single book by slug with optional field filtering.
 */
export function getBookBySlug(slug: string, fields: string[] = []): BookMeta | null {
  if (!slug) return null;

  const normalized = normalizeSlug(slug);
  const book = mockBooks.find(
    (b) => isVisibleBook(b) && normalizeSlug(b.slug) === normalized
  );

  if (!book) return null;

  // If specific fields are requested, filter the book object
  if (fields.length > 0) {
    const filteredBook: Partial<BookMeta> & { slug: string } = { slug: book.slug };
    for (const field of fields) {
      if (field in book) {
        (filteredBook as any)[field] = (book as any)[field];
      }
    }
    return filteredBook as BookMeta;
  }

  return book;
}

/**
 * Get multiple books by slugs.
 */
export function getBooksBySlugs(slugs: string[], fields: string[] = []): BookMeta[] {
  if (!Array.isArray(slugs) || slugs.length === 0) return [];
  return slugs
    .map((slug) => getBookBySlug(slug, fields))
    .filter((book): book is BookMeta => book !== null);
}

/**
 * Get all books with optional filtering and pagination.
 */
export function getAllBooks(
  filters: BookFilters = {},
  limit?: number,
  offset = 0
): BookListResponse {
  let filteredBooks = mockBooks.filter(isVisibleBook);

  // Apply filters
  if (filters.category) {
    filteredBooks = filteredBooks.filter((book) => book.category === filters.category);
  }

  if (filters.author) {
    filteredBooks = filteredBooks.filter((book) => book.author === filters.author);
  }

  if (filters.featured !== undefined) {
    filteredBooks = filteredBooks.filter((book) => book.featured === filters.featured);
  }

  if (filters.tags && filters.tags.length > 0) {
    filteredBooks = filteredBooks.filter(
      (book) =>
        book.tags &&
        filters.tags!.some((tag) => book.tags!.includes(tag))
    );
  }

  // Sort by featured first, then by publication date (newest first)
  filteredBooks.sort((a, b) => {
    const aFeatured = !!a.featured;
    const bFeatured = !!b.featured;
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;

    const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    return dateB - dateA;
  });

  // Apply pagination
  const total = filteredBooks.length;
  const safeLimit = limit && limit > 0 ? limit : total;
  const startIndex = offset < 0 ? 0 : offset;
  const endIndex = Math.min(startIndex + safeLimit, total);
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return {
    books: paginatedBooks,
    total,
    page: Math.floor(startIndex / safeLimit) + 1,
    limit: safeLimit,
    hasMore,
  };
}

/**
 * Get books by category.
 */
export function getBooksByCategory(category: string, limit?: number): BookMeta[] {
  const result = getAllBooks({ category }, limit);
  return result.books;
}

/**
 * Get featured books.
 */
export function getFeaturedBooks(limit?: number): BookMeta[] {
  const result = getAllBooks({ featured: true }, limit);
  return result.books;
}

/**
 * Get all available categories.
 */
export function getBookCategories(): string[] {
  const categories = mockBooks
    .filter(isVisibleBook)
    .map((book) => book.category)
    .filter((category): category is string => !!category);

  return [...new Set(categories)];
}

/**
 * Get all available tags.
 */
export function getBookTags(): string[] {
  const allTags = mockBooks
    .filter(isVisibleBook)
    .flatMap((book) => book.tags || [])
    .filter((tag): tag is string => !!tag);

  return [...new Set(allTags)];
}

/**
 * Search books by title, author, or description.
 */
export function searchBooks(query: string, limit?: number): BookMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = mockBooks.filter(
    (book) =>
      isVisibleBook(book) &&
      (
        book.title?.toLowerCase().includes(q) ||
        book.author?.toLowerCase().includes(q) ||
        book.description?.toLowerCase().includes(q) ||
        book.summary?.toLowerCase().includes(q) ||
        book.tags?.some((tag) => tag.toLowerCase().includes(q))
      )
  );

  return limit ? results.slice(0, limit) : results;
}

export default {
  getBookSlugs,
  getBookBySlug,
  getBooksBySlugs,
  getAllBooks,
  getBooksByCategory,
  getFeaturedBooks,
  getBookCategories,
  getBookTags,
  searchBooks,
};
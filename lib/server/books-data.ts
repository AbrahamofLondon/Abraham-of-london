// lib/server/books-data.ts - SIMPLIFIED VERSION FOR STATIC GENERATION
import { allBooks } from "@/lib/contentlayer";
import type { Book as ContentlayerBook } from "@/lib/contentlayer";

// Use the Contentlayer type directly
export type Book = ContentlayerBook;
export type BookWithContent = ContentlayerBook;

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

// Helper to get book reading time
function getBookReadTime(book: any): string {
  if (book.readTime && typeof book.readTime === 'string') {
    return book.readTime;
  }
  
  if (book.body?.raw) {
    const wordCount = book.body.raw.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    return `${readingTime} min`;
  }
  
  return "5 min";
}

// Helper to get book cover image
function getBookCoverImage(book: any): string {
  if (book.coverImage) return book.coverImage;
  if (book.image) return book.image;
  if (book.cover) return book.cover;
  return "/assets/images/writing-desk.webp";
}

/**
 * Get all books metadata (non-draft only)
 */
export function getAllBooksMeta(): Book[] {
  try {
    const books = (allBooks || []).filter(book => !isDraft(book));
    
    // Map to ensure we have all required Book properties
    return books.map(book => {
      // Create a new object with all properties from the book
      const mappedBook: any = {
        ...book,
        // Ensure required Book type properties exist
        normalizedReadTime: getBookReadTime(book),
        normalizedCoverImage: getBookCoverImage(book),
        slug: book.slug || book._raw?.flattenedPath?.split('/').pop() || '',
        title: book.title || "Untitled",
        // Ensure all Book type properties exist (provide defaults if missing)
        archived: book.archived ?? false,
        published: book.published ?? true,
        available: book.available ?? true,
        toc: book.toc ?? [],
        format: book.format ?? 'book',
        language: book.language ?? 'en',
        pages: book.pages ?? 0,
        weight: book.weight ?? 0,
        dimensions: book.dimensions ?? '',
        isbn: book.isbn ?? '',
        edition: book.edition ?? '',
      };
      
      return mappedBook as Book;
    });
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
    
    if (!book) return null;
    
    // Ensure all required properties exist
    const mappedBook: any = {
      ...book,
      normalizedReadTime: getBookReadTime(book),
      normalizedCoverImage: getBookCoverImage(book),
      // Ensure all Book type properties exist
      archived: book.archived ?? false,
      published: book.published ?? true,
      available: book.available ?? true,
      toc: book.toc ?? [],
      format: book.format ?? 'book',
      language: book.language ?? 'en',
      pages: book.pages ?? 0,
      weight: book.weight ?? 0,
      dimensions: book.dimensions ?? '',
      isbn: book.isbn ?? '',
      edition: book.edition ?? '',
    };
    
    return mappedBook as BookWithContent;
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
    return books as BookWithContent[];
  } catch (error) {
    console.error("Error fetching all books:", error);
    return [];
  }
}

// ... rest of the file remains the same ...

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
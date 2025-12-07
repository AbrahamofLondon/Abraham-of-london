// lib/server/books-data.ts
// Books under content/books/* - COMPLETE ROBUST VERSION

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Book, ContentEntry, ContentMeta } from "@/types/index";

export type BookWithContent = Book & {
  content: string;
};

// Extended MDX meta with book-specific fields
type BookishMdxMeta = MdxMeta & Partial<Book> & {
  publishDate?: string;
  releaseDate?: string;
  [key: string]: any;
};

type BookishMdxDocument = MdxDocument & {
  content: string;
} & Partial<Book>;

// ---------------------------------------------------------------------------
// SAFE TYPE CONVERTERS
// ---------------------------------------------------------------------------

/**
 * Safely convert any value to string or return undefined
 */
function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

/**
 * Safely convert any value to number or return undefined
 */
function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Safely convert any value to boolean or return undefined
 */
function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true") return true;
    if (lower === "false") return false;
    if (lower === "yes") return true;
    if (lower === "no") return false;
    if (lower === "1") return true;
    if (lower === "0") return false;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return undefined;
}

/**
 * Safely convert any value to array of strings or return undefined
 */
function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}

/**
 * Safely convert a value into the allowed status enum or undefined
 */
function safeStatus(
  value: unknown
): "draft" | "published" | "scheduled" | "archived" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled" || value === "archived") {
    return value;
  }
  return undefined;
}

/**
 * Safely convert format field
 */
function safeFormat(
  value: unknown
): "hardcover" | "paperback" | "ebook" | "audiobook" | "pdf" | undefined {
  if (typeof value === "string") {
    const lowerValue = value.toLowerCase();
    
    // Explicit checks for each valid format
    if (lowerValue === "hardcover") return "hardcover";
    if (lowerValue === "paperback") return "paperback";
    if (lowerValue === "ebook") return "ebook";
    if (lowerValue === "audiobook") return "audiobook";
    if (lowerValue === "pdf") return "pdf";
  }
  return undefined;
}

/**
 * Safely convert access level
 */
function safeAccessLevel(
  value: unknown
): "public" | "premium" | "private" | undefined {
  if (value === "public" || value === "premium" || value === "private") {
    return value;
  }
  return undefined;
}

/**
 * Safely convert genre array
 */
function safeGenreArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}

// ---------------------------------------------------------------------------
// MAIN CONVERSION FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Map generic MDX meta into a fully shaped Book.
 */
function fromMdxMeta(meta: MdxMeta): Book {
  const m = meta as BookishMdxMeta;

  // Handle different date fields
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate) || safeString(m.publishedDate);
  
  // Ensure required fields have defaults
  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled";
  
  if (!slug || !title) {
    console.warn(`Book metadata missing slug or title: ${slug} - ${title}`);
  }

  return {
    // Core identifiers - REQUIRED
    slug,
    title,

    // Content fields
    description: safeString(m.description),
    excerpt: safeString(m.excerpt),
    subtitle: safeString(m.subtitle),

    // Metadata
    date,
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    readTime: safeString(m.readTime) || safeNumber(m.readTime),

    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),

    // Book-specific fields
    isbn: safeString(m.isbn),
    publisher: safeString(m.publisher),
    publishedDate: safeString(m.publishedDate),
    language: safeString(m.language),
    price: safeString(m.price),
    purchaseLink: safeString(m.purchaseLink),
    pages: safeNumber(m.pages),
    format: safeFormat(m.format),
    series: safeString(m.series),
    volume: safeNumber(m.volume) || safeString(m.volume),
    edition: safeString(m.edition),
    rating: safeNumber(m.rating),
    lastModified: safeString(m.lastModified),

    // Additional book fields from our comprehensive type
    genre: safeGenreArray(m.genre),
    translator: safeString(m.translator),
    illustrator: safeString(m.illustrator),
    forewordBy: safeString(m.forewordBy),
    introductionBy: safeString(m.introductionBy),
    dimensions: safeString(m.dimensions),
    weight: safeString(m.weight),
    binding: safeString(m.binding),

    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    status: safeStatus(m.status),

    // Access
    accessLevel: safeAccessLevel(m.accessLevel) || "public",
    lockMessage: safeString(m.lockMessage),

    // System fields
    _raw: m._raw,
    _id: safeString(m._id),
    url: safeString(m.url),
    type: safeString(m.type) || "book",

    // Preserve any additional fields
    ...Object.fromEntries(
      Object.entries(m)
        .filter(([key]) => ![
          'slug', 'title', 'description', 'excerpt', 'subtitle',
          'date', 'author', 'category', 'tags', 'featured', 'readTime',
          'coverImage', 'image', 'isbn', 'publisher', 'publishedDate',
          'language', 'price', 'purchaseLink', 'pages', 'format', 'series',
          'volume', 'edition', 'rating', 'lastModified', 'genre', 'translator',
          'illustrator', 'forewordBy', 'introductionBy', 'dimensions', 'weight',
          'binding', 'draft', 'published', 'status', 'accessLevel', 'lockMessage',
          '_raw', '_id', 'url', 'type', 'publishDate', 'releaseDate'
        ].includes(key))
        .map(([key, value]) => [key, value])
    ),
  };
}

/**
 * Attach MDX content to a typed Book.
 */
function fromMdxDocument(doc: MdxDocument): BookWithContent {
  const bookDoc = doc as BookishMdxDocument;
  const { content, ...rest } = bookDoc;
  const meta = fromMdxMeta(rest);
  
  return { 
    ...meta, 
    content: typeof content === "string" ? content : "",
    body: bookDoc.body || undefined,
  };
}

/**
 * Convert Book to ContentMeta for listings
 */
export function bookToContentMeta(book: Book): ContentMeta {
  const { content, body, ...meta } = book;
  return meta;
}

/**
 * Convert Book to ContentEntry for backward compatibility
 */
export function bookToContentEntry(book: Book): ContentEntry {
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
// PUBLIC API FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * All books – meta only.
 */
export function getAllBooksMeta(): Book[] {
  try {
    const metas = getMdxCollectionMeta("books");
    if (!metas || !Array.isArray(metas)) {
      console.warn("No books metadata found or metadata is not an array");
      return [];
    }
    
    const books = metas.map((m) => fromMdxMeta(m));
    
    // Filter out invalid books (missing required fields)
    const validBooks = books.filter(book => {
      const isValid = book.slug && book.title;
      if (!isValid) {
        console.warn(`Invalid book skipped: ${book.slug || 'no-slug'} - ${book.title || 'no-title'}`);
      }
      return isValid;
    });
    
    console.log(`Found ${validBooks.length} valid books out of ${metas.length} total`);
    return validBooks;
  } catch (error) {
    console.error("Error fetching all books meta:", error);
    return [];
  }
}

/**
 * Single book – meta + content.
 */
export function getBookBySlug(slug: string): BookWithContent | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.error("getBookBySlug called with invalid slug:", slug);
      return null;
    }
    
    const doc = getMdxDocumentBySlug("books", slug);
    if (!doc) {
      console.warn(`No book found for slug: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`Error fetching book by slug (${slug}):`, error);
    return null;
  }
}

/**
 * Get all books with content - for comprehensive listing
 */
export function getAllBooks(): BookWithContent[] {
  try {
    const metas = getAllBooksMeta();
    if (metas.length === 0) return [];
    
    const booksWithContent: BookWithContent[] = [];
    
    for (const meta of metas) {
      const book = getBookBySlug(meta.slug);
      if (book) {
        booksWithContent.push(book);
      } else {
        console.warn(`Could not load content for book: ${meta.slug}`);
      }
    }
    
    return booksWithContent;
  } catch (error) {
    console.error("Error fetching all books:", error);
    return [];
  }
}

/**
 * Get books by category
 */
export function getBooksByCategory(category: string): Book[] {
  try {
    const books = getAllBooksMeta();
    if (!category || typeof category !== 'string') return [];
    
    const normalizedCategory = category.toLowerCase().trim();
    
    return books.filter(book => {
      const bookCategory = book.category?.toLowerCase().trim();
      return bookCategory === normalizedCategory;
    });
  } catch (error) {
    console.error(`Error fetching books by category (${category}):`, error);
    return [];
  }
}

/**
 * Get books by tag
 */
export function getBooksByTag(tag: string): Book[] {
  try {
    const books = getAllBooksMeta();
    if (!tag || typeof tag !== 'string') return [];
    
    const normalizedTag = tag.toLowerCase().trim();
    
    return books.filter(book => {
      return book.tags?.some(t => t.toLowerCase().trim() === normalizedTag);
    });
  } catch (error) {
    console.error(`Error fetching books by tag (${tag}):`, error);
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
 * Get published books only (filter out drafts)
 */
export function getPublishedBooks(): Book[] {
  try {
    const books = getAllBooksMeta();
    return books.filter(book => 
      book.draft !== true && 
      book.status !== "draft" && 
      (book.published === true || book.status === "published")
    );
  } catch (error) {
    console.error("Error fetching published books:", error);
    return [];
  }
}

/**
 * Search books by multiple fields
 */
export function searchBooks(query: string): Book[] {
  try {
    const books = getAllBooksMeta();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return books;
    
    return books.filter(book => {
      // Search in title
      if (book.title?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in subtitle
      if (book.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in description
      if (book.description?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in excerpt
      if (book.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in author
      if (book.author?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in tags
      if (book.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in category
      if (book.category?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in series
      if (book.series?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in publisher
      if (book.publisher?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in ISBN
      if (book.isbn?.toLowerCase().includes(normalizedQuery)) return true;
      
      return false;
    });
  } catch (error) {
    console.error(`Error searching books (${query}):`, error);
    return [];
  }
}

/**
 * Get recent books (sorted by date, newest first)
 */
export function getRecentBooks(limit?: number): Book[] {
  try {
    const books = getAllBooksMeta();
    
    // Sort by date (newest first), then by title for same dates
    const sorted = books.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (dateB !== dateA) return dateB - dateA;
      
      // Same date, sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
    
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}

/**
 * Get books by format (hardcover, paperback, etc.)
 */
export function getBooksByFormat(format: string): Book[] {
  try {
    const books = getAllBooksMeta();
    if (!format || typeof format !== 'string') return [];
    
    const normalizedFormat = format.toLowerCase().trim();
    
    return books.filter(book => 
      book.format?.toLowerCase().trim() === normalizedFormat
    );
  } catch (error) {
    console.error(`Error fetching books by format (${format}):`, error);
    return [];
  }
}

/**
 * Get all unique categories from books
 */
export function getAllBookCategories(): string[] {
  try {
    const books = getAllBooksMeta();
    const categories = books
      .map(book => book.category)
      .filter((category): category is string => 
        typeof category === "string" && category.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(categories)].sort();
  } catch (error) {
    console.error("Error fetching book categories:", error);
    return [];
  }
}

/**
 * Get all unique tags from books
 */
export function getAllBookTags(): string[] {
  try {
    const books = getAllBooksMeta();
    const allTags = books
      .flatMap(book => book.tags || [])
      .filter((tag): tag is string => typeof tag === "string");
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error fetching book tags:", error);
    return [];
  }
}

/**
 * Get all unique authors from books
 */
export function getAllBookAuthors(): string[] {
  try {
    const books = getAllBooksMeta();
    const authors = books
      .map(book => book.author)
      .filter((author): author is string => 
        typeof author === "string" && author.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(authors)].sort();
  } catch (error) {
    console.error("Error fetching book authors:", error);
    return [];
  }
}

/**
 * Get all unique series from books
 */
export function getAllBookSeries(): string[] {
  try {
    const books = getAllBooksMeta();
    const series = books
      .map(book => book.series)
      .filter((series): series is string => 
        typeof series === "string" && series.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(series)].sort();
  } catch (error) {
    console.error("Error fetching book series:", error);
    return [];
  }
}

/**
 * Get book slugs for static generation
 */
export function getAllBookSlugs(): string[] {
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
 * Get statistics about books
 */
export function getBookStats(): {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  byFormat: Record<string, number>;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
} {
  try {
    const books = getAllBooksMeta();
    
    const stats = {
      total: books.length,
      published: books.filter(b => b.published === true || b.status === "published").length,
      drafts: books.filter(b => b.draft === true || b.status === "draft").length,
      featured: books.filter(b => b.featured === true).length,
      byFormat: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
    };
    
    books.forEach(book => {
      // Count by format
      if (book.format) {
        stats.byFormat[book.format] = (stats.byFormat[book.format] || 0) + 1;
      }
      
      // Count by category
      if (book.category) {
        stats.byCategory[book.category] = (stats.byCategory[book.category] || 0) + 1;
      }
      
      // Count by year
      if (book.date) {
        const year = new Date(book.date).getFullYear().toString();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
    });
    
    return stats;
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
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

export default {
  // Core functions
  getAllBooksMeta,
  getBookBySlug,
  getAllBooks,
  
  // Filter functions
  getBooksByCategory,
  getBooksByTag,
  getFeaturedBooks,
  getPublishedBooks,
  searchBooks,
  getRecentBooks,
  getBooksByFormat,
  
  // List functions
  getAllBookCategories,
  getAllBookTags,
  getAllBookAuthors,
  getAllBookSeries,
  getAllBookSlugs,
  
  // Stats
  getBookStats,
  
  // Utility functions
  bookToContentMeta,
  bookToContentEntry,
  
  // Types
  Book,
  BookWithContent,
};
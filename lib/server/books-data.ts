// lib/server/books-data.ts
// Books under content/books/* - COMPLETE UPDATED VERSION

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { BookMeta as SharedBookMeta } from "@/types/index";

// Re-export shared BookMeta so everything speaks the same type.
export type BookMeta = SharedBookMeta;

export type BookWithContent = BookMeta & {
  content: string;
};

// MDX meta that may also carry book-specific fields defined in SharedBookMeta
type BookishMdxMeta = MdxMeta &
  Partial<SharedBookMeta> & {
    publishDate?: string; // allow alternate date field
    releaseDate?: string; // another alternate for date
  };

type BookishMdxDocument = MdxDocument & {
  content: string;
} & Partial<SharedBookMeta>;

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
): "draft" | "published" | "scheduled" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled") {
    return value;
  }
  return undefined;
}

/**
 * Safely convert format field
 */
function safeFormat(
  value: unknown
): "hardcover" | "paperback" | "ebook" | "audiobook" | undefined {
  const validFormats = ["hardcover", "paperback", "ebook", "audiobook"];
  if (typeof value === "string" && validFormats.includes(value.toLowerCase())) {
    return value.toLowerCase() as typeof validFormats[number];
  }
  return undefined;
}

/**
 * Map generic MDX meta into a fully shaped BookMeta.
 * We assume MDX frontmatter matches a subset of SharedBookMeta.
 */
function fromMdxMeta(meta: MdxMeta): BookMeta {
  const m = meta as BookishMdxMeta;

  // Handle different date fields - prefer date, then publishDate, then releaseDate
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate);
  
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

    // Optional string fields
    subtitle: safeString(m.subtitle),
    description: safeString(m.description),
    excerpt: safeString(m.excerpt),
    coverImage: safeString(m.coverImage),
    date,
    author: safeString(m.author),
    readTime: safeString(m.readTime),
    lastModified: safeString(m.lastModified),
    category: safeString(m.category),
    isbn: safeString(m.isbn),
    publisher: safeString(m.publisher),
    publishedDate: safeString(m.publishedDate),
    language: safeString(m.language),
    price: safeString(m.price),
    purchaseLink: safeString(m.purchaseLink),

    // Optional array fields
    tags: safeArray(m.tags),

    // Optional number fields
    pages: safeNumber(m.pages),
    rating: safeNumber(m.rating),

    // Optional boolean fields
    featured: safeBoolean(m.featured),
    published: safeBoolean(m.published),
    draft: safeBoolean(m.draft),

    // Optional typed fields
    format: safeFormat(m.format),

    // Status – enforce union type
    status: safeStatus(m.status),
    
    // Additional fields that might be useful
    series: safeString(m.series),
    volume: safeNumber(m.volume),
    edition: safeString(m.edition),
  };
}

/**
 * Attach MDX content to a typed BookMeta.
 */
function fromMdxDocument(doc: MdxDocument): BookWithContent {
  const bookDoc = doc as BookishMdxDocument;
  const { content, ...rest } = bookDoc;
  const meta = fromMdxMeta(rest);
  return { 
    ...meta, 
    content: typeof content === "string" ? content : "" 
  };
}

/**
 * All books – meta only.
 */
export function getAllBooksMeta(): BookMeta[] {
  try {
    const metas = getMdxCollectionMeta("books");
    if (!metas || !Array.isArray(metas)) {
      console.warn("No books metadata found or metadata is not an array");
      return [];
    }
    
    const books = metas.map((m) => fromMdxMeta(m));
    
    // Filter out invalid books
    const validBooks = books.filter(book => book.slug && book.title);
    
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
    if (!slug) {
      console.error("getBookBySlug called with empty slug");
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
export function getBooksByCategory(category: string): BookMeta[] {
  try {
    const books = getAllBooksMeta();
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
export function getBooksByTag(tag: string): BookMeta[] {
  try {
    const books = getAllBooksMeta();
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
export function getFeaturedBooks(): BookMeta[] {
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
export function getPublishedBooks(): BookMeta[] {
  try {
    const books = getAllBooksMeta();
    return books.filter(book => book.draft !== true && book.status !== "draft");
  } catch (error) {
    console.error("Error fetching published books:", error);
    return [];
  }
}

/**
 * Search books by title, description, or tags
 */
export function searchBooks(query: string): BookMeta[] {
  try {
    const books = getAllBooksMeta();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return books;
    
    return books.filter(book => {
      // Search in title
      if (book.title.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in subtitle
      if (book.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in description
      if (book.description?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in excerpt
      if (book.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in tags
      if (book.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in category
      if (book.category?.toLowerCase().includes(normalizedQuery)) return true;
      
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
export function getRecentBooks(limit?: number): BookMeta[] {
  try {
    const books = getAllBooksMeta();
    
    // Sort by date (newest first)
    const sorted = books.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
    
    return limit ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent books:", error);
    return [];
  }
}

/**
 * Get books by format (hardcover, paperback, etc.)
 */
export function getBooksByFormat(format: string): BookMeta[] {
  try {
    const books = getAllBooksMeta();
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
    
    // Remove duplicates
    return [...new Set(categories)];
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
 * Get book slugs for static generation
 */
export function getAllBookSlugs(): string[] {
  try {
    const books = getAllBooksMeta();
    return books.map(book => book.slug).filter(Boolean);
  } catch (error) {
    console.error("Error fetching book slugs:", error);
    return [];
  }
}

// Export everything
export default {
  getAllBooksMeta,
  getBookBySlug,
  getAllBooks,
  getBooksByCategory,
  getBooksByTag,
  getFeaturedBooks,
  getPublishedBooks,
  searchBooks,
  getRecentBooks,
  getBooksByFormat,
  getAllBookCategories,
  getAllBookTags,
  getAllBookSlugs,
};
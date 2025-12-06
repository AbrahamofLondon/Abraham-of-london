import {
  getAllBooksMeta,
  getBookBySlug as getBookDocBySlug,
} from "@/lib/server/books-data";

// Remove the incorrect import and define proper types locally

// Define Book interface locally since it's not exported from @/types/index
interface Book {
  // Required fields
  slug: string;
  title: string;

  // Optional string fields
  excerpt?: string;
  coverImage?: string;
  date?: string;
  author?: string;
  readTime?: string;
  subtitle?: string;
  description?: string;
  lastModified?: string;
  category?: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  language?: string;
  price?: string;
  purchaseLink?: string;

  // Optional boolean fields
  featured?: boolean;
  published?: boolean;
  draft?: boolean;

  // Optional array fields
  tags?: string[];

  // Optional number fields
  pages?: number;
  rating?: number;

  // Optional typed fields
  format?: "hardcover" | "paperback" | "ebook" | "audiobook";
}

// Extended type that includes content
export type BookWithContent = Book & {
  content?: string;
};

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
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/**
 * Safely convert any value to boolean or return undefined
 */
function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return undefined;
}

/**
 * Safely convert any value to array or return undefined
 */
function safeArray(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : undefined;
}

/**
 * Normalise raw meta into a strongly-typed Book.
 */
function normaliseBook(raw: Record<string, unknown>): Book {
  const slug = safeString(raw.slug) || "";
  const title = safeString(raw.title) || "Untitled";

  return {
    // Required fields
    slug,
    title,

    // Optional string fields
    excerpt: safeString(raw.excerpt),
    coverImage: safeString(raw.coverImage),
    date: safeString(raw.date),
    author: safeString(raw.author),
    readTime: safeString(raw.readTime),
    subtitle: safeString(raw.subtitle),
    description: safeString(raw.description),
    lastModified: safeString(raw.lastModified),
    category: safeString(raw.category),
    isbn: safeString(raw.isbn),
    publisher: safeString(raw.publisher),
    publishedDate: safeString(raw.publishedDate),
    language: safeString(raw.language),
    price: safeString(raw.price),
    purchaseLink: safeString(raw.purchaseLink),

    // Optional boolean fields
    featured: safeBoolean(raw.featured),
    published: safeBoolean(raw.published),
    draft: safeBoolean(raw.draft),

    // Optional array fields
    tags: safeArray(raw.tags),

    // Optional number fields
    pages: safeNumber(raw.pages),
    rating: safeNumber(raw.rating),

    // Optional typed fields
    format: safeString(raw.format) as
      | "hardcover"
      | "paperback"
      | "ebook"
      | "audiobook"
      | undefined,
  };
}

/**
 * Convert any object to Record<string, unknown> safely
 */
function toSafeRecord(obj: any): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return {};

  const record: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    record[key] = value;
  });
  return record;
}

/**
 * Get raw book data as plain objects for tooling/debugging
 */
export function getRawBooks(): Record<string, unknown>[] {
  const books = getAllBooksMeta();
  return books.map(toSafeRecord);
}

/**
 * Fully typed & normalised books for UI components.
 */
export function getAllBooks(): Book[] {
  const rawBooks = getRawBooks();
  return rawBooks.map(normaliseBook);
}

/**
 * Fetch a single book by slug with content.
 */
export function getBookBySlug(slug: string): BookWithContent | undefined {
  const raw = getBookDocBySlug(slug);
  if (!raw) return undefined;

  const record = toSafeRecord(raw);
  const meta = normaliseBook(record);

  // Extract content if it exists
  const content = safeString(raw.content);

  return {
    ...meta,
    content,
  };
}
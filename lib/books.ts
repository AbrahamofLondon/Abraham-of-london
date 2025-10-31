// lib/books.ts

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Enforce server-side usage for file system operations
if (typeof window !== "undefined") {
  throw new Error("This module is server-only and cannot be imported by client components.");
}

// --- Type Definitions ---

export interface BookRequiredMeta {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string; // Typically a single string, but coerced for safety
}

export interface BookMeta extends BookRequiredMeta {
  date?: string; // Original post date (if applicable)
  publishedDate?: string; // Date of book publication (ISO string)
  isbn?: string;
  pages?: number;
  rating?: number; // 1-5 scale
  language?: string;
  publisher?: string;
  tags?: string[]; // Array of strings
  downloadPdf?: string;
  downloadEpub?: string;
  content?: string;
}

// Type alias for all possible frontmatter fields we might request
export type BookField = keyof BookMeta;

const BOOKS_CONTENT_DIR = path.join(process.cwd(), "content", "books");

// --- Private Helpers for Data Coercion ---

/** Converts a slug to a PascalCase title (fallback). */
function toTitle(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Coerces a value into an array of trimmed, non-empty strings. */
function toStringArray(v: unknown): string[] {
  let values: unknown[] = [];

  if (Array.isArray(v)) {
    values = v;
  } else if (typeof v === "string") {
    values = v.split(",");
  }
  
  return values
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Coerces a value into a finite number (integer), or undefined. */
function toInteger(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isInteger(v) && Number.isFinite(v)) return v;
  
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseInt(v.trim(), 10);
    return Number.isInteger(n) && Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Coerces a value into a safe rating number (0.0 to 5.0), or undefined. */
function toRating(v: unknown): number | undefined {
  if (typeof v === "number" && v >= 0 && v <= 5) return v;
  
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.trim());
    return Number.isFinite(n) && n >= 0 && n <= 5 ? n : undefined;
  }
  return undefined;
}

/** Coerces a value into an ISO date string, or undefined if not a valid date. */
function toDateString(v: unknown): string | undefined {
  let date: Date;

  if (v instanceof Date) {
    date = v;
  } else if (typeof v === "number") {
    date = new Date(v);
  } else if (typeof v === "string") {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return undefined;
    date = new Date(t);
  } else {
    return undefined;
  }

  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

// --- Public API ---

/** Retrieves all valid book slugs (filenames without extension). */
export function getBookSlugs(): string[] {
  if (!fs.existsSync(BOOKS_CONTENT_DIR)) return [];
  
  return fs
    .readdirSync(BOOKS_CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

/** Finds the full path to a book file, supporting .mdx and .md. */
function resolveBookPath(slug: string): string | null {
  const mdx = path.join(BOOKS_CONTENT_DIR, `${slug}.mdx`);
  const md = path.join(BOOKS_CONTENT_DIR, `${slug}.md`);
  
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  
  return null;
}

/**
 * Retrieves a single book's metadata and optional content by slug.
 * @param slug The filename of the book.
 * @param fields The subset of fields to retrieve.
 */
export function getBookBySlug<T extends BookField | "content">(
  slug: string,
  fields: T[] = [] as T[],
): Partial<Pick<BookMeta, Exclude<T, "content">>> & { content?: string } & Pick<BookRequiredMeta, "slug"> {
  
  const realSlug = slug.replace(/\.mdx?$/, "");
  const fullPath = resolveBookPath(realSlug);

  if (!fullPath) {
    return { slug: realSlug } as any;
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<BookMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === "content") {
      item.content = content;
      continue;
    }

    const raw = fm[field as string];
    // Skip if the field wasn't requested or isn't present in frontmatter
    if (typeof raw === "undefined") continue; 

    // Explicitly coerce types for safety and consistency
    switch (field as BookField) {
      case "tags": {
        item.tags = toStringArray(raw);
        break;
      }
      case "genre": {
        // Genre is treated as a single string, converting array to a comma-separated string
        item.genre = Array.isArray(raw) ? toStringArray(raw).join(", ") : String(raw).trim();
        break;
      }
      case "pages": {
        // Ensure pages is an integer
        item.pages = toInteger(raw);
        break;
      }
      case "rating": {
        // Ensure rating is a safe number
        item.rating = toRating(raw);
        break;
      }
      case "publishedDate": 
      case "date": {
        // Consistent ISO date strings for all date fields
        item[field] = toDateString(raw);
        break;
      }
      // Simple string fields (including all required fields)
      case "title":
      case "author":
      case "excerpt":
      case "coverImage":
      case "buyLink":
      case "isbn":
      case "language":
      case "publisher":
      case "downloadPdf":
      case "downloadEpub": {
        if (typeof raw === "string") {
          item[field] = raw.trim();
        }
        break;
      }
      default: {
        // Fallback for any unexpected field requested
        // This is usually safe but strict type checking above reduces its necessity
        (item as Record<string, unknown>)[field] = raw;
      }
    }
  }

  // Final mandatory field validation and fallback assignment
  if (fields.includes('title' as T) && !item.title) item.title = toTitle(realSlug);
  // NOTE: It is recommended that the caller/page check for the presence of all BookRequiredMeta fields 
  // and handle errors/fallbacks explicitly, rather than relying on this library to guess.

  return item as any; // Cast required due to complex generic return type
}

/**
 * Retrieves all books with the specified fields.
 * @param fields The subset of fields to retrieve.
 */
export function getAllBooks<T extends BookField | "content">(
  fields: T[] = [] as T[],
): (Partial<Pick<BookMeta, Exclude<T, "content">>> & { content?: string } & Pick<BookRequiredMeta, "slug">)[] {
  
  // Ensure required fields are always included for basic listing/sorting
  const requiredFields = Array.from(new Set<BookField | "content">([...fields, "title", "slug"])) as (BookField | "content")[];

  const books = getBookSlugs()
    .map((s) => getBookBySlug(s, requiredFields))
    // Filter out any books that couldn't be retrieved (shouldn't happen if getBookSlugs is correct)
    .filter(book => book.slug); 

  // Sort alphabetically by title (fallback to slug)
  books.sort((a, b) => {
    const titleA = (a.title || a.slug || "").toString();
    const titleB = (b.title || b.slug || "").toString();
    
    return titleA.localeCompare(titleB, undefined, {
      sensitivity: "base", // Case and accent insensitive comparison
    });
  });

  return books as any; // Cast required due to complex generic return type
}
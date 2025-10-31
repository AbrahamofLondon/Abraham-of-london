// lib/server/books-data.ts
// Data loader for structured book information from a JSON registry.

import fs from "fs";
import path from "path";

// Enforce server-side usage for file system operations
if (typeof window !== "undefined") {
  throw new Error("This module is server-only and cannot be imported by client components.");
}

// --- Type Definitions ---

export type Book = {
  slug: string;
  title: string;
  author: string;
  excerpt?: string;
  coverImage?: string; // Path under /public
  genre?: string;
  buyLink?: string; // External URL
  downloadPdf?: string; // Path under /public/downloads
  downloadEpub?: string; // Path under /public/downloads
};

// --- Constants ---

const ROOT = process.cwd();
const BOOKS_REGISTRY_PATH = path.join(ROOT, "content", "_books-registry.json");

// --- Private Helpers for Data Validation/Coercion ---

/** Coerces an unknown value to a string, or undefined if not useful. */
function toStringOrUndefined(v: unknown): string | undefined {
    if (typeof v === 'string' && v.trim()) return v.trim();
    return undefined;
}

/** Coerces an unknown value to a non-null string. */
function toStringOrEmpty(v: unknown): string {
    return toStringOrUndefined(v) || "";
}

/**
 * Safely validates and coerces an object into the Book type.
 * @param data The raw data object.
 * @returns A validated Book object or null if essential fields are missing.
 */
function validateBookEntry(data: any): Book | null {
    const slug = toStringOrUndefined(data.slug);
    const title = toStringOrUndefined(data.title);
    const author = toStringOrUndefined(data.author);

    if (!slug || !title || !author) {
        console.warn("Skipping invalid book entry: requires slug, title, and author.", data);
        return null;
    }

    // Coerce all optional fields
    const excerpt = toStringOrUndefined(data.excerpt);
    const coverImage = toStringOrUndefined(data.coverImage);
    const genre = toStringOrUndefined(data.genre);
    const buyLink = toStringOrUndefined(data.buyLink);
    const downloadPdf = toStringOrUndefined(data.downloadPdf);
    const downloadEpub = toStringOrUndefined(data.downloadEpub);

    return {
        slug,
        title,
        author,
        excerpt,
        coverImage,
        genre,
        buyLink,
        downloadPdf,
        downloadEpub,
    };
}


// --- Data Loader (Lazy-loaded and Synchronous) ---

let booksCache: Book[] | null = null;

/**
 * Reads, parses, validates, and caches the book data from the JSON registry.
 */
function loadBooksData(): Book[] {
    if (booksCache) {
        return booksCache;
    }

    if (!fs.existsSync(BOOKS_REGISTRY_PATH)) {
        console.warn(`Book registry not found at: ${BOOKS_REGISTRY_PATH}`);
        booksCache = [];
        return [];
    }

    try {
        const fileContent = fs.readFileSync(BOOKS_REGISTRY_PATH, "utf-8");
        const rawData = JSON.parse(fileContent);

        if (!Array.isArray(rawData.books)) {
            console.error("Book registry JSON is not in the expected format (missing 'books' array).");
            booksCache = [];
            return [];
        }

        const validatedBooks: Book[] = rawData.books
            .map(validateBookEntry)
            .filter((book): book is Book => book !== null);
        
        // Sort alphabetically by title
        validatedBooks.sort((a, b) => a.title.localeCompare(b.title));

        booksCache = validatedBooks;
        return validatedBooks;

    } catch (error) {
        console.error(`Failed to load or parse book registry at ${BOOKS_REGISTRY_PATH}:`, error);
        booksCache = [];
        return [];
    }
}

// --- Public API ---

/**
 * Retrieves all validated books from the registry.
 */
export function getAllBooks(): Book[] {
  return loadBooksData();
}

/**
 * Retrieves a single book by its slug.
 * @param slug The unique slug identifier for the book.
 */
export function getBookBySlug(slug: string): Book | undefined {
  return loadBooksData().find((b) => b.slug === slug);
}
// lib/books.ts
// Facade over the server-side books loader, returning fully-typed Book objects.

import {
  getAllBooksMeta,
  getBookBySlug as getBookDocBySlug,
} from "@/lib/server/books-data";

export interface Book {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  date?: string;
  author?: string | null;
  readTime?: string | null;
  [key: string]: unknown;
}

/**
 * Normalise raw meta into a strongly-typed Book.
 * Ensures title is always a non-empty string.
 */
function normaliseBookMeta(raw: Record<string, unknown>): Book {
  const slug = String(raw.slug ?? "").trim();
  const title =
    typeof raw.title === "string" && raw.title.trim().length
      ? raw.title
      : "Untitled";

  const book: Book = {
    slug,
    title,
    excerpt:
      typeof raw.excerpt === "string" ? raw.excerpt : undefined,
    coverImage:
      typeof raw.coverImage === "string" ? raw.coverImage : undefined,
    date: typeof raw.date === "string" ? raw.date : undefined,
    author:
      typeof (raw as any).author === "string"
        ? (raw as any).author
        : null,
    readTime:
      typeof (raw as any).readTime === "string"
        ? (raw as any).readTime
        : null,
    // keep the rest of the fields available for consumers that need them
    ...raw,
  };

  return book;
}

/** All books as fully-typed Book[] – safe for UI use. */
export function getAllBooks(): Book[] {
  const metas = getAllBooksMeta() as Record<string, unknown>[];
  return metas.map((meta) => normaliseBookMeta(meta));
}

/** Single book by slug, or undefined if not found. */
export function getBookBySlug(slug: string): Book | undefined {
  const raw = getBookDocBySlug(slug);
  if (!raw) return undefined;
  return normaliseBookMeta(raw as Record<string, unknown>);
}
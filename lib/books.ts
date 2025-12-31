// lib/books.ts - MINIMAL FIX
import { allBooks } from "@/lib/contentlayer";
import type { Book as ContentlayerBook } from "@/lib/contentlayer";

// Keep the original type but make computed fields optional
export type Book = ContentlayerBook;
export type BookWithContent = Book;

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const lower = (v: unknown) => s(v).trim().toLowerCase();

function isDraft(book: any): boolean {
  if (!book) return true;
  if (book.draft === true || String(book.draft) === "true") return true;
  if (book.published === false) return true;
  if (lower(book.status ?? "") === "draft") return true;
  return false;
}

function normalizeSlug(slug: string): string {
  return lower(slug);
}

function getBookSlug(book: Book): string {
  const anyBook = book as any;

  if (anyBook.slug) return s(anyBook.slug).trim();

  // some older code used href like "/books/<slug>"
  if (anyBook.href) {
    const parts = s(anyBook.href).split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  // contentlayer raw fallback
  if (book._raw?.flattenedPath) {
    const parts = s(book._raw.flattenedPath).split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  return "";
}

export function getAllBooksMeta(): Book[] {
  // Cast to fix type issue - computed fields will be included
  return ((allBooks ?? []) as Book[]).filter((b) => b && !isDraft(b));
}

export function getAllBooks(): BookWithContent[] {
  return getAllBooksMeta();
}

export function getBookBySlug(slug: string): BookWithContent | null {
  const target = normalizeSlug(slug);
  if (!target) return null;

  const found = (allBooks ?? []).find((b) => {
    if (!b || isDraft(b)) return false;
    const bookSlug = normalizeSlug(getBookSlug(b as Book));
    return bookSlug === target;
  });

  return (found as BookWithContent) || null;
}

export function getBookSlugs(): string[] {
  return getAllBooksMeta()
    .map((b) => normalizeSlug(getBookSlug(b)))
    .filter((x) => x && x !== "index");
}

export function getPublicBooks(): Book[] {
  return getAllBooksMeta();
}

export function getFeaturedBooks(limit?: number): Book[] {
  const featured = getPublicBooks().filter((b: any) => b.featured === true);
  return typeof limit === "number" ? featured.slice(0, limit) : featured;
}

export function getRecentBooks(limit?: number): Book[] {
  const sorted = [...getPublicBooks()].sort((a: any, b: any) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });

  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

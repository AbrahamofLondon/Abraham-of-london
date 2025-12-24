// lib/books.ts
import { allBooks } from "@/lib/contentlayer";
import type { Book as ContentlayerBook } from "@/lib/contentlayer";
export type Book = ContentlayerBook;

const s = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const lower = (v: unknown) => s(v).trim().toLowerCase();

function isDraft(book: any): boolean {
  if (!book) return true;
  if (book.draft === true || String(book.draft) === "true") return true;
  if (book.published === false) return true;
  if (String(book.status ?? "").toLowerCase() === "draft") return true;
  return false;
}

function normalizeSlug(slug: string): string {
  return lower(slug);
}

function getBookSlug(book: Book): string {
  if ((book as any).slug) return s((book as any).slug).trim();
  if ((book as any).href) {
    const parts = s((book as any).href).split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
  if (book._raw?.flattenedPath) {
    const parts = s(book._raw.flattenedPath).split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
  return "";
}

export function getAllBooksMeta(): Book[] {
  return (allBooks ?? []).filter((b) => b && !isDraft(b));
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
    .map((b) => getBookSlug(b))
    .map((x) => normalizeSlug(x))
    .filter((x) => x && x !== "index");
}

export function getPublicBooks(): Book[] {
  return getAllBooksMeta();
}

export function getFeaturedBooks(limit?: number): Book[] {
  const featured = getPublicBooks().filter((b: any) => b.featured === true);
  return limit ? featured.slice(0, limit) : featured;
}

export function getRecentBooks(limit?: number): Book[] {
  const sorted = [...getPublicBooks()].sort((a: any, b: any) => {
    const ta = a.date ? new Date(a.date).getTime() : 0;
    const tb = b.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });
  return limit ? sorted.slice(0, limit) : sorted;
}
// lib/server/books-data.ts - PRODUCTION-GRADE, NO ASSUMPTIONS
import type { ContentDoc } from "@/lib/contentlayer";
import { getPublishedBooks, normalizeSlug } from "@/lib/contentlayer";

export type Book = ContentDoc & {
  normalizedReadTime: string;
  normalizedCoverImage: string;
};

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getReadTime(book: any): string {
  const rt = safeString(book?.readTime) || safeString(book?.readingTime);
  if (rt) return rt;

  const raw = safeString(book?.body?.raw);
  if (raw) {
    const words = raw.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min`;
  }
  return "5 min";
}

function getCoverImage(book: any): string {
  return (
    safeString(book?.coverImage) ||
    safeString(book?.image) ||
    safeString(book?.cover) ||
    "/assets/images/writing-desk.webp"
  );
}

function enhance(book: ContentDoc): Book {
  return {
    ...(book as any),
    normalizedReadTime: getReadTime(book),
    normalizedCoverImage: getCoverImage(book),
  };
}

export function getAllBooksMeta(): Book[] {
  try {
    return (getPublishedBooks() as ContentDoc[]).map(enhance);
  } catch (err) {
    console.error("getAllBooksMeta failed:", err);
    return [];
  }
}

export function getBookBySlug(slug: string): Book | null {
  try {
    const s = normalizeSlug(slug);
    if (!s) return null;

    const books = getAllBooksMeta();
    const found =
      books.find((b) => normalizeSlug(b.slug ?? b?._raw?.flattenedPath ?? "") === s) ?? null;

    return found;
  } catch (err) {
    console.error("getBookBySlug failed:", err);
    return null;
  }
}

export function getAllBooks(): Book[] {
  return getAllBooksMeta();
}

export function getBookSlugs(): string[] {
  return getAllBooksMeta()
    .map((b) => safeString(b.slug) || safeString(b?._raw?.flattenedPath?.split("/").pop()))
    .filter(Boolean);
}

export function getFeaturedBooks(count?: number): Book[] {
  const featured = getAllBooksMeta().filter((b: any) => b?.featured === true);
  return typeof count === "number" && count > 0 ? featured.slice(0, count) : featured;
}

export function getRecentBooks(count?: number): Book[] {
  const sorted = [...getAllBooksMeta()].sort((a: any, b: any) => {
    const ta = new Date(a?.date ?? 0).getTime();
    const tb = new Date(b?.date ?? 0).getTime();
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
  return typeof count === "number" && count > 0 ? sorted.slice(0, count) : sorted;
}

export default {
  getAllBooksMeta,
  getBookBySlug,
  getAllBooks,
  getBookSlugs,
  getFeaturedBooks,
  getRecentBooks,
};

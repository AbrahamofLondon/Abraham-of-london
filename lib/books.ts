// lib/books.ts — CANONICAL (ASYNC, NO allBooks IMPORTS)

import { getContentlayerData, isDraftContent, normalizeSlug } from "@/lib/content/server";
import { safeSlice } from "@/lib/utils/safe";

export type Book = any;
export type BookWithContent = Book;

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const lower = (v: unknown) => s(v).trim().toLowerCase();

function isDraft(book: any): boolean {
  if (!book) return true;
  if (isDraftContent(book)) return true;
  if (book.draft === true || String(book.draft) === "true") return true;
  if (book.published === false) return true;
  if (lower(book.status ?? "") === "draft") return true;
  return false;
}

function getBookSlug(book: Book): string {
  const anyBook = book as any;

  if (anyBook.slug) return s(anyBook.slug).trim();

  if (anyBook.href) {
    const parts = s(anyBook.href).split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  if (anyBook._raw?.flattenedPath) {
    const parts = s(anyBook._raw.flattenedPath).split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  return "";
}

// Helper to extract documents by type
function filterDocumentsByType(docs: any[], type: string): any[] {
  return docs.filter(doc => {
    const kind = String(doc?.kind || doc?.type || doc?.docKind || "").toLowerCase();
    const fp = String(doc?._raw?.flattenedPath || "").toLowerCase();
    return kind === type || fp.startsWith(`${type}s/`) || fp.startsWith(`${type}/`);
  });
}

async function loadBooks(): Promise<Book[]> {
  const d = await getContentlayerData();
  
  // Handle different possible return shapes
  let allDocs: any[] = [];
  
  if (Array.isArray(d)) {
    // d is an array of documents
    allDocs = d;
  } else if (d && typeof d === 'object') {
    // d is an object, look for document collections
    allDocs = (d as any).allDocuments || 
              (d as any).documents || 
              (d as any).docs || 
              [];
  }
  
  // Filter for books specifically
  const books = filterDocumentsByType(allDocs, 'book');
  
  return books.filter((b) => b && !isDraft(b));
}

/* -------------------------------------------------------------------------- */
/* Getters                                                                    */
/* -------------------------------------------------------------------------- */

export async function getAllBooksMeta(): Promise<Book[]> {
  return loadBooks();
}

export async function getAllBooks(): Promise<BookWithContent[]> {
  return loadBooks();
}

export async function getBookBySlug(slug: string): Promise<BookWithContent | null> {
  const target = lower(normalizeSlug(slug));
  if (!target) return null;

  const books = await loadBooks();
  const found = books.find((b) => lower(normalizeSlug(getBookSlug(b))) === target);

  return (found as BookWithContent) || null;
}

export async function getBookSlugs(): Promise<string[]> {
  const books = await loadBooks();
  return books
    .map((b) => lower(normalizeSlug(getBookSlug(b))))
    .filter((x) => x && x !== "index");
}

export async function getPublicBooks(): Promise<Book[]> {
  return loadBooks();
}

export async function getFeaturedBooks(limit?: number): Promise<Book[]> {
  const featured = (await loadBooks()).filter((b: any) => b?.featured === true);
  return typeof limit === "number" ? safeSlice(featured, 0, limit) : featured;
}

export async function getRecentBooks(limit?: number): Promise<Book[]> {
  const sorted = [...(await loadBooks())].sort((a: any, b: any) => {
    const ta = a?.date ? new Date(a.date).getTime() : 0;
    const tb = b?.date ? new Date(b.date).getTime() : 0;
    return tb - ta;
  });

  return typeof limit === "number" ? safeSlice(sorted, 0, limit) : sorted;
}
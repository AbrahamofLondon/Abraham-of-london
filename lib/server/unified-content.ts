// lib/server/unified-content.ts

// Hard guard – this must never run in the browser
if (typeof window !== "undefined") {
  throw new Error("lib/server/unified-content.ts must not be imported on the client");
}

import type { BookMeta } from "@/types/book";
import { getAllBooks } from "@/lib/server/books-data";

export interface UnifiedContent {
  slug: string; // e.g. "books/sample-book"
  title: string;
  type: "print" | "blog" | "document" | "page" | "book";
  content?: string;
  description?: string;
  author?: string;
  date?: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  printSettings?: {
    pageSize?: "A4" | "A5" | "LETTER";
    marginsMm?: number;
    includeHeader?: boolean;
    includeFooter?: boolean;
  };
  seoTitle?: string;
  seoDescription?: string;
  source: "mdx" | "contentlayer" | "api";
  published: boolean;
}

/* ============================================================================
   SOURCE ADAPTERS
   ========================================================================== */

/**
 * Map a BookMeta object into the unified content shape.
 */
function mapBookToUnifiedContent(book: BookMeta): UnifiedContent {
  const anyBook = book as any;

  return {
    slug: `books/${book.slug}`, // normalised path-style slug
    title: book.title || book.slug,
    type: "book",

    content: anyBook.content || undefined,
    description:
      book.description ||
      anyBook.summary ||
      anyBook.excerpt ||
      undefined,

    author: book.author || undefined,
    date: anyBook.publishedDate || undefined,
    updatedAt: anyBook.updatedAt || undefined,
    category: book.category || undefined,
    tags: book.tags || undefined,

    printSettings: undefined, // can be extended later for printables

    seoTitle: anyBook.seoTitle || book.title || undefined,
    seoDescription:
      anyBook.seoDescription ||
      book.description ||
      anyBook.summary ||
      undefined,

    // Treat books as MDX-backed or CMS-backed — adjust later if needed
    source: "mdx",
    published: (anyBook.status ?? "published") !== "draft",
  };
}

/**
 * Books as a unified content source.
 */
async function getBookContent(): Promise<UnifiedContent[]> {
  const { books } = getAllBooks({}, undefined, 0); // synchronous under the hood
  return books
    .filter((b) => !!b.slug)
    .map((b) => mapBookToUnifiedContent(b));
}

/**
 * MDX filesystem content – stub for now.
 */
async function getMdxContent(): Promise<UnifiedContent[]> {
  // TODO: Wire MD/MDX filesystem docs here and map to UnifiedContent
  return [];
}

/**
 * Contentlayer docs – stub for now.
 */
async function getContentlayerContent(): Promise<UnifiedContent[]> {
  // TODO: Wire Contentlayer collections here and map to UnifiedContent
  return [];
}

/**
 * External API content – stub for now.
 */
async function getApiContent(): Promise<UnifiedContent[]> {
  // TODO: Wire API-driven content here and map to UnifiedContent
  return [];
}

/* ============================================================================
   PUBLIC API
   ========================================================================== */

/**
 * Fetch all unified content across all sources.
 */
export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  const sources = await Promise.allSettled<UnifiedContent[]>([
    getBookContent(),
    getMdxContent(),
    getContentlayerContent(),
    getApiContent(),
  ]);

  const all: UnifiedContent[] = [];

  for (const res of sources) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      all.push(...res.value);
    } else if (res.status === "rejected") {
      // Soft-fail: log, don’t crash
      console.warn("Unified content source failed:", res.reason);
    }
  }

  // Sort by date desc if present; books without dates fall to the bottom
  all.sort((a, b) => {
    const da = a.date ? Date.parse(a.date) : 0;
    const db = b.date ? Date.parse(b.date) : 0;
    return db - da;
  });

  return all;
}

/**
 * Find a single unified content item by slug.
 * Accepts either "sample-book" (book slug) or "books/sample-book".
 */
export async function getUnifiedContentBySlug(
  slug: string
): Promise<UnifiedContent | null> {
  if (!slug) return null;

  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const all = await getAllUnifiedContent();

  return (
    all.find((d) => {
      if (!d.published || !d.slug) return false;

      const s = d.slug.replace(/^\/+|\/+$/g, "");
      if (s === normalized) return true;

      // Also allow direct book slug match, e.g. "sample-book"
      if (d.type === "book" && s === `books/${normalized}`) return true;

      return false;
    }) || null
  );
}

/**
 * Get items by type (print, blog, document, page, book).
 */
export async function getUnifiedContentByType(
  type: UnifiedContent["type"]
): Promise<UnifiedContent[]> {
  const all = await getAllUnifiedContent();
  return all.filter((d) => d.type === type && d.published);
}

/**
 * Convenience default export.
 */
const unifiedContent = {
  getAllUnifiedContent,
  getUnifiedContentBySlug,
  getUnifiedContentByType,
};

export default unifiedContent;
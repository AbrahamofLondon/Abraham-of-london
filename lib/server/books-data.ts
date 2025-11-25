// lib/server/books-data.ts
// Books under content/books/*

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
  };

type BookishMdxDocument = MdxDocument &
  { content: string } &
  Partial<SharedBookMeta>;

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
  value: unknown,
): "draft" | "published" | "scheduled" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled") {
    return value;
  }
  return undefined;
}

/**
 * Map generic MDX meta into a fully shaped BookMeta.
 * We assume MDX frontmatter matches a subset of SharedBookMeta.
 */
function fromMdxMeta(meta: MdxMeta): BookMeta {
  const m = meta as BookishMdxMeta;

  // Handle different date fields - prefer date, then publishDate
  const date = safeString(m.date) || safeString(m.publishDate);

  return {
    // Core identifiers
    slug: safeString(m.slug) || "",
    title: safeString(m.title) || "Untitled",

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
    format: safeString(m.format) as
      | "hardcover"
      | "paperback"
      | "ebook"
      | "audiobook"
      | undefined,

    // Status – enforce union type
    status: safeStatus(m.status),
  };
}

/**
 * Attach MDX content to a typed BookMeta.
 */
function fromMdxDocument(doc: MdxDocument): BookWithContent {
  const bookDoc = doc as BookishMdxDocument;
  const { content, ...rest } = bookDoc;
  const meta = fromMdxMeta(rest);
  return { ...meta, content: typeof content === "string" ? content : "" };
}

/**
 * All books – meta only.
 */
export function getAllBooksMeta(): BookMeta[] {
  const metas = getMdxCollectionMeta("books");
  return metas.map((m) => fromMdxMeta(m));
}

/**
 * Single book – meta + content.
 */
export function getBookBySlug(slug: string): BookWithContent | null {
  const doc = getMdxDocumentBySlug("books", slug);
  return doc ? fromMdxDocument(doc) : null;
}
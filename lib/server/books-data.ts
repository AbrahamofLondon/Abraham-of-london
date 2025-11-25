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

// Mdx meta that may also carry book-specific fields defined in SharedBookMeta
type BookishMdxMeta = MdxMeta & Partial<SharedBookMeta>;
type BookishMdxDocument = MdxDocument & { content: string } & Partial<SharedBookMeta>;

const orNull = <T>(value: T | undefined | null): T | null =>
  value ?? null;

/**
 * Map generic MDX meta into a fully shaped BookMeta.
 * We assume MDX frontmatter matches a subset of SharedBookMeta.
 */
function fromMdxMeta(meta: MdxMeta): BookMeta {
  const m = meta as BookishMdxMeta;

  return {
    // Core identifiers
    slug: orNull(m.slug),
    title: orNull(m.title),
    subtitle: orNull(m.subtitle),
    description: orNull(m.description),

    // Dates
    date: orNull(m.date),
    lastModified: orNull(m.lastModified),
    publishedDate: orNull(m.publishedDate),

    // Display / categorisation
    excerpt: orNull(m.excerpt),
    coverImage: m.coverImage ?? null,
    category: orNull(m.category),
    tags: m.tags ?? null,
    draft: m.draft ?? null,
    featured: m.featured ?? null,
    status: orNull(m.status),

    // Book-specific fields
    author: orNull(m.author),
    readTime: m.readTime ?? null,
    isbn: orNull(m.isbn),
    publisher: orNull(m.publisher),
    pages: m.pages ?? null,
    language: orNull(m.language),
    format: orNull(m.format),
    price: orNull(m.price),
    purchaseLink: orNull(m.purchaseLink),
    rating: m.rating ?? null,
  };
}

/**
 * Attach MDX content to a typed BookMeta.
 */
function fromMdxDocument(doc: MdxDocument): BookWithContent {
  const bookDoc = doc as BookishMdxDocument;
  const { content, ...rest } = bookDoc;
  const meta = fromMdxMeta(rest);
  return { ...meta, content };
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
// lib/server/unified-content.ts
// Single source of truth for all content types (blog, events, books, etc.)

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type UnifiedContentType =
  | "blog"
  | "event"
  | "book"
  | "download"
  | "page"
  | "print"
  | "other";

export type UnifiedSource =
  | "mdx"
  | "events"
  | "books"
  | "downloads"
  | "static"
  | "unknown";

export interface PrintSettings {
  pageSize?: "A4" | "A5" | "letter" | "legal";
  marginsMm?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface UnifiedContent {
  slug: string;
  title: string;
  type: UnifiedContentType;

  content?: ReactNode;

  description?: string;
  author?: string;
  date?: string | Date;
  updatedAt?: string | Date;

  category?: string;
  tags?: string[];

  printSettings?: PrintSettings;

  seoTitle?: string;
  seoDescription?: string;

  source: UnifiedSource;
  published: boolean;
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function cleanSlug(raw: unknown): string {
  const s = (raw || "").toString().trim();
  return s.replace(/^\/+|\/+$/g, "");
}

function normaliseSlug(base: string, prefix?: string): string {
  const clean = cleanSlug(base);
  if (!prefix) return clean;
  return clean.startsWith(`${prefix}/`) ? clean : `${prefix}/${clean}`;
}

// Safe dynamic import – returns null instead of throwing on build
async function safeImport<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// MDX / BLOG CONTENT
// ---------------------------------------------------------------------------

async function getMdxContent(): Promise<UnifiedContent[]> {
  // ⚠️ Adapt this to your real blog source if needed
  // e.g. `@/lib/posts`, `contentlayer/generated`, etc.
  const postsModule = await safeImport(() => import("@/lib/posts" as string));
  if (!postsModule) return [];

  const getAllPosts = (postsModule as any).getAllPosts as
    | (() => Promise<any[]>)
    | undefined;

  if (!getAllPosts) return [];

  const posts = await getAllPosts();

  return posts.map((post: any): UnifiedContent => {
    const slug = normaliseSlug(post.slug || post._id || "", "blog");

    return {
      slug,
      title: post.title || slug,
      type: "blog",

      content: post.body || post.content || undefined,
      description:
        post.excerpt ||
        post.description ||
        (post.summary as string | undefined) ||
        undefined,

      author: post.author || undefined,
      date: post.date || post.publishedAt || undefined,
      updatedAt: post.updatedAt || undefined,
      category: post.category || undefined,
      tags: post.tags || undefined,

      printSettings: undefined,

      seoTitle: post.seoTitle || post.title || undefined,
      seoDescription:
        post.seoDescription ||
        post.excerpt ||
        post.description ||
        undefined,

      source: "mdx",
      published: (post.status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// EVENTS CONTENT
// ---------------------------------------------------------------------------

async function getEventContent(): Promise<UnifiedContent[]> {
  const eventsModule = await safeImport(() => import("@/lib/events" as string));
  if (!eventsModule) return [];

  const getAllEvents = (eventsModule as any).getAllEvents as
    | (() => Promise<any[]>)
    | undefined;

  if (!getAllEvents) return [];

  const events = await getAllEvents();

  return events.map((event: any): UnifiedContent => {
    const rawSlug = event.slug || event.id || event._id || event.title || "";
    const slug = normaliseSlug(rawSlug, "events");

    return {
      slug,
      title: event.title || slug,
      type: "event",

      content: event.body || event.description || undefined,
      description: event.excerpt || event.summary || event.description || undefined,

      author: event.speaker || event.host || undefined,
      date: event.date || event.startDate || undefined,
      updatedAt: event.updatedAt || undefined,
      category: event.category || event.type || undefined,
      tags: event.tags || undefined,

      printSettings: undefined,

      seoTitle: event.seoTitle || event.title || undefined,
      seoDescription:
        event.seoDescription ||
        event.excerpt ||
        event.summary ||
        event.description ||
        undefined,

      source: "events",
      published: (event.status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// BOOKS CONTENT
// ---------------------------------------------------------------------------

async function getBookContent(): Promise<UnifiedContent[]> {
  const booksModule = await safeImport(() => import("@/lib/books" as string));
  if (!booksModule) return [];

  const getAllBooks = (booksModule as any).getAllBooks as
    | (() => Promise<any[]>)
    | undefined;

  if (!getAllBooks) return [];

  const books = await getAllBooks();

  return books.map((book: any): UnifiedContent => {
    const rawSlug = book.slug || book.id || book._id || book.title || "";
    const slug = normaliseSlug(rawSlug, "books");

    return {
      slug,
      title: book.title || slug,
      type: "book",

      content: book.body || book.description || undefined,
      description: book.excerpt || book.description || undefined,

      author: book.author || book.primaryAuthor || undefined,
      date: book.publishedAt || book.date || undefined,
      updatedAt: book.updatedAt || undefined,
      category: book.category || undefined,
      tags: book.tags || undefined,

      printSettings: book.printSettings || undefined,

      seoTitle: book.seoTitle || book.title || undefined,
      seoDescription:
        book.seoDescription ||
        book.excerpt ||
        book.description ||
        undefined,

      source: "books",
      published: (book.status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// OTHER SOURCES (DOWNLOADS / STATIC PRINTS / ETC.)
// ---------------------------------------------------------------------------

async function getDownloadContent(): Promise<UnifiedContent[]> {
  const downloadsModule = await safeImport(
    () => import("@/lib/downloads" as string),
  );
  if (!downloadsModule) return [];

  const getAllDownloads = (downloadsModule as any).getAllDownloads as
    | (() => Promise<any[]>)
    | undefined;

  if (!getAllDownloads) return [];

  const downloads = await getAllDownloads();

  return downloads.map((d: any): UnifiedContent => {
    const rawSlug = d.slug || d.id || d._id || d.title || "";
    const slug = normaliseSlug(rawSlug, "downloads");

    return {
      slug,
      title: d.title || slug,
      type: "download",

      content: d.body || d.description || undefined,
      description: d.excerpt || d.description || undefined,

      author: d.author || undefined,
      date: d.date || d.publishedAt || undefined,
      updatedAt: d.updatedAt || undefined,
      category: d.category || undefined,
      tags: d.tags || undefined,

      printSettings: d.printSettings || undefined,

      seoTitle: d.seoTitle || d.title || undefined,
      seoDescription:
        d.seoDescription ||
        d.excerpt ||
        d.description ||
        undefined,

      source: "downloads",
      published: (d.status ?? "published") !== "draft",
    };
  });
}

// Example static / hard-coded printables, if you want them:
async function getStaticPrintContent(): Promise<UnifiedContent[]> {
  return [
    // Add or remove as you like
    // {
    //   slug: "print/fathering-without-fear-teaser-mobile",
    //   title: "Fathering Without Fear – Teaser (Print)",
    //   type: "print",
    //   content: "Printable layout is rendered via a dedicated React component.",
    //   description: "Static print entry to help unify routing.",
    //   source: "static",
    //   published: true,
    // },
  ];
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function getUnifiedContent(): Promise<UnifiedContent[]> {
  const [mdx, events, books, downloads, statics] = await Promise.all([
    getMdxContent(),
    getEventContent(),
    getBookContent(),
    getDownloadContent(),
    getStaticPrintContent(),
  ]);

  return [...mdx, ...events, ...books, ...downloads, ...statics];
}

// Alias for older callers (e.g. pages/content/index.tsx)
export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  return getUnifiedContent();
}

export async function getUnifiedContentBySlug(
  rawSlug: string,
): Promise<UnifiedContent | null> {
  const target = cleanSlug(rawSlug);
  const all = await getUnifiedContent();

  // Try exact match first
  const match =
    all.find((item) => cleanSlug(item.slug) === target) ??
    // Graceful fallback: ignore leading prefixes if needed
    all.find((item) => cleanSlug(item.slug).endsWith(`/${target}`));

  return match ?? null;
}
// lib/server/unified-content.ts
// Single source of truth for all content types (blog, events, books, downloads, resources, etc.)

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type UnifiedContentType =
  | "blog"
  | "event"
  | "book"
  | "download"
  | "resource"
  | "page"
  | "print"
  | "other";

export type UnifiedSource =
  | "mdx"
  | "events"
  | "books"
  | "downloads"
  | "resources"
  | "static"
  | "unknown";

export interface PrintSettings {
  pageSize?: "A4" | "A5" | "letter" | "legal";
  marginsMm?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface UnifiedContent {
  slug: string; // full route slug: e.g. "blog/when-the-storm-finds-you"
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

async function safeImport<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function resolveMaybeAsync<T>(fn?: () => T | Promise<T>): Promise<T | null> {
  if (!fn) return null;
  try {
    return await Promise.resolve(fn());
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// BLOG CONTENT  →  /blog/[slug]
// ---------------------------------------------------------------------------

async function getMdxContent(): Promise<UnifiedContent[]> {
  const postsModule = await safeImport(
    () => import("@/lib/server/posts-data" as string),
  );
  if (!postsModule) return [];

  const getAllPosts = (postsModule as any).getAllPosts as
    | (() => any[] | Promise<any[]>)
    | undefined;

  const posts = (await resolveMaybeAsync(getAllPosts)) ?? [];

  return posts.map((post: any): UnifiedContent => {
    const rawSlug = post.slug || post._id || "";
    const slug = normaliseSlug(rawSlug, "blog");

    return {
      slug,
      title: post.title || slug,
      type: "blog",

      content: post.content || undefined,
      description:
        post.excerpt ||
        post.description ||
        (post.summary as string | undefined) ||
        undefined,

      author: post.author || undefined,
      date: post.date || post.publishedAt || undefined,
      updatedAt: post.updated || post.updatedAt || undefined,
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
      published: (post.draft ?? false) !== true,
    };
  });
}

// ---------------------------------------------------------------------------
// EVENTS CONTENT  →  /events/[slug]
// ---------------------------------------------------------------------------

async function getEventContent(): Promise<UnifiedContent[]> {
  const eventsModule = await safeImport(
    () => import("@/lib/server/events-data" as string),
  );
  if (!eventsModule) return [];

  const getAllEvents = (eventsModule as any).getAllEvents as
    | (() => any[] | Promise<any[]>)
    | undefined;

  const events = (await resolveMaybeAsync(getAllEvents)) ?? [];

  return events.map((event: any): UnifiedContent => {
    const rawSlug = event.slug || event.id || event._id || event.title || "";
    const slug = normaliseSlug(rawSlug, "events");

    return {
      slug,
      title: event.title || slug,
      type: "event",

      content: event.content || event.description || undefined,
      description:
        event.excerpt || event.summary || event.description || undefined,

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
// BOOKS CONTENT  →  /books/[slug]
// ---------------------------------------------------------------------------

async function getBookContent(): Promise<UnifiedContent[]> {
  const booksModule = await safeImport(
    () => import("@/lib/server/books-data" as string),
  );
  if (!booksModule) return [];

  const getAllBooksMeta = (booksModule as any)
    .getAllBooksMeta as (() => any[] | Promise<any[]>) | undefined;

  const books = (await resolveMaybeAsync(getAllBooksMeta)) ?? [];

  return books.map((book: any): UnifiedContent => {
    const rawSlug = book.slug || book.id || book._id || book.title || "";
    const slug = normaliseSlug(rawSlug, "books");

    return {
      slug,
      title: book.title || slug,
      type: "book",

      content: undefined, // meta only here; body is handled in /books/[slug]
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
// DOWNLOADS CONTENT  →  /downloads/[slug]
// (adjust imports to your actual downloads module)
// ---------------------------------------------------------------------------

async function getDownloadContent(): Promise<UnifiedContent[]> {
  const downloadsModule = await safeImport(
    () => import("@/lib/server/downloads-data" as string),
  );
  if (!downloadsModule) return [];

  const getAllDownloads = (downloadsModule as any)
    .getAllDownloadsMeta as (() => any[] | Promise<any[]>) | undefined;

  const downloads = (await resolveMaybeAsync(getAllDownloads)) ?? [];

  return downloads.map((d: any): UnifiedContent => {
    const rawSlug = d.slug || d.id || d._id || d.title || "";
    const slug = normaliseSlug(rawSlug, "downloads");

    return {
      slug,
      title: d.title || slug,
      type: "download",

      content: undefined,
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

// ---------------------------------------------------------------------------
// RESOURCES CONTENT  →  /resources/[slug]
// (adjust imports to actual resources module)
// ---------------------------------------------------------------------------

async function getResourceContent(): Promise<UnifiedContent[]> {
  const resourcesModule = await safeImport(
    () => import("@/lib/server/resources-data" as string),
  );
  if (!resourcesModule) return [];

  const getAllResources = (resourcesModule as any)
    .getAllResourcesMeta as (() => any[] | Promise<any[]>) | undefined;

  const resources = (await resolveMaybeAsync(getAllResources)) ?? [];

  return resources.map((r: any): UnifiedContent => {
    const rawSlug = r.slug || r.id || r._id || r.title || "";
    const slug = normaliseSlug(rawSlug, "resources");

    return {
      slug,
      title: r.title || slug,
      type: "resource",

      content: undefined,
      description: r.excerpt || r.description || undefined,

      author: r.author || undefined,
      date: r.date || r.publishedAt || undefined,
      updatedAt: r.updatedAt || undefined,
      category: r.category || undefined,
      tags: r.tags || undefined,

      printSettings: r.printSettings || undefined,

      seoTitle: r.seoTitle || r.title || undefined,
      seoDescription:
        r.seoDescription ||
        r.excerpt ||
        r.description ||
        undefined,

      source: "resources",
      published: (r.status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// STATIC / HARD-CODED PRINTABLES
// ---------------------------------------------------------------------------

async function getStaticPrintContent(): Promise<UnifiedContent[]> {
  return [
    // Add static print entries here if you need them
  ];
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function getUnifiedContent(): Promise<UnifiedContent[]> {
  const [mdx, events, books, downloads, resources, statics] =
    await Promise.all([
      getMdxContent(),
      getEventContent(),
      getBookContent(),
      getDownloadContent(),
      getResourceContent(),
      getStaticPrintContent(),
    ]);

  return [...mdx, ...events, ...books, ...downloads, ...resources, ...statics];
}

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  return getUnifiedContent();
}

export async function getUnifiedContentBySlug(
  rawSlug: string,
): Promise<UnifiedContent | null> {
  const target = cleanSlug(rawSlug);
  const all = await getUnifiedContent();

  const match =
    all.find((item) => cleanSlug(item.slug) === target) ??
    all.find((item) => cleanSlug(item.slug).endsWith(`/${target}`));

  return match ?? null;
}
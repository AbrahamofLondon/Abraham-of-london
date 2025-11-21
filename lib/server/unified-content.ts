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
  | "pages"
  | "print"
  | "static"
  | "unknown";

export interface PrintSettings {
  pageSize?: "A4" | "A5" | "letter" | "legal";
  marginsMm?: number;
  showHeader?: boolean;
  showFooter?: boolean;
}

export interface UnifiedContent {
  /** Full route-oriented slug, e.g. "blog/when-the-storm-finds-you" */
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

      content: undefined, // meta only; full body loaded in /books/[slug]
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
// ---------------------------------------------------------------------------

async function getDownloadContent(): Promise<UnifiedContent[]> {
  const downloadsModule = await safeImport(
    () => import("@/lib/server/downloads-data" as string),
  );
  if (!downloadsModule) return [];

  // adjust this name if your module exports a different function
  const getAllDownloadsMeta = (downloadsModule as any)
    .getAllDownloadsMeta as (() => any[] | Promise<any[]>) | undefined;

  const downloads = (await resolveMaybeAsync(getAllDownloadsMeta)) ?? [];

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
// (wired to lib/server/resources-data.ts you just showed)
// ---------------------------------------------------------------------------

async function getResourceContent(): Promise<UnifiedContent[]> {
  const resourcesModule = await safeImport(
    () => import("@/lib/server/resources-data" as string),
  );
  if (!resourcesModule) return [];

  const getAllResources = (resourcesModule as any)
    .getAllResources as (() => any[] | Promise<any[]>) | undefined;

  const resources = (await resolveMaybeAsync(getAllResources)) ?? [];

  return resources.map((r: any): UnifiedContent => {
    const rawSlug = r.slug || r.id || r._id || r.title || "";
    const slug = normaliseSlug(rawSlug, "resources");

    return {
      slug,
      title: r.title || slug,
      type: "resource",

      content: r.content || undefined,
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
// PAGES CONTENT  →  /[slug]
// (from lib/server/pages-data.ts – about, contact, etc.)
// ---------------------------------------------------------------------------

async function getPageContent(): Promise<UnifiedContent[]> {
  const pagesModule = await safeImport(
    () => import("@/lib/server/pages-data" as string),
  );
  if (!pagesModule) return [];

  const getPageSlugs = (pagesModule as any).getPageSlugs as
    | (() => string[])
    | undefined;
  const getPageBySlug = (pagesModule as any).getPageBySlug as
    | ((slug: string, fields?: string[]) => any)
    | undefined;

  if (!getPageSlugs || !getPageBySlug) return [];

  const slugs = getPageSlugs();
  const pages = slugs
    .map((slug) => getPageBySlug(slug, ["slug", "title", "description"]))
    .filter(Boolean);

  return pages.map((p: any): UnifiedContent => {
    const slug = cleanSlug(p.slug || "");
    return {
      slug, // route: "/about", "/contact", etc.
      title: p.title || slug,
      type: "page",

      content: undefined, // rendered by dedicated /[slug] page
      description: p.description || undefined,

      author: undefined,
      date: undefined,
      updatedAt: undefined,
      category: undefined,
      tags: undefined,

      printSettings: undefined,

      seoTitle: p.seoTitle || p.title || undefined,
      seoDescription: p.seoDescription || p.description || undefined,

      source: "pages",
      published: true,
    };
  });
}

// ---------------------------------------------------------------------------
// PRINT CONTENT  →  /print/[slug]
// (from lib/print-utils.ts)
// ---------------------------------------------------------------------------

async function getPrintContent(): Promise<UnifiedContent[]> {
  const printModule = await safeImport(
    () => import("@/lib/print-utils" as string),
  );
  if (!printModule) return [];

  const getAllPrintDocuments = (printModule as any)
    .getAllPrintDocuments as (() => any[] | Promise<any[]>) | undefined;

  const docs = (await resolveMaybeAsync(getAllPrintDocuments)) ?? [];

  return docs.map((d: any): UnifiedContent => {
    const rawSlug = d.slug || d._id || d.title || "";
    const slug = normaliseSlug(rawSlug, "print");

    return {
      slug,
      title: d.title || slug,
      type: "print",

      content: d.content || undefined,
      description: d.excerpt || undefined,

      author: undefined,
      date: d.date || undefined,
      updatedAt: undefined,
      category: undefined,
      tags: d.tags || undefined,

      printSettings: undefined,

      seoTitle: d.seoTitle || d.title || undefined,
      seoDescription: d.seoDescription || d.excerpt || undefined,

      source: "print",
      published: true,
    };
  });
}

// ---------------------------------------------------------------------------
// STATIC PLACEHOLDERS (if needed)
// ---------------------------------------------------------------------------

async function getStaticPrintContent(): Promise<UnifiedContent[]> {
  return [];
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function getUnifiedContent(): Promise<UnifiedContent[]> {
  const [mdx, events, books, downloads, resources, pages, prints, statics] =
    await Promise.all([
      getMdxContent(),
      getEventContent(),
      getBookContent(),
      getDownloadContent(),
      getResourceContent(),
      getPageContent(),
      getPrintContent(),
      getStaticPrintContent(),
    ]);

  return [
    ...mdx,
    ...events,
    ...books,
    ...downloads,
    ...resources,
    ...pages,
    ...prints,
    ...statics,
  ];
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
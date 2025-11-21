// lib/server/unified-content.ts
// Unified content loader — safe for static export / Netlify builds.

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

// Internal loose object type (no `any`)
type ContentLike = Record<string, unknown>;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function cleanSlug(raw: unknown): string {
  return (raw || "")
    .toString()
    .trim()
    .replace(/^\/+|\/+$/g, "");
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

// Generic “maybe async” resolver
async function resolveMaybeAsync<T>(
  fn?: () => T | Promise<T>,
): Promise<T | null> {
  if (!fn) return null;
  try {
    return await Promise.resolve(fn());
  } catch {
    return null;
  }
}

// Safely coerce to array of ContentLike
function toContentArray(value: unknown): ContentLike[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ContentLike =>
      !!item && typeof item === "object",
  );
}

// Field readers (no `any`, runtime-guarded)
function getString(obj: ContentLike, key: string): string | undefined {
  const v = obj[key];
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function getDateLike(
  obj: ContentLike,
  key: string,
): string | Date | undefined {
  const v = obj[key];
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function getStringArray(
  obj: ContentLike,
  key: string,
): string[] | undefined {
  const v = obj[key];
  if (!Array.isArray(v)) return undefined;
  const filtered = v.filter(
    (item): item is string => typeof item === "string",
  );
  return filtered.length > 0 ? filtered : undefined;
}

function getBoolean(obj: ContentLike, key: string): boolean | undefined {
  const v = obj[key];
  return typeof v === "boolean" ? v : undefined;
}

// ---------------------------------------------------------------------------
// BLOG CONTENT  →  /blog/[slug]
// ---------------------------------------------------------------------------

async function getMdxContent(): Promise<UnifiedContent[]> {
  const postsModule = await safeImport(
    () => import("@/lib/server/posts-data" as string),
  );
  if (!postsModule) return [];

  const getAllPosts =
    (postsModule as { getAllPosts?: () => ContentLike[] | Promise<ContentLike[]> })
      .getAllPosts;

  const postsRaw = await resolveMaybeAsync<ContentLike[] | unknown>(getAllPosts);
  const posts = toContentArray(postsRaw ?? []);

  return posts.map((post): UnifiedContent => {
    const rawSlug =
      getString(post, "slug") ?? getString(post, "_id") ?? "";
    const slug = normaliseSlug(rawSlug, "blog");

    const draft = getBoolean(post, "draft");

    return {
      slug,
      title: getString(post, "title") ?? slug,
      type: "blog",

      content: (post["content"] as ReactNode | undefined) ?? undefined,
      description:
        getString(post, "excerpt") ??
        getString(post, "description") ??
        getString(post, "summary"),

      author: getString(post, "author"),
      date:
        getDateLike(post, "date") ??
        getDateLike(post, "publishedAt"),
      updatedAt:
        getDateLike(post, "updated") ??
        getDateLike(post, "updatedAt"),
      category: getString(post, "category"),
      tags: getStringArray(post, "tags"),

      printSettings: undefined,

      seoTitle:
        getString(post, "seoTitle") ??
        getString(post, "title") ??
        slug,
      seoDescription:
        getString(post, "seoDescription") ??
        getString(post, "excerpt") ??
        getString(post, "description"),

      source: "mdx",
      published: draft !== true,
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

  const getAllEvents =
    (eventsModule as { getAllEvents?: () => ContentLike[] | Promise<ContentLike[]> })
      .getAllEvents;

  const eventsRaw = await resolveMaybeAsync<ContentLike[] | unknown>(
    getAllEvents,
  );
  const events = toContentArray(eventsRaw ?? []);

  return events.map((event): UnifiedContent => {
    const rawSlug =
      getString(event, "slug") ??
      getString(event, "id") ??
      getString(event, "_id") ??
      getString(event, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "events");

    const status = getString(event, "status");

    return {
      slug,
      title: getString(event, "title") ?? slug,
      type: "event",

      content:
        (event["content"] as ReactNode | undefined) ??
        getString(event, "description"),
      description:
        getString(event, "excerpt") ??
        getString(event, "summary") ??
        getString(event, "description"),

      author:
        getString(event, "speaker") ??
        getString(event, "host"),
      date:
        getDateLike(event, "date") ??
        getDateLike(event, "startDate"),
      updatedAt: getDateLike(event, "updatedAt"),
      category:
        getString(event, "category") ??
        getString(event, "type"),
      tags: getStringArray(event, "tags"),

      printSettings: undefined,

      seoTitle:
        getString(event, "seoTitle") ??
        getString(event, "title") ??
        slug,
      seoDescription:
        getString(event, "seoDescription") ??
        getString(event, "excerpt") ??
        getString(event, "summary") ??
        getString(event, "description"),

      source: "events",
      published: (status ?? "published") !== "draft",
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

  const getAllBooksMeta =
    (booksModule as { getAllBooksMeta?: () => ContentLike[] | Promise<ContentLike[]> })
      .getAllBooksMeta;

  const booksRaw = await resolveMaybeAsync<ContentLike[] | unknown>(
    getAllBooksMeta,
  );
  const books = toContentArray(booksRaw ?? []);

  return books.map((book): UnifiedContent => {
    const rawSlug =
      getString(book, "slug") ??
      getString(book, "id") ??
      getString(book, "_id") ??
      getString(book, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "books");

    const status = getString(book, "status");

    return {
      slug,
      title: getString(book, "title") ?? slug,
      type: "book",

      content: undefined, // meta only; full body loaded in /books/[slug]
      description:
        getString(book, "excerpt") ??
        getString(book, "description"),

      author:
        getString(book, "author") ??
        getString(book, "primaryAuthor"),
      date:
        getDateLike(book, "publishedAt") ??
        getDateLike(book, "date"),
      updatedAt: getDateLike(book, "updatedAt"),
      category: getString(book, "category"),
      tags: getStringArray(book, "tags"),

      printSettings: book["printSettings"] as PrintSettings | undefined,

      seoTitle:
        getString(book, "seoTitle") ??
        getString(book, "title") ??
        slug,
      seoDescription:
        getString(book, "seoDescription") ??
        getString(book, "excerpt") ??
        getString(book, "description"),

      source: "books",
      published: (status ?? "published") !== "draft",
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

  const getAllDownloadsMeta =
    (downloadsModule as {
      getAllDownloadsMeta?: () => ContentLike[] | Promise<ContentLike[]>;
    }).getAllDownloadsMeta;

  const downloadsRaw = await resolveMaybeAsync<ContentLike[] | unknown>(
    getAllDownloadsMeta,
  );
  const downloads = toContentArray(downloadsRaw ?? []);

  return downloads.map((d): UnifiedContent => {
    const rawSlug =
      getString(d, "slug") ??
      getString(d, "id") ??
      getString(d, "_id") ??
      getString(d, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "downloads");

    const status = getString(d, "status");

    return {
      slug,
      title: getString(d, "title") ?? slug,
      type: "download",

      content: undefined,
      description:
        getString(d, "excerpt") ??
        getString(d, "description"),

      author: getString(d, "author"),
      date:
        getDateLike(d, "date") ??
        getDateLike(d, "publishedAt"),
      updatedAt: getDateLike(d, "updatedAt"),
      category: getString(d, "category"),
      tags: getStringArray(d, "tags"),

      printSettings: d["printSettings"] as PrintSettings | undefined,

      seoTitle:
        getString(d, "seoTitle") ??
        getString(d, "title") ??
        slug,
      seoDescription:
        getString(d, "seoDescription") ??
        getString(d, "excerpt") ??
        getString(d, "description"),

      source: "downloads",
      published: (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// RESOURCES CONTENT  →  /resources/[slug]
// ---------------------------------------------------------------------------

async function getResourceContent(): Promise<UnifiedContent[]> {
  const resourcesModule = await safeImport(
    () => import("@/lib/server/resources-data" as string),
  );
  if (!resourcesModule) return [];

  const getAllResources =
    (resourcesModule as {
      getAllResources?: () => ContentLike[] | Promise<ContentLike[]>;
    }).getAllResources;

  const resourcesRaw = await resolveMaybeAsync<ContentLike[] | unknown>(
    getAllResources,
  );
  const resources = toContentArray(resourcesRaw ?? []);

  return resources.map((r): UnifiedContent => {
    const rawSlug =
      getString(r, "slug") ??
      getString(r, "id") ??
      getString(r, "_id") ??
      getString(r, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "resources");

    const status = getString(r, "status");

    return {
      slug,
      title: getString(r, "title") ?? slug,
      type: "resource",

      content: (r["content"] as ReactNode | undefined) ?? undefined,
      description:
        getString(r, "excerpt") ??
        getString(r, "description"),

      author: getString(r, "author"),
      date:
        getDateLike(r, "date") ??
        getDateLike(r, "publishedAt"),
      updatedAt: getDateLike(r, "updatedAt"),
      category: getString(r, "category"),
      tags: getStringArray(r, "tags"),

      printSettings: r["printSettings"] as PrintSettings | undefined,

      seoTitle:
        getString(r, "seoTitle") ??
        getString(r, "title") ??
        slug,
      seoDescription:
        getString(r, "seoDescription") ??
        getString(r, "excerpt") ??
        getString(r, "description"),

      source: "resources",
      published: (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// PAGES CONTENT  →  /[slug]
// ---------------------------------------------------------------------------

async function getPageContent(): Promise<UnifiedContent[]> {
  const pagesModule = await safeImport(
    () => import("@/lib/server/pages-data" as string),
  );
  if (!pagesModule) return [];

  const getPageSlugs =
    (pagesModule as { getPageSlugs?: () => string[] }).getPageSlugs;
  const getPageBySlug =
    (pagesModule as {
      getPageBySlug?: (slug: string, fields?: string[]) => ContentLike;
    }).getPageBySlug;

  if (!getPageSlugs || !getPageBySlug) return [];

  const slugs = getPageSlugs();
  const pages = slugs
    .map((slug) =>
      getPageBySlug(slug, ["slug", "title", "description", "seoTitle", "seoDescription"]),
    )
    .filter((p): p is ContentLike => !!p);

  return pages.map((p): UnifiedContent => {
    const slug = cleanSlug(getString(p, "slug") ?? "");

    return {
      slug,
      title: getString(p, "title") ?? slug,
      type: "page",

      content: undefined,
      description: getString(p, "description"),

      author: undefined,
      date: undefined,
      updatedAt: undefined,
      category: undefined,
      tags: undefined,

      printSettings: undefined,

      seoTitle:
        getString(p, "seoTitle") ??
        getString(p, "title") ??
        slug,
      seoDescription:
        getString(p, "seoDescription") ??
        getString(p, "description"),

      source: "pages",
      published: true,
    };
  });
}

// ---------------------------------------------------------------------------
// PRINT CONTENT  →  /print/[slug] (placeholder for now)
// ---------------------------------------------------------------------------

async function getPrintContent(): Promise<UnifiedContent[]> {
  // Intentionally returns [] until a real print-utils implementation
  // is wired in without causing module-resolution failures.
  return [];
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  const [mdx, events, books, downloads, resources, pages, prints] =
    await Promise.all([
      getMdxContent(),
      getEventContent(),
      getBookContent(),
      getDownloadContent(),
      getResourceContent(),
      getPageContent(),
      getPrintContent(),
    ]);

  return [
    ...mdx,
    ...events,
    ...books,
    ...downloads,
    ...resources,
    ...pages,
    ...prints,
  ];
}

export async function getUnifiedContentBySlug(
  rawSlug: string,
): Promise<UnifiedContent | null> {
  const target = cleanSlug(rawSlug);
  const all = await getAllUnifiedContent();

  const match =
    all.find((item) => cleanSlug(item.slug) === target) ??
    all.find((item) => cleanSlug(item.slug).endsWith(`/${target}`));

  return match ?? null;
}
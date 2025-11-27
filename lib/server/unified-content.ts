// lib/server/unified-content.ts
// Unified content loader — built directly on Contentlayer.
// Safe for static export / Netlify builds (no fs, no window/document).

import type { ReactNode } from "react";
import {
  allPosts,
  allEvents,
  allBooks,
  allDownloads,
  allResources,
  allPrints,
  allCanons,
  allStrategies,
} from "contentlayer/generated";

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
  | "canon"
  | "other";

export type UnifiedSource =
  | "posts"
  | "events"
  | "books"
  | "downloads"
  | "resources"
  | "prints"
  | "canon"
  | "strategies"
  | "pages"
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

// Generic “maybe async” resolver – used only for legacy pages-data
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

// Legacy safe importer – used only for pages-data
async function safeImport<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// BLOG CONTENT  →  /blog/[slug]
// ---------------------------------------------------------------------------

async function getMdxContent(): Promise<UnifiedContent[]> {
  const posts = toContentArray(allPosts as unknown as ContentLike[]);

  return posts.map((post): UnifiedContent => {
    const rawSlug =
      getString(post, "slug") ?? getString(post, "_id") ?? "";
    const slug = normaliseSlug(rawSlug, "blog");
    const draft = getBoolean(post, "draft");

    const title = getString(post, "title") ?? slug;
    const excerpt =
      getString(post, "excerpt") ??
      getString(post, "description") ??
      getString(post, "summary");

    const seoTitle =
      getString(post, "ogTitle") ??
      title;
    const seoDescription =
      getString(post, "ogDescription") ??
      excerpt ??
      getString(post, "socialCaption");

    return {
      slug,
      title,
      type: "blog",

      // unified layer is meta-oriented; MDX body is rendered in page components
      content: undefined,
      description: excerpt,

      author: getString(post, "author"),
      date: getDateLike(post, "date"),
      updatedAt:
        getDateLike(post, "updated") ??
        getDateLike(post, "updatedAt"),
      category: getString(post, "category"),
      tags: getStringArray(post, "tags"),

      printSettings: undefined,

      seoTitle,
      seoDescription,

      source: "posts",
      published: draft !== true,
    };
  });
}

// ---------------------------------------------------------------------------
// EVENTS CONTENT  →  /events/[slug]
// ---------------------------------------------------------------------------

async function getEventContent(): Promise<UnifiedContent[]> {
  const events = toContentArray(allEvents as unknown as ContentLike[]);

  return events.map((event): UnifiedContent => {
    const rawSlug =
      getString(event, "slug") ??
      getString(event, "id") ??
      getString(event, "_id") ??
      getString(event, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "events");

    const title = getString(event, "title") ?? slug;
    const excerpt =
      getString(event, "excerpt") ??
      getString(event, "summary") ??
      getString(event, "description");

    const status = getString(event, "status");

    return {
      slug,
      title,
      type: "event",

      content: undefined,
      description: excerpt,

      author:
        getString(event, "speaker") ??
        getString(event, "host"),
      date:
        getDateLike(event, "eventDate") ??
        getDateLike(event, "date") ??
        getDateLike(event, "startDate"),
      updatedAt: getDateLike(event, "updatedAt"),
      category:
        getString(event, "category") ??
        getString(event, "type"),
      tags: getStringArray(event, "tags"),

      printSettings: undefined,

      seoTitle: title,
      seoDescription: excerpt,

      source: "events",
      published: (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// BOOKS CONTENT  →  /books/[slug]
// ---------------------------------------------------------------------------

async function getBookContent(): Promise<UnifiedContent[]> {
  const books = toContentArray(allBooks as unknown as ContentLike[]);

  return books.map((book): UnifiedContent => {
    const rawSlug =
      getString(book, "slug") ??
      getString(book, "id") ??
      getString(book, "_id") ??
      getString(book, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "books");

    const title = getString(book, "title") ?? slug;
    const excerpt =
      getString(book, "excerpt") ??
      getString(book, "description");

    const status = getString(book, "status");
    const draft = getBoolean(book, "draft");

    return {
      slug,
      title,
      type: "book",

      content: undefined, // meta only; full body loaded in /books/[slug]
      description: excerpt,

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

      seoTitle: title,
      seoDescription: excerpt,

      source: "books",
      published: draft !== true && (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// DOWNLOADS CONTENT  →  /downloads/[slug]
// ---------------------------------------------------------------------------

async function getDownloadContent(): Promise<UnifiedContent[]> {
  const downloads = toContentArray(
    allDownloads as unknown as ContentLike[],
  );

  return downloads.map((d): UnifiedContent => {
    const rawSlug =
      getString(d, "slug") ??
      getString(d, "id") ??
      getString(d, "_id") ??
      getString(d, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "downloads");

    const title = getString(d, "title") ?? slug;
    const excerpt =
      getString(d, "excerpt") ??
      getString(d, "description");

    const status = getString(d, "status");

    return {
      slug,
      title,
      type: "download",

      content: undefined,
      description: excerpt,

      author: getString(d, "author"),
      date:
        getDateLike(d, "date") ??
        getDateLike(d, "publishedAt"),
      updatedAt: getDateLike(d, "updatedAt"),
      category: getString(d, "category"),
      tags: getStringArray(d, "tags"),

      printSettings: d["printSettings"] as PrintSettings | undefined,

      seoTitle: title,
      seoDescription: excerpt,

      source: "downloads",
      published: (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// RESOURCES CONTENT  →  /resources/[slug]
// ---------------------------------------------------------------------------

async function getResourceContent(): Promise<UnifiedContent[]> {
  const resources = toContentArray(
    allResources as unknown as ContentLike[],
  );

  return resources.map((r): UnifiedContent => {
    const rawSlug =
      getString(r, "slug") ??
      getString(r, "id") ??
      getString(r, "_id") ??
      getString(r, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "resources");

    const title = getString(r, "title") ?? slug;
    const excerpt =
      getString(r, "excerpt") ??
      getString(r, "description");

    const status = getString(r, "status");

    return {
      slug,
      title,
      type: "resource",

      content: undefined,
      description: excerpt,

      author: getString(r, "author"),
      date:
        getDateLike(r, "date") ??
        getDateLike(r, "publishedAt"),
      updatedAt: getDateLike(r, "updatedAt"),
      category: getString(r, "category"),
      tags: getStringArray(r, "tags"),

      printSettings: r["printSettings"] as PrintSettings | undefined,

      seoTitle: title,
      seoDescription: excerpt,

      source: "resources",
      published: (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// CANON CONTENT  →  /canon/[slug]
// ---------------------------------------------------------------------------

async function getCanonContent(): Promise<UnifiedContent[]> {
  const canons = toContentArray(allCanons as unknown as ContentLike[]);

  return canons.map((c): UnifiedContent => {
    const rawSlug =
      getString(c, "slug") ??
      getString(c, "id") ??
      getString(c, "_id") ??
      getString(c, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "canon");

    const title = getString(c, "title") ?? slug;
    const excerpt =
      getString(c, "excerpt") ??
      getString(c, "description");

    const draft = getBoolean(c, "draft");

    return {
      slug,
      title,
      type: "canon",

      content: undefined,
      description: excerpt,

      author: getString(c, "author"),
      date: getDateLike(c, "date"),
      updatedAt: getDateLike(c, "updatedAt"),
      category: undefined,
      tags: getStringArray(c, "tags"),

      printSettings: undefined,

      seoTitle: title,
      seoDescription: excerpt,

      source: "canon",
      published: draft !== true,
    };
  });
}

// ---------------------------------------------------------------------------
// STRATEGY CONTENT  →  /strategy/[slug] (treated as resources in unified view)
// ---------------------------------------------------------------------------

async function getStrategyContent(): Promise<UnifiedContent[]> {
  const strategies = toContentArray(
    allStrategies as unknown as ContentLike[],
  );

  return strategies.map((s): UnifiedContent => {
    const rawSlug =
      getString(s, "slug") ??
      getString(s, "id") ??
      getString(s, "_id") ??
      getString(s, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "strategy");

    const title = getString(s, "title") ?? slug;
    const excerpt =
      getString(s, "excerpt") ??
      getString(s, "description");

    const status = getString(s, "status");

    return {
      slug,
      title,
      type: "resource", // surfaces in content hubs under resources

      content: undefined,
      description: excerpt,

      author: getString(s, "author"),
      date: getDateLike(s, "date"),
      updatedAt: getDateLike(s, "updatedAt"),
      category: getString(s, "category"),
      tags: getStringArray(s, "tags"),

      printSettings: undefined,

      seoTitle: title,
      seoDescription: excerpt,

      source: "strategies",
      published: (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// PAGES CONTENT  →  /[slug]  (legacy MDX pages via pages-data)
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
      getPageBySlug(slug, [
        "slug",
        "title",
        "description",
        "seoTitle",
        "seoDescription",
      ]),
    )
    .filter((p): p is ContentLike => !!p);

  return pages.map((p): UnifiedContent => {
    const slug = cleanSlug(getString(p, "slug") ?? "");
    const title = getString(p, "title") ?? slug;

    return {
      slug,
      title,
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
        title,
      seoDescription:
        getString(p, "seoDescription") ??
        getString(p, "description"),

      source: "pages",
      published: true,
    };
  });
}

// ---------------------------------------------------------------------------
// PRINT CONTENT  →  /prints/[slug]
// ---------------------------------------------------------------------------

async function getPrintContent(): Promise<UnifiedContent[]> {
  const prints = toContentArray(allPrints as unknown as ContentLike[]);

  return prints.map((p): UnifiedContent => {
    const rawSlug =
      getString(p, "slug") ??
      getString(p, "id") ??
      getString(p, "_id") ??
      getString(p, "title") ??
      "";
    const slug = normaliseSlug(rawSlug, "prints");

    const title = getString(p, "title") ?? slug;
    const excerpt =
      getString(p, "excerpt") ??
      getString(p, "description");

    const available = getBoolean(p, "available");
    const status = getString(p, "status");

    return {
      slug,
      title,
      type: "print",

      content: undefined,
      description: excerpt,

      author: undefined,
      date: getDateLike(p, "date"),
      updatedAt: getDateLike(p, "updatedAt"),
      category: undefined,
      tags: getStringArray(p, "tags"),

      printSettings: p["printSettings"] as PrintSettings | undefined,

      seoTitle: title,
      seoDescription: excerpt,

      source: "prints",
      published:
        (available ?? true) &&
        (status ?? "published") !== "draft",
    };
  });
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export async function getAllUnifiedContent(): Promise<UnifiedContent[]> {
  const [
    mdx,
    events,
    books,
    downloads,
    resources,
    strategies,
    canons,
    pages,
    prints,
  ] = await Promise.all([
    getMdxContent(),
    getEventContent(),
    getBookContent(),
    getDownloadContent(),
    getResourceContent(),
    getStrategyContent(),
    getCanonContent(),
    getPageContent(),
    getPrintContent(),
  ]);

  return [
    ...mdx,
    ...events,
    ...books,
    ...downloads,
    ...resources,
    ...strategies,
    ...canons,
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
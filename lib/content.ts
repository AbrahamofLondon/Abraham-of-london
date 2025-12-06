// lib/content.ts

// ============================================================================
// CONTENT CATEGORIES CONSTANTS
// ============================================================================

export const CONTENT_CATEGORIES = {
  POSTS: {
    title: "Strategic Essays",
    description: "Applying first principles to culture, policy, and markets with ruthless pragmatism.",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/10",
    icon: "✒",
  },
  RESOURCES: {
    title: "Execution Tools",
    description: "Playbooks, templates, and frameworks for turning wisdom into action.",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/10",
    icon: "⚙",
  },
  BOOKS: {
    title: "Applied Narratives",
    description: "Memoir, parable, and strategic narrative for men, fathers, and builders.",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/10",
    icon: "📚",
  },
  EVENTS: {
    title: "Strategic Gatherings",
    description: "Workshops, salons, and covenants where decisions — not opinions — are the output.",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/10",
    icon: "🕯",
  },
} as const;

export const SITE_NAME = "Abraham of London";
export const SITE_DESCRIPTION = "Structural thinking for fathers, founders, and builders of legacy.";

// ============================================================================
// IMPORT FROM CONTENTLAYER
// ============================================================================

import {
  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allCanons,
  allStrategies,
  getPublishedDocuments,
  getDocumentBySlug,
  getDocumentsByType,
  type ContentlayerDocument,
  type PostDocument,
  type BookDocument,
  type DownloadDocument,
  type EventDocument,
  type PrintDocument,
  type ResourceDocument,
  type CanonDocument,
  type StrategyDocument,
} from "./contentlayer";

// ============================================================================
// RE-EXPORTS OF RAW COLLECTIONS
// ============================================================================

export {
  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allCanons,
  allStrategies,
};

// ============================================================================
// TYPE ALIASES (for convenience)
// ============================================================================

export type ContentDoc = ContentlayerDocument;
export type Post = PostDocument;
export type Book = BookDocument;
export type Download = DownloadDocument;
export type Event = EventDocument;
export type Print = PrintDocument;
export type Resource = ResourceDocument;
export type Canon = CanonDocument;
export type Strategy = StrategyDocument;

// ============================================================================
// HIGH-LEVEL HELPERS
// ============================================================================

/**
 * All non-draft documents, sorted by date desc.
 */
export function getAllContent(): ContentDoc[] {
  return getPublishedDocuments(allDocuments);
}

/**
 * Get a single document by slug (optionally constrained to a type).
 */
export function getContentBySlug(
  slug: string,
  type?: ContentDoc["type"],
): ContentDoc | undefined {
  return getDocumentBySlug(slug, type);
}

/**
 * Get all non-draft docs by type (e.g. "Post", "Book", "Event").
 */
export function getContentByType<T extends ContentDoc>(
  type: T["type"],
): T[] {
  const docs = getDocumentsByType<T>(type);
  return getPublishedDocuments(docs as ContentDoc[]) as T[];
}

/**
 * Public-facing content only (accessLevel !== "inner-circle").
 */
export function getPublicContent(): ContentDoc[] {
  return getAllContent().filter((doc) => {
    const access = (doc as any).accessLevel ?? "public";
    return access !== "inner-circle";
  });
}

// ============================================================================
// PUBLIC CONTENT GETTERS
// ============================================================================

/**
 * Public posts (accessLevel === "public")
 */
export function getPublicPosts(): Post[] {
  return getContentByType<Post>("Post").filter((post) => {
    const access = (post as any).accessLevel ?? "public";
    return access === "public";
  });
}

/**
 * Public books (accessLevel === "public")
 */
export function getPublicBooks(): Book[] {
  return getContentByType<Book>("Book").filter((book) => {
    const access = (book as any).accessLevel ?? "public";
    return access === "public";
  });
}

/**
 * Public events (accessLevel === "public")
 */
export function getPublicEvents(): Event[] {
  return getContentByType<Event>("Event").filter((event) => {
    const access = (event as any).accessLevel ?? "public";
    return access === "public";
  });
}

/**
 * Public downloads (accessLevel === "public")
 */
export function getPublicDownloads(): Download[] {
  return getContentByType<Download>("Download").filter((dl) => {
    const access = (dl as any).accessLevel ?? "public";
    return access === "public";
  });
}

/**
 * Public canon entries (accessLevel === "public")
 */
export function getPublicCanon(): Canon[] {
  return getContentByType<Canon>("Canon").filter((canon) => {
    const access = (canon as any).accessLevel ?? "public";
    return access === "public";
  });
}

// ============================================================================
// CONTENT-SPECIFIC HELPERS (ADDED)
// ============================================================================

/**
 * Get all non-draft books
 */
export function getAllBooks(): Book[] {
  return getContentByType<Book>("Book");
}

/**
 * Get a book by slug
 */
export function getBookBySlug(slug: string): Book | undefined {
  return getContentBySlug(slug, "Book") as Book | undefined;
}

/**
 * Get all non-draft posts
 */
export function getAllPosts(): Post[] {
  return getContentByType<Post>("Post");
}

/**
 * Get a post by slug
 */
export function getPostBySlug(slug: string): Post | undefined {
  return getContentBySlug(slug, "Post") as Post | undefined;
}

/**
 * Get all non-draft canon entries
 */
export function getAllCanon(): Canon[] {
  return getContentByType<Canon>("Canon");
}

/**
 * Get a canon entry by slug
 */
export function getCanonBySlug(slug: string): Canon | undefined {
  return getContentBySlug(slug, "Canon") as Canon | undefined;
}

/**
 * Get all non-draft downloads
 */
export function getAllDownloads(): Download[] {
  return getContentByType<Download>("Download");
}

/**
 * Get a download by slug
 */
export function getDownloadBySlug(slug: string): Download | undefined {
  return getContentBySlug(slug, "Download") as Download | undefined;
}

/**
 * Get all non-draft events
 */
export function getAllEvents(): Event[] {
  return getContentByType<Event>("Event");
}

/**
 * Get an event by slug
 */
export function getEventBySlug(slug: string): Event | undefined {
  return getContentBySlug(slug, "Event") as Event | undefined;
}

/**
 * Get all non-draft resources
 */
export function getAllResources(): Resource[] {
  return getContentByType<Resource>("Resource");
}

/**
 * Get a resource by slug
 */
export function getResourceBySlug(slug: string): Resource | undefined {
  return getContentBySlug(slug, "Resource") as Resource | undefined;
}
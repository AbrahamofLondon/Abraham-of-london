// lib/contentlayer-helper.ts - FIXED VERSION with correct URLs
import {
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allShorts,
} from "contentlayer/generated";
import type {
  Post as PostType,
  Book as BookType,
  Download as DownloadType,
  Event as EventType,
  Print as PrintType,
  Resource as ResourceType,
  Strategy as StrategyType,
  Canon as CanonType,
  Short as ShortType,
} from "contentlayer/generated";

// ============================================
// TYPE DEFINITIONS - LOWERCASE FOR UI CONSISTENCY
// ============================================

export type DocKind =
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "canon"
  | "short";

export type Post = PostType;
export type Short = ShortType;
export type Book = BookType;
export type Canon = CanonType;
export type Download = DownloadType;
export type Event = EventType;
export type Print = PrintType;
export type Resource = ResourceType;
export type Strategy = StrategyType;

export type AnyDoc =
  | PostType
  | BookType
  | DownloadType
  | EventType
  | PrintType
  | ResourceType
  | StrategyType
  | CanonType
  | ShortType;

export interface ContentlayerCardProps {
  type: string;
  slug: string;
  title: string;
  href: string;
  description?: string | null;
  excerpt?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;
  image?: string | null;
  tags?: string[];
  category?: string | null;
  author?: string | null;
  featured?: boolean;
  downloadUrl?: string | null;
  coverAspect?: string | null; // ✅ Added
  coverFit?: string | null; // ✅ Added
}

// ============================================
// CONTENTLAYER STATUS CHECK
// ============================================

export const isContentlayerLoaded = (): boolean => {
  try {
    return (
      Array.isArray(allPosts) &&
      Array.isArray(allBooks) &&
      Array.isArray(allShorts)
    );
  } catch {
    return false;
  }
};

// ============================================
// SLUG HELPER (Robust)
// ============================================

function normalizeSlug(doc: any): string {
  if (!doc) return "untitled";

  // Priority 1: Explicit slug field
  if (doc.slug && typeof doc.slug === "string" && doc.slug.trim()) {
    return doc.slug.trim().toLowerCase();
  }

  // Priority 2: Flattened path from _raw
  if (doc._raw?.flattenedPath) {
    const path = doc._raw.flattenedPath;
    const parts = path.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart === "index"
      ? parts[parts.length - 2] || lastPart
      : lastPart;
  }

  // Priority 3: Title-based slug
  if (doc.title) {
    return doc.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 100);
  }

  return "untitled";
}

// ============================================
// TYPE GUARDS
// ============================================

export const isPost = (doc: AnyDoc): doc is PostType =>
  doc.type === "Post" || doc._type === "Post";
export const isBook = (doc: AnyDoc): doc is BookType =>
  doc.type === "Book" || doc._type === "Book";
export const isDownload = (doc: AnyDoc): doc is DownloadType =>
  doc.type === "Download" || doc._type === "Download";
export const isEvent = (doc: AnyDoc): doc is EventType =>
  doc.type === "Event" || doc._type === "Event";
export const isPrint = (doc: AnyDoc): doc is PrintType =>
  doc.type === "Print" || doc._type === "Print";
export const isResource = (doc: AnyDoc): doc is ResourceType =>
  doc.type === "Resource" || doc._type === "Resource";
export const isStrategy = (doc: AnyDoc): doc is StrategyType =>
  doc.type === "Strategy" || doc._type === "Strategy";
export const isCanon = (doc: AnyDoc): doc is CanonType =>
  doc.type === "Canon" || doc._type === "Canon";
export const isShort = (doc: AnyDoc): doc is ShortType =>
  doc.type === "Short" || doc._type === "Short";

// Bulletproof draft detection - handles string "false", boolean false, undefined, null
export const isDraft = (doc: AnyDoc): boolean => {
  const d = doc.draft;
  // Explicitly false values
  if (d === false || d === "false" || d === null || d === undefined) return false;
  // Explicitly true values
  if (d === true || d === "true") return true;
  // Default to not draft
  return false;
};

export const isPublished = (doc: AnyDoc): boolean => !isDraft(doc);

// ============================================
// DOCUMENT KIND MAPPER (Contentlayer -> UI)
// ============================================

export function getDocKind(doc: AnyDoc): DocKind {
  const docType = doc.type || doc._type;

  switch (docType) {
    case "Post":
      return "post";
    case "Book":
      return "book";
    case "Download":
      return "download";
    case "Event":
      return "event";
    case "Print":
      return "print";
    case "Resource":
      return "resource";
    case "Strategy":
      return "strategy";
    case "Canon":
      return "canon";
    case "Short":
      return "short";
    default:
      return "post";
  }
}

// ============================================
// URL HELPERS - FIXED FOR YOUR SITE STRUCTURE
// ============================================

export function getDocHref(doc: AnyDoc): string {
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  // CRITICAL FIX: All content types go through /content/[slug]
  // except downloads, shorts, and a few specific routes
  switch (kind) {
    case "post":
      return `/content/${slug}`; // ✅ FIXED: was /blog/
    case "short":
      return `/shorts/${slug}`;
    case "book":
      return `/books/${slug}`;
    case "canon":
      return `/canon/${slug}`;
    case "download":
      return `/downloads/${slug}`;
    case "event":
      return `/events/${slug}`;
    case "print":
      return `/prints/${slug}`;
    case "resource":
      return `/content/${slug}`; // ✅ FIXED: was /resources/
    case "strategy":
      return `/content/${slug}`; // ✅ FIXED: was /strategy/
    default:
      return `/content/${slug}`;
  }
}

export const getShortUrl = (short: ShortType): string => getDocHref(short);

// ============================================
// IMAGE HELPERS
// ============================================

export function resolveDocCoverImage(doc: AnyDoc): string {
  const explicit =
    ((doc as any).coverImage as string | undefined) ||
    ((doc as any).image as string | undefined) ||
    "";

  if (explicit && explicit.trim()) {
    return explicit.trim();
  }

  return "/assets/images/writing-desk.webp";
}

export function resolveDocDownloadUrl(doc: AnyDoc): string | null {
  const explicit =
    ((doc as any).downloadUrl as string | undefined) ||
    ((doc as any).fileUrl as string | undefined) ||
    "";

  if (explicit && explicit.trim()) {
    return explicit.trim();
  }

  return null;
}

// ============================================
// SAFE CONTENT GETTERS
// ============================================

export const getAllContentlayerDocs = (): AnyDoc[] => {
  try {
    return [
      ...(allPosts || []),
      ...(allBooks || []),
      ...(allDownloads || []),
      ...(allEvents || []),
      ...(allPrints || []),
      ...(allResources || []),
      ...(allStrategies || []),
      ...(allCanons || []),
      ...(allShorts || []),
    ] as AnyDoc[];
  } catch (error) {
    console.error("Error getting all contentlayer docs:", error);
    return [];
  }
};

export const getPublishedDocuments = (): AnyDoc[] => {
  try {
    return getAllContentlayerDocs().filter(isPublished);
  } catch (error) {
    console.error("Error getting published documents:", error);
    return [];
  }
};

export const getFeaturedDocuments = (): AnyDoc[] => {
  try {
    return getPublishedDocuments().filter((doc) => {
      const f = doc.featured;
      // Only return true if explicitly featured: true (not "true" string, not undefined)
      return f === true || f === "true";
    });
  } catch (error) {
    console.error("Error getting featured documents:", error);
    return [];
  }
};

// ============================================
// GROUPED BY TYPE (CRITICAL FIX)
// ============================================

export function getPublishedDocumentsByType(): Record<DocKind, AnyDoc[]> {
  const published = getPublishedDocuments();

  const buckets: Record<DocKind, AnyDoc[]> = {
    post: [],
    book: [],
    download: [],
    event: [],
    print: [],
    resource: [],
    strategy: [],
    canon: [],
    short: [],
  };

  for (const doc of published) {
    const kind = getDocKind(doc);
    buckets[kind].push(doc);
  }

  // Sort each bucket by date (newest first)
  const kinds: DocKind[] = [
    "post",
    "book",
    "download",
    "event",
    "print",
    "resource",
    "strategy",
    "canon",
    "short",
  ];

  for (const kind of kinds) {
    buckets[kind].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }

  return buckets;
}

// ============================================
// INDIVIDUAL TYPE GETTERS
// ============================================

export const getPublishedPosts = (): PostType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allPosts || []).filter((post) => !post.draft) as PostType[];
  } catch (error) {
    console.error("Error getting published posts:", error);
    return [];
  }
};

export const getPublishedShorts = (): ShortType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allShorts || []).filter((short) => !short.draft) as ShortType[];
  } catch (error) {
    console.error("Error getting published shorts:", error);
    return [];
  }
};

export const getAllBooks = (): BookType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allBooks || []).filter((book) => !book.draft) as BookType[];
  } catch (error) {
    console.error("Error getting all books:", error);
    return [];
  }
};

export const getAllCanons = (): CanonType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allCanons || []).filter((canon) => !canon.draft) as CanonType[];
  } catch (error) {
    console.error("Error getting all canon entries:", error);
    return [];
  }
};

export const getAllDownloads = (): DownloadType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allDownloads || []).filter(
      (download) => !download.draft
    ) as DownloadType[];
  } catch (error) {
    console.error("Error getting all downloads:", error);
    return [];
  }
};

export const getAllEvents = (): EventType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allEvents || []).filter((event) => !event.draft) as EventType[];
  } catch (error) {
    console.error("Error getting all events:", error);
    return [];
  }
};

export const getAllPrints = (): PrintType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allPrints || []).filter((print) => !print.draft) as PrintType[];
  } catch (error) {
    console.error("Error getting all prints:", error);
    return [];
  }
};

export const getAllResources = (): ResourceType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allResources || []).filter(
      (resource) => !resource.draft
    ) as ResourceType[];
  } catch (error) {
    console.error("Error getting all resources:", error);
    return [];
  }
};

export const getAllStrategies = (): StrategyType[] => {
  if (!isContentlayerLoaded()) return [];
  try {
    return (allStrategies || []).filter(
      (strategy) => !strategy.draft
    ) as StrategyType[];
  } catch (error) {
    console.error("Error getting all strategies:", error);
    return [];
  }
};

// ============================================
// BY SLUG GETTERS
// ============================================

export const getPostBySlug = (slug: string): PostType | undefined => {
  return getPublishedPosts().find((post) => normalizeSlug(post) === slug);
};

export const getShortBySlug = (slug: string): ShortType | undefined => {
  return getPublishedShorts().find((short) => normalizeSlug(short) === slug);
};

export const getBookBySlug = (slug: string): BookType | undefined => {
  return getAllBooks().find((book) => normalizeSlug(book) === slug);
};

export const getCanonBySlug = (slug: string): CanonType | undefined => {
  return getAllCanons().find((canon) => normalizeSlug(canon) === slug);
};

export const getDocumentBySlug = (slug: string): AnyDoc | undefined => {
  return getAllContentlayerDocs().find((doc) => normalizeSlug(doc) === slug);
};

// ============================================
// CARD PROPS GENERATOR
// ============================================

export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  return {
    type: kind, // CRITICAL: lowercase for UI
    slug,
    title: (doc as any).title ?? "Untitled",
    href: getDocHref(doc),
    description: (doc as any).description ?? (doc as any).summary ?? null,
    excerpt: (doc as any).excerpt ?? null,
    subtitle: (doc as any).subtitle ?? null,
    date: (doc as any).date ?? null,
    readTime: (doc as any).readTime ?? (doc as any).readtime ?? null,
    image: resolveDocCoverImage(doc),
    tags: ((doc as any).tags as string[] | undefined) ?? [],
    category: (doc as any).category ?? null,
    author: (doc as any).author ?? null,
    featured: (doc as any).featured === true,
    downloadUrl: resolveDocDownloadUrl(doc),
    coverAspect: (doc as any).coverAspect ?? null, // ✅ Pass through
    coverFit: (doc as any).coverFit ?? null, // ✅ Pass through
  };
}

// ============================================
// EXPORTS FOR pages/content/[slug].tsx
// ============================================

export { normalizeSlug }; // ✅ Export the helper
export { getAllContentlayerDocs, getDocHref, getDocKind, isDraft };

export const getRecentShorts = (limit: number = 3): ShortType[] => {
  try {
    const shorts = getPublishedShorts();
    return shorts
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting recent shorts:", error);
    return [];
  }
};

export const getFeaturedShorts = (limit: number = 3): ShortType[] => {
  try {
    const shorts = getPublishedShorts();
    return shorts
      .filter((short) => short.featured)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting featured shorts:", error);
    return [];
  }
};
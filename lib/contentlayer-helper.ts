// lib/contentlayer-helper.ts
// Unified helpers around Contentlayer-generated docs (Contentlayer2)

import {
  allDocuments,
  allPosts,
  allDownloads,
  allBooks,
  allEvents,
  allPrints,
  allResources,
  allCanons,
  allShorts,
  allStrategies,
  type Post,
  type Download,
  type Book,
  type Event,
  type Print,
  type Resource,
  type Canon,
  type Short,
  type Strategy,
} from ".contentlayer/generated";

export type AnyDoc =
  | Post
  | Download
  | Book
  | Event
  | Print
  | Resource
  | Canon
  | Short
  | Strategy;

// ---------------------------------------------------------
// Type guards
// ---------------------------------------------------------

export function isPost(doc: AnyDoc): doc is Post {
  return doc.type === "Post";
}
export function isDownload(doc: AnyDoc): doc is Download {
  return doc.type === "Download";
}
export function isBook(doc: AnyDoc): doc is Book {
  return doc.type === "Book";
}
export function isEvent(doc: AnyDoc): doc is Event {
  return doc.type === "Event";
}
export function isPrint(doc: AnyDoc): doc is Print {
  return doc.type === "Print";
}
export function isResource(doc: AnyDoc): doc is Resource {
  return doc.type === "Resource";
}
export function isCanon(doc: AnyDoc): doc is Canon {
  return doc.type === "Canon";
}
export function isStrategy(doc: AnyDoc): doc is Strategy {
  return doc.type === "Strategy";
}
export function isShort(doc: AnyDoc): doc is Short {
  return doc.type === "Short";
}

// ---------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------

export function normaliseSlug(doc: AnyDoc): string {
  const explicit = (doc as any).slug as string | undefined;
  if (explicit && explicit.trim()) return explicit.trim();

  const flattened = (doc as any)._raw?.flattenedPath as string | undefined;
  if (!flattened) return "untitled";

  const parts = flattened.split("/");
  return (parts[parts.length - 1] || flattened).trim();
}

export function isDraft(doc: AnyDoc): boolean {
  return (doc as any).draft === true;
}

/**
 * "Published" for the public web:
 * - not draft
 */
export function isPublished(doc: AnyDoc): boolean {
  return !isDraft(doc);
}

function getDateValue(doc: AnyDoc): number {
  const raw = (doc as any).date as string | undefined;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

function normaliseUrl(doc: AnyDoc, slug: string): string | undefined {
  const url = (doc as any).url as string | undefined;
  if (url && url.trim()) return url.trim();

  // Hard fallback routes by type (keeps links consistent even if url isn't generated)
  switch ((doc as any).type) {
    case "Post":
      return `/blog/${slug}`;
    case "Short":
      return `/shorts/${slug}`;
    case "Book":
      return `/books/${slug}`;
    case "Download":
      return `/downloads/${slug}`;
    case "Print":
      return `/prints/${slug}`;
    case "Resource":
      return `/resources/${slug}`;
    case "Canon":
      return `/canon/${slug}`;
    case "Event":
      return `/events/${slug}`;
    case "Strategy":
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

// ---------------------------------------------------------
// Core collections
// ---------------------------------------------------------

/**
 * All docs (for internal use)
 */
export function getAllContentlayerDocs(): AnyDoc[] {
  return allDocuments as AnyDoc[];
}

/**
 * All public docs (any type), sorted by date desc
 */
export function getPublishedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs()
    .filter(isPublished)
    .slice()
    .sort((a, b) => getDateValue(b) - getDateValue(a));
}

/**
 * Public-facing posts
 */
export function getPublishedPosts(): Post[] {
  return (allPosts as Post[]).filter(isPublished).slice().sort((a, b) => {
    return getDateValue(b) - getDateValue(a);
  });
}

/**
 * Shorts
 */
export function getPublishedShorts(): Short[] {
  return (allShorts as Short[]).filter(isPublished).slice().sort((a, b) => {
    return getDateValue(b) - getDateValue(a);
  });
}

export function getShortBySlug(slug: string): Short | undefined {
  const target = slug.replace(/^\/+|\/+$/g, "");
  return (allShorts as Short[]).find((short) => normaliseSlug(short) === target);
}

// ---------------------------------------------------------
// Generic card props (used by /content and search index)
// ---------------------------------------------------------

export interface ContentlayerCardProps {
  type: string;
  slug: string;
  title: string;
  url?: string;
  description?: string | null;
  excerpt?: string | null;
  subtitle?: string | null;
  date?: string | null;
  readTime?: string | null;
  image?: string | null;
  tags?: string[];
  category?: string | null;
  author?: string | null;
  accessLevel?: string | null;
  featured?: boolean;
  resourceType?: string | null;
  applications?: string[] | null;
}

/**
 * Convert any Contentlayer document into a normalised
 * card shape used by the Content Library and search.
 */
export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const slug = normaliseSlug(doc);
  const url = normaliseUrl(doc, slug);

  const base: ContentlayerCardProps = {
    type: (doc as any).type ?? "Unknown",
    slug,
    title: (doc as any).title ?? "Untitled",
    url,
    description: (doc as any).description ?? (doc as any).summary ?? null,
    excerpt: (doc as any).excerpt ?? null,
    subtitle: (doc as any).subtitle ?? null,
    date: (doc as any).date ?? null,
    readTime: (doc as any).readTime ?? (doc as any).readtime ?? null,
    image: (doc as any).coverImage ?? (doc as any).image ?? null,
    tags: ((doc as any).tags as string[] | undefined) ?? [],
    category: (doc as any).category ?? null,
    author: (doc as any).author ?? null,
    accessLevel: (doc as any).accessLevel ?? null,
    featured: (doc as any).featured === true,
    resourceType: (doc as any).resourceType ?? null,
    applications: ((doc as any).applications as string[] | undefined) ?? null,
  };

  return base;
}

// ---------------------------------------------------------
// Convenience: typed lists by document type
// ---------------------------------------------------------

export function getAllBooks(): Book[] {
  return (allBooks as Book[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}
export function getAllDownloads(): Download[] {
  return (allDownloads as Download[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}
export function getAllEvents(): Event[] {
  return (allEvents as Event[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}
export function getAllPrints(): Print[] {
  return (allPrints as Print[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}
export function getAllResources(): Resource[] {
  return (allResources as Resource[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}
export function getAllCanons(): Canon[] {
  return (allCanons as Canon[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}
export function getAllStrategies(): Strategy[] {
  return (allStrategies as Strategy[]).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

/**
 * Get any document by its slug
 */
export function getDocumentBySlug(slug: string): AnyDoc | undefined {
  const target = slug.replace(/^\/+|\/+$/g, "");
  return getAllContentlayerDocs().find((doc) => normaliseSlug(doc) === target);
}

/**
 * Get featured documents (any type)
 */
export function getFeaturedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs().filter((doc) => (doc as any).featured === true && isPublished(doc));
}

/**
 * Get document by slug with type checking
 */
export function getContentlayerDocBySlug<T extends AnyDoc>(
  slug: string,
  typeGuard: (doc: AnyDoc) => doc is T,
): T | undefined {
  const doc = getDocumentBySlug(slug);
  return doc && typeGuard(doc) ? doc : undefined;
}

/**
 * Check if Contentlayer is loaded
 */
export function isContentlayerLoaded(): boolean {
  return allDocuments.length > 0;
}
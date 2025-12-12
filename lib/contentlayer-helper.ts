// lib/contentlayer-helper.ts
import type { DocumentTypes } from ".contentlayer/generated";
import {
  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allShorts,
} from ".contentlayer/generated";

// -------------------------------------------
// Types
// -------------------------------------------

export type AnyDoc = DocumentTypes;

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

export interface ContentlayerCardProps {
  type: DocKind;
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

  resourceType?: string | null;
  downloadUrl?: string | null;
  fileUrl?: string | null;
}

// -------------------------------------------
// Normalisation
// -------------------------------------------

function normaliseSlug(doc: AnyDoc): string {
  const explicit = (doc as any).slug as string | undefined;
  if (explicit && explicit.trim()) return explicit.trim();

  const flattened = (doc as any)._raw?.flattenedPath as string | undefined;
  if (!flattened) return "untitled";

  const parts = flattened.split("/");
  return (parts[parts.length - 1] || flattened).replace(/\.mdx?$/, "");
}

function normaliseKind(doc: AnyDoc): DocKind {
  // Contentlayer documents expose _type (e.g. "Post", "Book", etc)
  const t = String((doc as any)._type ?? "").toLowerCase();

  switch (t) {
    case "post":
      return "post";
    case "book":
      return "book";
    case "download":
      return "download";
    case "event":
      return "event";
    case "print":
      return "print";
    case "resource":
      return "resource";
    case "strategy":
      return "strategy";
    case "canon":
      return "canon";
    case "short":
      return "short";
    default:
      return "post";
  }
}

function isDraft(doc: AnyDoc): boolean {
  return (doc as any).draft === true;
}

function isPublished(doc: AnyDoc): boolean {
  if (isDraft(doc)) return false;
  // Optional: treat unavailable prints as non-public
  if ((doc as any)._type === "Print" && (doc as any).available === false) return false;
  // Optional: shorts can have "published: false"
  if ((doc as any)._type === "Short" && (doc as any).published === false) return false;
  return true;
}

function getDateValue(doc: AnyDoc): number {
  const raw = (doc as any).date as string | undefined;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

// -------------------------------------------
// Core collections (guaranteed consistent)
// -------------------------------------------

export function getAllContentlayerDocs(): AnyDoc[] {
  // prefer allDocuments for completeness
  return (allDocuments as AnyDoc[]) ?? [];
}

export function isContentlayerLoaded(): boolean {
  return getAllContentlayerDocs().length > 0;
}

export function getPublishedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs()
    .filter(isPublished)
    .sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getPublishedDocumentsByType(): Record<DocKind, AnyDoc[]> {
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

  for (const doc of getPublishedDocuments()) {
    buckets[normaliseKind(doc)].push(doc);
  }

  return buckets;
}

// -------------------------------------------
// Card props
// -------------------------------------------

export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const kind = normaliseKind(doc);
  const slug = normaliseSlug(doc);

  const href =
    ((doc as any).url as string | undefined) ??
    ((doc as any).href as string | undefined) ??
    `/${kind}s/${slug}`;

  const image =
    ((doc as any).coverImage as string | undefined) ??
    ((doc as any).image as string | undefined) ??
    null;

  const downloadUrl =
    ((doc as any).downloadUrl as string | undefined) ??
    ((doc as any).fileUrl as string | undefined) ??
    null;

  return {
    type: kind,
    slug,
    title: (doc as any).title ?? "Untitled",
    href,

    description: (doc as any).description ?? (doc as any).summary ?? null,
    excerpt: (doc as any).excerpt ?? null,
    subtitle: (doc as any).subtitle ?? null,
    date: (doc as any).date ?? null,
    readTime: (doc as any).readTime ?? (doc as any).readtime ?? null,

    image,
    tags: ((doc as any).tags as string[] | undefined) ?? [],

    category: (doc as any).category ?? null,
    author: (doc as any).author ?? null,
    featured: (doc as any).featured === true,

    resourceType: (doc as any).resourceType ?? null,
    downloadUrl,
    fileUrl: (doc as any).fileUrl ?? null,
  };
}

// -------------------------------------------
// Optional: direct typed lists (kept for convenience)
// -------------------------------------------

export const lists = {
  posts: () => (allPosts as AnyDoc[]).filter(isPublished),
  books: () => (allBooks as AnyDoc[]).filter(isPublished),
  downloads: () => (allDownloads as AnyDoc[]).filter(isPublished),
  events: () => (allEvents as AnyDoc[]).filter(isPublished),
  prints: () => (allPrints as AnyDoc[]).filter(isPublished),
  resources: () => (allResources as AnyDoc[]).filter(isPublished),
  strategies: () => (allStrategies as AnyDoc[]).filter(isPublished),
  canons: () => (allCanons as AnyDoc[]).filter(isPublished),
  shorts: () => (allShorts as AnyDoc[]).filter(isPublished),
};
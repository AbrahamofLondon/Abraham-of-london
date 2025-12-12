// lib/contentlayer-helper.ts
// Unified helpers around Contentlayer2-generated docs

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

function cleanSlug(input: string): string {
  return String(input || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
}

function normaliseSlug(doc: AnyDoc): string {
  const explicit = (doc as any).slug as string | undefined;
  if (explicit && explicit.trim()) return cleanSlug(explicit);

  const flattened = (doc as any)._raw?.flattenedPath as string | undefined;
  if (!flattened) return "untitled";

  const parts = flattened.split("/");
  return cleanSlug(parts[parts.length - 1] || flattened);
}

function isDraft(doc: AnyDoc): boolean {
  return (doc as any).draft === true;
}

/**
 * "Published" for the public web:
 * - not draft
 * - (Print only) available !== false
 */
function isPublished(doc: AnyDoc): boolean {
  if (isDraft(doc)) return false;

  if (isPrint(doc)) {
    // if you use `available: false` in frontmatter
    if ((doc as any).available === false) return false;
  }

  return true;
}

function getDateValue(doc: AnyDoc): number {
  const raw = (doc as any).date as string | undefined;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

function sortByDate<T extends AnyDoc>(docs: T[]): T[] {
  return [...docs].sort((a, b) => getDateValue(b) - getDateValue(a));
}

// ---------------------------------------------------------
// Canonical routes per type (single source of truth)
// ---------------------------------------------------------

export type DocKind =
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "canon"
  | "short"
  | "strategy";

export function getDocKind(doc: AnyDoc): DocKind {
  switch (doc.type) {
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
    case "Canon":
      return "canon";
    case "Short":
      return "short";
    case "Strategy":
      return "strategy";
    default:
      return "post";
  }
}

export function getDocHref(doc: AnyDoc): string {
  const slug = normaliseSlug(doc);
  const explicitUrl = (doc as any).url as string | undefined;
  const explicitHref = (doc as any).href as string | undefined;

  // If Contentlayer doc has url/href already, prefer it.
  const candidate = explicitHref || explicitUrl;
  if (candidate && String(candidate).trim()) return String(candidate).trim();

  const kind = getDocKind(doc);
  switch (kind) {
    case "post":
      return `/blog/${slug}`;
    case "book":
      return `/books/${slug}`;
    case "download":
      return `/downloads/${slug}`;
    case "event":
      return `/events/${slug}`;
    case "print":
      return `/prints/${slug}`;
    case "resource":
      return `/resources/${slug}`;
    case "canon":
      return `/canon/${slug}`;
    case "short":
      return `/shorts/${slug}`;
    case "strategy":
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

/**
 * Deterministic default cover path conventions (zero-MDX-maintenance).
 * You can override exceptions in pages/content/index.tsx.
 */
export function getDefaultCoverForDoc(doc: AnyDoc): string {
  const slug = normaliseSlug(doc);
  const kind = getDocKind(doc);

  // Prefer your known global fallback if you have it
  const fallback = "/assets/images/writing-desk.webp";

  // Type-based conventions:
  switch (kind) {
    case "post":
      return `/assets/images/blog/${slug}.jpg`;
    case "short":
      // shorts often share imagery with blog
      return `/assets/images/blog/${slug}.jpg`;
    case "book":
      return `/assets/images/books/${slug}.jpg`;
    case "canon":
      return `/assets/images/canon/${slug}.jpg`;
    case "download":
      return `/assets/images/downloads/${slug}.jpg`;
    case "print":
      return `/assets/images/prints/${slug}.jpg`;
    case "resource":
      return `/assets/images/resources/${slug}.jpg`;
    case "event":
      return `/assets/images/events/${slug}.jpg`;
    case "strategy":
      return `/assets/images/strategy/${slug}.jpg`;
    default:
      return fallback;
  }
}

/**
 * Normalise coverImage from MDX:
 * - Fix common “missing folder” mistakes (e.g. /assets/images/canon-resources.jpg)
 * - Fallback to deterministic conventions when absent.
 */
export function resolveDocCoverImage(doc: AnyDoc): string {
  const explicit =
    ((doc as any).coverImage as string | undefined) ||
    ((doc as any).image as string | undefined) ||
    "";

  const cleaned = String(explicit || "").trim();

  // If it's already a proper path, keep it.
  if (cleaned.startsWith("/assets/") || cleaned.startsWith("http")) {
    // Fix your specific recurring issue:
    // You showed: "/assets/images/canon-resources.jpg" but file lives in "/assets/images/canon/canon-resources.jpg"
    if (cleaned === "/assets/images/canon-resources.jpg") {
      return "/assets/images/canon/canon-resources.jpg";
    }
    if (cleaned === "/assets/images/canon-resources.jpg") {
      return "/assets/images/canon/canon-resources.jpg";
    }
    return cleaned;
  }

  // Missing/blank => deterministic default
  if (!cleaned) return getDefaultCoverForDoc(doc);

  // Relative "assets/images/..." => normalise to leading slash
  if (cleaned.startsWith("assets/")) return `/${cleaned}`;

  // Anything else => treat as file name under type folder
  const kind = getDocKind(doc);
  if (!cleaned.includes("/")) {
    switch (kind) {
      case "canon":
        return `/assets/images/canon/${cleaned}`;
      case "post":
      case "short":
        return `/assets/images/blog/${cleaned}`;
      case "download":
        return `/assets/images/downloads/${cleaned}`;
      case "print":
        return `/assets/images/prints/${cleaned}`;
      case "resource":
        return `/assets/images/resources/${cleaned}`;
      case "book":
        return `/assets/images/books/${cleaned}`;
      case "event":
        return `/assets/images/events/${cleaned}`;
      case "strategy":
        return `/assets/images/strategy/${cleaned}`;
      default:
        return `/assets/images/${cleaned}`;
    }
  }

  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

/**
 * Deterministic download URL convention for docs that represent downloadable PDFs.
 * This solves your “resources pdf folder is empty” problem on the UI side,
 * once your generator actually writes files to the right folder.
 */
export function resolveDocDownloadUrl(doc: AnyDoc): string | null {
  const kind = getDocKind(doc);
  const slug = normaliseSlug(doc);

  const explicit =
    ((doc as any).downloadUrl as string | undefined) ||
    ((doc as any).fileUrl as string | undefined) ||
    "";

  const cleaned = String(explicit || "").trim();
  if (cleaned) return cleaned;

  // Conventions (edit if your repo uses different output folders):
  if (kind === "resource") return `/assets/resources/pdfs/${slug}.pdf`;
  if (kind === "download") return `/assets/downloads/pdfs/${slug}.pdf`;
  if (kind === "canon") return `/assets/canon/pdfs/${slug}.pdf`;

  return null;
}

// ---------------------------------------------------------
// Core collections
// ---------------------------------------------------------

export function getAllContentlayerDocs(): AnyDoc[] {
  return allDocuments as AnyDoc[];
}

export function getPublishedPosts(): Post[] {
  return sortByDate((allPosts as Post[]).filter(isPublished));
}

export function getPublishedShorts(): Short[] {
  return sortByDate((allShorts as Short[]).filter(isPublished));
}

export function getShortBySlug(slug: string): Short | undefined {
  const target = cleanSlug(slug);
  return (allShorts as Short[]).find((short) => normaliseSlug(short) === target);
}

// ---------------------------------------------------------
// Generic card props (used by /content and search index)
// ---------------------------------------------------------

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
  accessLevel?: string | null;
  featured?: boolean;
  resourceType?: string | null;
  applications?: string[] | null;
  downloadUrl?: string | null;
}

export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const slug = normaliseSlug(doc);

  return {
    type: (doc as any).type ?? "Unknown",
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
    accessLevel: (doc as any).accessLevel ?? null,
    featured: (doc as any).featured === true,
    resourceType: (doc as any).resourceType ?? null,
    applications: ((doc as any).applications as string[] | undefined) ?? null,
    downloadUrl: resolveDocDownloadUrl(doc),
  };
}

// ---------------------------------------------------------
// Convenience: typed lists by document type
// ---------------------------------------------------------

export function getAllBooks(): Book[] {
  return sortByDate((allBooks as Book[]).slice());
}
export function getAllDownloads(): Download[] {
  return sortByDate((allDownloads as Download[]).slice());
}
export function getAllEvents(): Event[] {
  return sortByDate((allEvents as Event[]).slice());
}
export function getAllPrints(): Print[] {
  return sortByDate((allPrints as Print[]).slice());
}
export function getAllResources(): Resource[] {
  return sortByDate((allResources as Resource[]).slice());
}
export function getAllCanons(): Canon[] {
  return sortByDate((allCanons as Canon[]).slice());
}
export function getAllStrategies(): Strategy[] {
  return sortByDate((allStrategies as Strategy[]).slice());
}

export function getDocumentBySlug(slug: string): AnyDoc | undefined {
  const target = cleanSlug(slug);
  return getAllContentlayerDocs().find((doc) => normaliseSlug(doc) === target);
}

export function getFeaturedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs().filter(
    (doc) => (doc as any).featured === true && isPublished(doc),
  );
}

export function getPublishedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs().filter(isPublished);
}

/**
 * Grouped, published lists (guarantees categories can't disappear).
 */
export function getPublishedDocumentsByType(): Record<DocKind, AnyDoc[]> {
  const published = getPublishedDocuments();

  const buckets: Record<DocKind, AnyDoc[]> = {
    post: [],
    book: [],
    download: [],
    event: [],
    print: [],
    resource: [],
    canon: [],
    short: [],
    strategy: [],
  };

  for (const doc of published) {
    buckets[getDocKind(doc)].push(doc);
  }

  // newest-first per bucket
  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k] = sortByDate(buckets[k]);
  });

  return buckets;
}

export function getContentlayerDocBySlug<T extends AnyDoc>(
  slug: string,
  typeGuard: (doc: AnyDoc) => doc is T,
): T | undefined {
  const doc = getDocumentBySlug(slug);
  return doc && typeGuard(doc) ? doc : undefined;
}

export function isContentlayerLoaded(): boolean {
  return allDocuments.length > 0;
}
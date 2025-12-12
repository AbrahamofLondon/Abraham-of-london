// lib/contentlayer-helper.ts
// COMPLETE with all required exports

// SAFE IMPORT PATTERN
let contentlayerData: any = null;

try {
  contentlayerData = require(".contentlayer/generated");
} catch (error) {
  console.warn("⚠️ Contentlayer data not available - using empty collections");
  contentlayerData = {
    allDocuments: [],
    allPosts: [],
    allDownloads: [],
    allBooks: [],
    allEvents: [],
    allPrints: [],
    allResources: [],
    allCanons: [],
    allShorts: [],
    allStrategies: [],
  };
}

// Export with fallbacks
export const allDocuments = contentlayerData.allDocuments || [];
export const allPosts = contentlayerData.allPosts || [];
export const allDownloads = contentlayerData.allDownloads || [];
export const allBooks = contentlayerData.allBooks || [];
export const allEvents = contentlayerData.allEvents || [];
export const allPrints = contentlayerData.allPrints || [];
export const allResources = contentlayerData.allResources || [];
export const allCanons = contentlayerData.allCanons || [];
export const allShorts = contentlayerData.allShorts || [];
export const allStrategies = contentlayerData.allStrategies || [];

// Type definitions
export type AnyDoc = any;

export type DocKind =
  | "post"
  | "download"
  | "book"
  | "event"
  | "print"
  | "resource"
  | "canon"
  | "short"
  | "strategy";

// ---------------------------------------------------------
// ALL TYPE GUARDS (EXPORTED)
// ---------------------------------------------------------
export function isPost(doc: AnyDoc): boolean {
  return doc?.type === "Post";
}

export function isDownload(doc: AnyDoc): boolean {
  return doc?.type === "Download";
}

export function isBook(doc: AnyDoc): boolean {
  return doc?.type === "Book";
}

export function isEvent(doc: AnyDoc): boolean {
  return doc?.type === "Event";
}

export function isPrint(doc: AnyDoc): boolean {
  return doc?.type === "Print";
}

export function isResource(doc: AnyDoc): boolean {
  return doc?.type === "Resource";
}

export function isCanon(doc: AnyDoc): boolean {
  return doc?.type === "Canon";
}

export function isStrategy(doc: AnyDoc): boolean {
  return doc?.type === "Strategy";
}

export function isShort(doc: AnyDoc): boolean {
  return doc?.type === "Short";
}

// ---------------------------------------------------------
// NORMALISATION HELPERS
// ---------------------------------------------------------
function normaliseSlug(doc: AnyDoc): string {
  const explicit = doc?.slug as string | undefined;
  if (explicit && explicit.trim()) return explicit.trim().toLowerCase();

  const flattened = doc?._raw?.flattenedPath as string | undefined;
  if (!flattened) return "untitled";

  const parts = flattened.split("/");
  return (parts[parts.length - 1] || flattened).toLowerCase().replace(/\.mdx?$/, '');
}

function normaliseKind(doc: AnyDoc): DocKind {
  const t = String(doc?.type ?? "").toLowerCase().trim();
  
  switch (t) {
    case "post":
      return "post";
    case "download":
      return "download";
    case "book":
      return "book";
    case "event":
      return "event";
    case "print":
      return "print";
    case "resource":
      return "resource";
    case "canon":
      return "canon";
    case "short":
      return "short";
    case "strategy":
      return "strategy";
    default:
      return "post";
  }
}

export function isDraft(doc: AnyDoc): boolean {
  return doc?.draft === true;
}

export function isPublished(doc: AnyDoc): boolean {
  if (isDraft(doc)) return false;
  if (doc?.type === "Print" && doc?.available === false) return false;
  return true;
}

function getDateValue(doc: AnyDoc): number {
  const raw = doc?.date as string | undefined;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

// ---------------------------------------------------------
// ALL CORE COLLECTIONS (EXPORTED)
// ---------------------------------------------------------
export function getAllContentlayerDocs(): AnyDoc[] {
  return allDocuments || [];
}

export function getPublishedPosts(): AnyDoc[] {
  return (allPosts || []).filter(isPublished).sort((a, b) => {
    return getDateValue(b) - getDateValue(a);
  });
}

export function getPublishedShorts(): AnyDoc[] {
  return (allShorts || []).filter(isPublished).sort((a, b) => {
    return getDateValue(b) - getDateValue(a);
  });
}

export function getShortBySlug(slug: string): AnyDoc | undefined {
  const target = slug.replace(/^\/+|\/+$/g, "").toLowerCase();
  return (allShorts || []).find((short: AnyDoc) => {
    const s = normaliseSlug(short);
    return s === target;
  });
}

export function getAllBooks(): AnyDoc[] {
  return (allBooks || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllDownloads(): AnyDoc[] {
  return (allDownloads || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllEvents(): AnyDoc[] {
  return (allEvents || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllPrints(): AnyDoc[] {
  return (allPrints || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllResources(): AnyDoc[] {
  return (allResources || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllCanons(): AnyDoc[] {
  return (allCanons || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllStrategies(): AnyDoc[] {
  return (allStrategies || []).slice().sort((a, b) => getDateValue(b) - getDateValue(a));
}

// ---------------------------------------------------------
// GENERIC CARD PROPS
// ---------------------------------------------------------
export interface ContentlayerCardProps {
  type: DocKind;
  slug: string;
  title: string;
  href: string;
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
  downloadUrl?: string | null;
  fileUrl?: string | null;
}

export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const slug = normaliseSlug(doc);
  const kind = normaliseKind(doc);
  const href = doc?.url || `/${kind}s/${slug}`;

  const base: ContentlayerCardProps = {
    type: kind,
    slug,
    title: doc?.title ?? "Untitled",
    href,
    url: doc?.url || href,
    description: doc?.description ?? doc?.summary ?? null,
    excerpt: doc?.excerpt ?? null,
    subtitle: doc?.subtitle ?? null,
    date: doc?.date ?? null,
    readTime: doc?.readTime ?? doc?.readtime ?? null,
    image: doc?.coverImage ?? doc?.image ?? null,
    tags: doc?.tags ?? [],
    category: doc?.category ?? null,
    author: doc?.author ?? null,
    accessLevel: doc?.accessLevel ?? null,
    featured: doc?.featured === true,
    resourceType: doc?.resourceType ?? null,
    applications: doc?.applications ?? null,
    downloadUrl: doc?.downloadUrl ?? null,
    fileUrl: doc?.fileUrl ?? null,
  };

  return base;
}

// ---------------------------------------------------------
// GROUP PUBLISHED DOCS BY TYPE
// ---------------------------------------------------------
export function getPublishedDocumentsByType(): Record<DocKind, AnyDoc[]> {
  const buckets: Record<DocKind, AnyDoc[]> = {
    post: [],
    canon: [],
    resource: [],
    download: [],
    print: [],
    book: [],
    event: [],
    short: [],
    strategy: [],
  };

  for (const doc of getAllContentlayerDocs()) {
    if (!isPublished(doc)) continue;
    const kind = normaliseKind(doc);
    buckets[kind].push(doc);
  }

  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k].sort((a, b) => getDateValue(b) - getDateValue(a));
  });

  return buckets;
}

// ---------------------------------------------------------
// SLUG ACCESS (EXPORTED)
// ---------------------------------------------------------
export function getDocumentBySlug(slug: string): AnyDoc | undefined {
  const target = slug.replace(/^\/+|\/+$/g, "").toLowerCase();
  return getAllContentlayerDocs().find((doc) => normaliseSlug(doc) === target);
}

export function getFeaturedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs().filter(
    (doc) => doc?.featured === true && isPublished(doc)
  );
}

export function getPublishedDocuments(): AnyDoc[] {
  return getAllContentlayerDocs().filter(isPublished);
}

export function getContentlayerDocBySlug(
  slug: string,
  typeGuard: (doc: AnyDoc) => boolean
): AnyDoc | undefined {
  const doc = getDocumentBySlug(slug);
  return doc && typeGuard(doc) ? doc : undefined;
}

export function getDocKind(doc: AnyDoc): DocKind {
  return normaliseKind(doc);
}

export function isContentlayerLoaded(): boolean {
  return (allDocuments?.length ?? 0) > 0;
}
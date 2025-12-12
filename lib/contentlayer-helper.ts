// lib/contentlayer-helper.ts
// COMPLETE VERSION without problematic .contentlayer/generated import

// Type definitions (no imports from .contentlayer/generated)
export type AnyDoc = {
  type: string;
  title: string;
  slug?: string;
  date?: string;
  description?: string;
  excerpt?: string;
  subtitle?: string;
  coverImage?: string;
  image?: string;
  tags?: string[];
  draft?: boolean;
  featured?: boolean;
  accessLevel?: string;
  author?: string;
  readTime?: string;
  readtime?: string;
  category?: string;
  resourceType?: string;
  applications?: string[];
  downloadUrl?: string;
  fileUrl?: string;
  href?: string;
  url?: string;
  _raw?: {
    flattenedPath: string;
  };
  // Print specific
  dimensions?: string;
  downloadFile?: string;
  price?: string;
  available?: boolean;
  // Event specific
  time?: string;
  eventDate?: string;
  location?: string;
  registrationUrl?: string;
  // Book specific
  publisher?: string;
  isbn?: string;
  // Canon specific
  coverAspect?: string;
  coverFit?: string;
  volumeNumber?: string;
  order?: number;
  // Short specific
  theme?: string;
  audience?: string;
  published?: boolean;
};

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
// SAFE CONTENTLAYER DATA LOADING
// ---------------------------------------------------------

let contentlayerData: any = null;
let isInitialized = false;

function loadContentlayerData(): any {
  if (isInitialized) return contentlayerData;
  
  try {
    // Dynamic require to avoid TypeScript errors
    const generated = require(".contentlayer/generated");
    contentlayerData = {
      allDocuments: generated.allDocuments || [],
      allPosts: generated.allPosts || [],
      allDownloads: generated.allDownloads || [],
      allBooks: generated.allBooks || [],
      allEvents: generated.allEvents || [],
      allPrints: generated.allPrints || [],
      allResources: generated.allResources || [],
      allCanons: generated.allCanons || [],
      allShorts: generated.allShorts || [],
      allStrategies: generated.allStrategies || [],
    };
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
  
  isInitialized = true;
  return contentlayerData;
}

// Export the data arrays
export const allDocuments: AnyDoc[] = [];
export const allPosts: AnyDoc[] = [];
export const allDownloads: AnyDoc[] = [];
export const allBooks: AnyDoc[] = [];
export const allEvents: AnyDoc[] = [];
export const allPrints: AnyDoc[] = [];
export const allResources: AnyDoc[] = [];
export const allCanons: AnyDoc[] = [];
export const allShorts: AnyDoc[] = [];
export const allStrategies: AnyDoc[] = [];

// Initialize on module load
if (typeof window === 'undefined') {
  const data = loadContentlayerData();
  // Populate the arrays
  allDocuments.push(...(data.allDocuments || []));
  allPosts.push(...(data.allPosts || []));
  allDownloads.push(...(data.allDownloads || []));
  allBooks.push(...(data.allBooks || []));
  allEvents.push(...(data.allEvents || []));
  allPrints.push(...(data.allPrints || []));
  allResources.push(...(data.allResources || []));
  allCanons.push(...(data.allCanons || []));
  allShorts.push(...(data.allShorts || []));
  allStrategies.push(...(data.allStrategies || []));
}

// ---------------------------------------------------------
// TYPE GUARDS
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
// HELPER FUNCTIONS
// ---------------------------------------------------------
function normaliseSlug(doc: AnyDoc): string {
  const explicit = doc?.slug;
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim().toLowerCase();
  }

  const flattened = doc?._raw?.flattenedPath;
  if (!flattened) return "untitled";

  const parts = flattened.split("/");
  return (parts[parts.length - 1] || flattened).toLowerCase().replace(/\.mdx?$/, '');
}

function normaliseKind(doc: AnyDoc): DocKind {
  const t = String(doc?.type ?? "").toLowerCase().trim();
  
  switch (t) {
    case "post": return "post";
    case "download": return "download";
    case "book": return "book";
    case "event": return "event";
    case "print": return "print";
    case "resource": return "resource";
    case "canon": return "canon";
    case "short": return "short";
    case "strategy": return "strategy";
    default: return "post";
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
  const raw = doc?.date;
  if (!raw || typeof raw !== 'string') return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

// ---------------------------------------------------------
// CONTENT GETTERS
// ---------------------------------------------------------
export function getAllContentlayerDocs(): AnyDoc[] {
  return allDocuments;
}

export function getPublishedPosts(): AnyDoc[] {
  return allPosts.filter(isPublished).sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getPublishedShorts(): AnyDoc[] {
  return allShorts.filter(isPublished).sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getShortBySlug(slug: string): AnyDoc | undefined {
  const target = slug.replace(/^\/+|\/+$/g, "").toLowerCase();
  return allShorts.find((short) => {
    const s = normaliseSlug(short);
    return s === target;
  });
}

export function getAllBooks(): AnyDoc[] {
  return [...allBooks].sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllDownloads(): AnyDoc[] {
  return [...allDownloads].sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllEvents(): AnyDoc[] {
  return [...allEvents].sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllPrints(): AnyDoc[] {
  return [...allPrints].sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllResources(): AnyDoc[] {
  return [...allResources].sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllCanons(): AnyDoc[] {
  return [...allCanons].sort((a, b) => getDateValue(b) - getDateValue(a));
}

export function getAllStrategies(): AnyDoc[] {
  return [...allStrategies].sort((a, b) => getDateValue(b) - getDateValue(a));
}

// ---------------------------------------------------------
// CARD PROPS INTERFACE
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
  const href = doc?.url || doc?.href || `/${kind}s/${slug}`;

  return {
    type: kind,
    slug,
    title: doc?.title || "Untitled",
    href,
    url: doc?.url || href,
    description: doc?.description || doc?.summary || null,
    excerpt: doc?.excerpt || null,
    subtitle: doc?.subtitle || null,
    date: doc?.date || null,
    readTime: doc?.readTime || doc?.readtime || null,
    image: doc?.coverImage || doc?.image || null,
    tags: doc?.tags || [],
    category: doc?.category || null,
    author: doc?.author || null,
    accessLevel: doc?.accessLevel || null,
    featured: doc?.featured === true,
    resourceType: doc?.resourceType || null,
    applications: doc?.applications || null,
    downloadUrl: doc?.downloadUrl || null,
    fileUrl: doc?.fileUrl || null,
  };
}

// ---------------------------------------------------------
// GROUPING FUNCTIONS
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

  for (const doc of allDocuments) {
    if (!isPublished(doc)) continue;
    const kind = normaliseKind(doc);
    buckets[kind].push(doc);
  }

  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k].sort((a, b) => getDateValue(b) - getDateValue(a));
  });

  return buckets;
}

export function getDocumentBySlug(slug: string): AnyDoc | undefined {
  const target = slug.replace(/^\/+|\/+$/g, "").toLowerCase();
  return allDocuments.find((doc) => normaliseSlug(doc) === target);
}

export function getFeaturedDocuments(): AnyDoc[] {
  return allDocuments.filter((doc) => doc?.featured === true && isPublished(doc));
}

export function getPublishedDocuments(): AnyDoc[] {
  return allDocuments.filter(isPublished);
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
  return allDocuments.length > 0;
}
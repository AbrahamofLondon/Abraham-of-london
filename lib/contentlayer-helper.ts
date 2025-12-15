/* eslint-disable @typescript-eslint/no-explicit-any */

export type DocKind =
  | "post"
  | "canon"
  | "resource"
  | "download"
  | "print"
  | "book"
  | "event"
  | "short"
  | "strategy";

export type AnyDoc = {
  type?: string; // "Post" | "Book" | ...
  _type?: string; // some setups
  slug?: string;
  title?: string;
  excerpt?: string;
  description?: string;
  subtitle?: string;
  date?: string;
  tags?: string[];
  coverImage?: string;
  draft?: boolean;
  featured?: boolean;

  // common meta
  author?: string;
  readTime?: string;
  category?: string;

  // downloads/resources
  downloadUrl?: string;
  fileUrl?: string;
  pdfPath?: string;
  downloadFile?: string;

  // contentlayer
  body?: { code?: string; raw?: string };
  _raw?: { flattenedPath?: string; sourceFilePath?: string };
};

export type ContentlayerCardProps = {
  type: DocKind;
  slug: string;
  href: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  image?: string | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  downloadUrl?: string | null;
  coverAspect?: "wide" | "portrait" | "book";
};

type Generated = {
  allDocuments?: AnyDoc[];
  allPosts?: AnyDoc[];
  allBooks?: AnyDoc[];
  allDownloads?: AnyDoc[];
  allEvents?: AnyDoc[];
  allPrints?: AnyDoc[];
  allResources?: AnyDoc[];
  allCanons?: AnyDoc[];
  allShorts?: AnyDoc[];
  allStrategies?: AnyDoc[];
};

function asArray<T = any>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function loadGenerated(): Generated {
  try {
    // ✅ stable build import
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("contentlayer/generated") as Generated;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[contentlayer-helper] Failed to load contentlayer/generated.", e);
    }
    return {};
  }
}

// ----------------------------------------------------------------------------
// Slug helpers
// ----------------------------------------------------------------------------
export function normalizeSlug(doc: AnyDoc): string {
  if (!doc) return "untitled";

  const s = typeof doc.slug === "string" ? doc.slug.trim() : "";
  if (s) return s.toLowerCase();

  const fp =
    typeof doc?._raw?.flattenedPath === "string" ? doc._raw.flattenedPath : "";
  if (fp) {
    const parts = fp.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    const pick = last === "index" ? parts[parts.length - 2] : last;
    if (pick) return String(pick).trim().toLowerCase();
  }

  const t = typeof doc.title === "string" ? doc.title.trim() : "";
  if (t) {
    return t
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
  }

  return "untitled";
}

export function isDraft(doc: AnyDoc): boolean {
  return Boolean(doc?.draft);
}

// ----------------------------------------------------------------------------
// Kind mapping (single source of truth)
// ----------------------------------------------------------------------------
export function getDocKind(doc: AnyDoc): DocKind {
  const raw = String(doc?.type ?? doc?._type ?? "").toLowerCase();

  if (raw.includes("post")) return "post";
  if (raw.includes("canon")) return "canon";
  if (raw.includes("resource")) return "resource";
  if (raw.includes("download")) return "download";
  if (raw.includes("print")) return "print";
  if (raw.includes("book")) return "book";
  if (raw.includes("event")) return "event";
  if (raw.includes("short")) return "short";
  if (raw.includes("strategy")) return "strategy";

  // fallback from flattenedPath
  const fp = String(doc?._raw?.flattenedPath ?? "").toLowerCase();
  if (fp.includes("posts/")) return "post";
  if (fp.includes("canon/")) return "canon";
  if (fp.includes("resources/")) return "resource";
  if (fp.includes("downloads/")) return "download";
  if (fp.includes("prints/")) return "print";
  if (fp.includes("books/")) return "book";
  if (fp.includes("events/")) return "event";
  if (fp.includes("shorts/")) return "short";
  if (fp.includes("strategy/")) return "strategy";

  return "post";
}

// ----------------------------------------------------------------------------
// Href mapping (single source of truth)
// ----------------------------------------------------------------------------
export function getDocHref(doc: AnyDoc): string {
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  switch (kind) {
    case "post":
      return `/blog/${slug}`; // ✅ posts live here now
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
      return `/resources/${slug}`;
    case "strategy":
      return `/strategy/${slug}`;
    default:
      return `/content/${slug}`;
  }
}

// ----------------------------------------------------------------------------
// Collections (compat exports)
// ----------------------------------------------------------------------------
const gen = loadGenerated();

export const allPosts = asArray<AnyDoc>(gen.allPosts);
export const allBooks = asArray<AnyDoc>(gen.allBooks);
export const allDownloads = asArray<AnyDoc>(gen.allDownloads);
export const allEvents = asArray<AnyDoc>(gen.allEvents);
export const allPrints = asArray<AnyDoc>(gen.allPrints);
export const allResources = asArray<AnyDoc>(gen.allResources);
export const allCanons = asArray<AnyDoc>(gen.allCanons);
export const allShorts = asArray<AnyDoc>(gen.allShorts);
export const allStrategies = asArray<AnyDoc>(gen.allStrategies);

// Prefer allDocuments; otherwise merge everything
export const allDocuments: AnyDoc[] = (() => {
  const docs = asArray<AnyDoc>(gen.allDocuments);
  if (docs.length > 0) return docs;

  return [
    ...allPosts,
    ...allBooks,
    ...allDownloads,
    ...allEvents,
    ...allPrints,
    ...allResources,
    ...allCanons,
    ...allShorts,
    ...allStrategies,
  ].filter(Boolean);
})();

export const allContent: AnyDoc[] = [...allDocuments];

export const allPublished: AnyDoc[] = allDocuments.filter((d) => !isDraft(d));

// ----------------------------------------------------------------------------
// “Old API” helpers your codebase expects
// ----------------------------------------------------------------------------
export function getAllContentlayerDocs(): AnyDoc[] {
  return allDocuments;
}

export function getDocumentsByType(type: string): AnyDoc[] {
  return allDocuments.filter(
    (d) => String(d.type ?? d._type ?? "").toLowerCase() === type.toLowerCase()
  );
}

export function getDocumentBySlug(slug: string, type?: string): AnyDoc | undefined {
  const s = String(slug ?? "").trim().toLowerCase();
  const pool = type ? getDocumentsByType(type) : allDocuments;
  return pool.find((d) => normalizeSlug(d) === s);
}

export function getBySlugAndKind(slug: string, kind: DocKind): AnyDoc | undefined {
  const s = String(slug ?? "").trim().toLowerCase();
  return allDocuments
    .filter((d) => getDocKind(d) === kind)
    .find((d) => normalizeSlug(d) === s);
}

export function getDocByHref(href: string): AnyDoc | undefined {
  const h = String(href ?? "").trim();
  return allDocuments.find((d) => getDocHref(d) === h);
}

export function getPublishedDocuments<T extends AnyDoc>(docs: T[] = allDocuments as T[]): T[] {
  return docs
    .filter((d) => !isDraft(d))
    .sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      if (bd !== ad) return bd - ad;
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });
}

export function getPublishedPosts(): AnyDoc[] {
  return getPublishedDocuments(allPosts);
}

export function getPublishedShorts(): AnyDoc[] {
  return getPublishedDocuments(allShorts);
}

export function getRecentShorts(limit = 6): AnyDoc[] {
  return getPublishedShorts().slice(0, Math.max(0, limit));
}

export function getShortBySlug(slug: string): AnyDoc | undefined {
  return getBySlugAndKind(slug, "short");
}

export function getShortUrl(doc: AnyDoc): string {
  // keep legacy name
  return getDocHref(doc);
}

export function getAllBooks(): AnyDoc[] {
  return allBooks;
}
export function getAllDownloads(): AnyDoc[] {
  return allDownloads;
}
export function getAllEvents(): AnyDoc[] {
  return allEvents;
}
export function getAllPrints(): AnyDoc[] {
  return allPrints;
}
export function getAllResources(): AnyDoc[] {
  return allResources;
}
export function getAllStrategies(): AnyDoc[] {
  return allStrategies;
}

export function isContentlayerLoaded(): boolean {
  // “loaded” means we can see at least one known collection or any docs
  return (
    allDocuments.length > 0 ||
    allPosts.length > 0 ||
    allBooks.length > 0 ||
    allDownloads.length > 0
  );
}

// ----------------------------------------------------------------------------
// Type guards (compat)
// ----------------------------------------------------------------------------
export function isPost(doc: AnyDoc): boolean {
  return getDocKind(doc) === "post";
}
export function isBook(doc: AnyDoc): boolean {
  return getDocKind(doc) === "book";
}
export function isDownload(doc: AnyDoc): boolean {
  return getDocKind(doc) === "download";
}
export function isEvent(doc: AnyDoc): boolean {
  return getDocKind(doc) === "event";
}
export function isPrint(doc: AnyDoc): boolean {
  return getDocKind(doc) === "print";
}
export function isResource(doc: AnyDoc): boolean {
  return getDocKind(doc) === "resource";
}
export function isShort(doc: AnyDoc): boolean {
  return getDocKind(doc) === "short";
}
export function isStrategy(doc: AnyDoc): boolean {
  return getDocKind(doc) === "strategy";
}

// ----------------------------------------------------------------------------
// Bucketing for The Kingdom Vault
// ----------------------------------------------------------------------------
export function getPublishedDocumentsByType(): Record<DocKind, AnyDoc[]> {
  const docs = allDocuments.filter((d) => !isDraft(d));

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

  for (const d of docs) {
    const k = getDocKind(d);
    buckets[k].push(d);
  }

  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k] = buckets[k].sort((a, b) => {
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      if (bd !== ad) return bd - ad;
      return String(a.title ?? "").localeCompare(String(b.title ?? ""));
    });
  });

  return buckets;
}

// ----------------------------------------------------------------------------
// Card props mapping (Vault + cards)
// ----------------------------------------------------------------------------
export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);

  const downloadUrl =
    doc.downloadUrl || doc.fileUrl || doc.pdfPath || doc.downloadFile || null;

  const coverAspect: ContentlayerCardProps["coverAspect"] =
    kind === "book" || kind === "canon" || kind === "print" ? "portrait" : "wide";

  return {
    type: kind,
    slug,
    href: getDocHref(doc),
    title: String(doc.title ?? "Untitled"),
    subtitle: (doc as any).subtitle ?? null,
    excerpt: doc.excerpt ?? null,
    description: doc.description ?? null,
    image: doc.coverImage ?? null,
    date: doc.date ?? null,
    tags: doc.tags ?? [],
    featured: Boolean((doc as any).featured),
    downloadUrl,
    coverAspect,
  };
}
// lib/contentlayer-helper.ts
import path from "node:path";

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
  _raw?: { flattenedPath: string };
  available?: boolean;
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

// -----------------------------
// ROOT-SAFE generated loader
// -----------------------------

type GeneratedModule = {
  allDocuments?: AnyDoc[];
  allPosts?: AnyDoc[];
  allDownloads?: AnyDoc[];
  allBooks?: AnyDoc[];
  allEvents?: AnyDoc[];
  allPrints?: AnyDoc[];
  allResources?: AnyDoc[];
  allCanons?: AnyDoc[];
  allShorts?: AnyDoc[];
  allStrategies?: AnyDoc[];
};

function loadGenerated(): GeneratedModule {
  // Server only. getStaticProps runs server-side.
  if (typeof window !== "undefined") {
    return {};
  }

  // ALWAYS resolve from project root
  const generatedPath = path.join(process.cwd(), ".contentlayer", "generated");

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(generatedPath) as GeneratedModule;
    return mod ?? {};
  } catch (e) {
    // If this happens, Contentlayer didn't run, or .contentlayer wasn't generated
    console.warn(
      `⚠️ Contentlayer generated module not found at: ${generatedPath}`,
    );
    return {};
  }
}

// -----------------------------
// Normalisation + publish rules
// -----------------------------

function normaliseSlug(doc: AnyDoc): string {
  const explicit = doc?.slug;
  if (explicit && typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }

  const flattened = doc?._raw?.flattenedPath;
  if (!flattened) return "untitled";

  const parts = flattened.split("/");
  return (parts[parts.length - 1] || flattened).replace(/\.mdx?$/, "");
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
  const raw = doc?.date;
  if (!raw || typeof raw !== "string") return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

// -----------------------------
// Public getters
// -----------------------------

export function getAllContentlayerDocs(): AnyDoc[] {
  const g = loadGenerated();
  return (g.allDocuments ?? []) as AnyDoc[];
}

export function getPublishedDocumentsByType(): Record<DocKind, AnyDoc[]> {
  const docs = getAllContentlayerDocs();

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

  for (const doc of docs) {
    if (!isPublished(doc)) continue;
    buckets[normaliseKind(doc)].push(doc);
  }

  (Object.keys(buckets) as DocKind[]).forEach((k) => {
    buckets[k].sort((a, b) => getDateValue(b) - getDateValue(a));
  });

  return buckets;
}

export function getCardPropsForDocument(doc: AnyDoc): ContentlayerCardProps {
  const slug = normaliseSlug(doc);
  const kind = normaliseKind(doc);

  const href = (doc?.href || doc?.url || `/${kind}s/${slug}`) as string;
  const downloadUrl = (doc?.downloadUrl || doc?.fileUrl || null) as
    | string
    | null;

  return {
    type: kind,
    slug,
    title: doc?.title || "Untitled",
    href,
    url: doc?.url || href,

    description: (doc as any)?.description ?? (doc as any)?.summary ?? null,
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

    resourceType: (doc as any)?.resourceType ?? null,
    applications: (doc as any)?.applications ?? null,

    downloadUrl,
    fileUrl: (doc as any)?.fileUrl ?? null,
  };
}

export function isContentlayerLoaded(): boolean {
  return getAllContentlayerDocs().length > 0;
}
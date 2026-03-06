// lib/server/mdx-collections.ts
// Generic, file-system based MDX loader for content/* collections.
// No Contentlayer dependency. Safe for Next pages/ (getStaticProps/getStaticPaths) and server runtimes.
//
// ✅ Includes alias normalization so "posts" can map to "blog", etc.
// ✅ Windows-safe path normalization
// ✅ Caching (short TTL in production) to keep API routes fast
// ✅ Draft filtering in production

import fs from "fs";
import path from "path";
import { promisify } from "util";
import matter from "gray-matter";
import { safeListFiles } from "@/lib/fs-utils";
import { safeSlice } from "@/lib/utils/safe";

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

export const CONTENT_ROOT = path.join(process.cwd(), "content");
const MD_EXTS = [".md", ".mdx"] as const;

// In-memory cache for production builds
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = process.env.NODE_ENV === "development" ? 0 : 60 * 1000; // 1 minute cache in production

/* -----------------------------------------------------------------------------
  COLLECTION ALIASES (SSOT)
  Your folder reality (confirmed):
    - content/blog
    - content/strategy
    - content/downloads
    - content/prints/resources/events/etc.
  So normalize common "logical" names to actual folder names.
----------------------------------------------------------------------------- */

const COLLECTION_ALIASES: Record<string, string> = {
  // Blog
  blog: "blog",
  posts: "blog",
  post: "blog",

  // Strategy
  strategy: "strategy",
  strategies: "strategy",

  // Downloads
  downloads: "downloads",
  download: "downloads",
  frameworks: "downloads",

  // Optional (if you ever add content/pages later)
  pages: "pages",
  site: "pages",
};

function normalizeCollection(name: string): string {
  const k = String(name || "").trim().toLowerCase();
  return COLLECTION_ALIASES[k] || k;
}

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */

type RawDoc = {
  collection: string; // normalized collection key (folder name)
  filePath: string;   // normalized path (forward slashes)
  slug: string;
  data: Record<string, unknown>;
  content: string;
  fileStats: {
    mtime: Date;
    birthtime: Date;
    size: number;
  };
};

export type MdxMeta = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  draft?: boolean;
  updated?: string;
  author?: string;
  readingTime?: number;
  [key: string]: unknown;
};

export type MdxDocument = MdxMeta & {
  content: string;
  fileStats: {
    mtime: Date;
    birthtime: Date;
    size: number;
  };
};

/* -----------------------------------------------------------------------------
  HELPERS
----------------------------------------------------------------------------- */

/** Validate and normalize slug */
function normalizeSlug(input: string): string {
  if (!input || typeof input !== "string") return "";

  let slug = input.toLowerCase().trim();

  // Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, "-");

  // Remove invalid characters
  slug = slug.replace(/[^a-z0-9-]/g, "");

  // Remove multiple consecutive hyphens
  slug = slug.replace(/--+/g, "-");

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, "");

  return slug;
}

/** Cross-platform path normalization */
function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function isMdxFile(absPath: string): boolean {
  const ext = path.extname(absPath).toLowerCase();
  return MD_EXTS.includes(ext as any);
}

/** Sort by date descending, fallback to file mtime, then slug */
function sortByDateDesc<T extends { date?: string | null; fileStats?: { mtime: Date } }>(items: T[]): T[] {
  const toKey = (item: T) => {
    if (item.date) {
      const t = new Date(item.date).getTime();
      if (Number.isFinite(t)) return t;
    }
    if (item.fileStats?.mtime) return item.fileStats.mtime.getTime();
    return 0;
  };

  return [...(items || [])].sort((a, b) => {
    const keyA = toKey(a);
    const keyB = toKey(b);

    if (keyB !== keyA) return keyB - keyA;

    return (String((a as any).slug || "")).localeCompare(String((b as any).slug || ""));
  });
}

function getCollectionDir(collectionRaw: string): string | null {
  const collection = normalizeCollection(collectionRaw);
  const dir = path.join(CONTENT_ROOT, collection);

  try {
    const stats = fs.statSync(dir, { throwIfNoEntry: false } as any);
    if (stats?.isDirectory()) return dir;
  } catch {
    // silent
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[mdx-collections] Collection directory not found: ${dir}`);
  }
  return null;
}

function listCollectionFiles(collectionRaw: string): string[] {
  const collection = normalizeCollection(collectionRaw);
  const dir = getCollectionDir(collection);
  if (!dir) return [];

  // safeListFiles handles directories AND accidental file paths
  const files = safeListFiles(dir);

  return files.filter((filePath) => {
    if (!isMdxFile(filePath)) return false;

    // In production, filter out draft files
    if (process.env.NODE_ENV === "production") {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const { data } = matter(raw);
        if (data?.draft === true) return false;
      } catch {
        // If we can't read the file, include it and let later steps handle it
        return true;
      }
    }

    return true;
  });
}

/** Parse frontmatter with enhanced date parsing */
function parseFrontmatter(data: any, contentForReadingTime?: string): Record<string, unknown> {
  const result: Record<string, unknown> = { ...(data || {}) };

  // Normalize date strings -> YYYY-MM-DD if parseable
  if (result.date && typeof result.date === "string") {
    try {
      const d = new Date(result.date);
      if (Number.isFinite(d.getTime())) result.date = d.toISOString().split("T")[0];
    } catch {
      // keep as-is
    }
  }

  // Normalize tags
  if (result.tags) {
    if (typeof result.tags === "string") {
      result.tags = result.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    } else if (Array.isArray(result.tags)) {
      result.tags = (result.tags as any[])
        .map((t) => (typeof t === "string" ? t.trim() : t))
        .filter(Boolean);
    }
  }

  // If readingTime not present, compute from content
  if (!result.readingTime && typeof contentForReadingTime === "string") {
    const words = contentForReadingTime.split(/\s+/).filter(Boolean).length;
    result.readingTime = Math.max(1, Math.ceil(words / 200));
  }

  return result;
}

/* -----------------------------------------------------------------------------
  RAW LOADERS (ASYNC + SYNC)
----------------------------------------------------------------------------- */

async function readRawDocs(collectionRaw: string): Promise<RawDoc[]> {
  const collection = normalizeCollection(collectionRaw);
  const cacheKey = `rawDocs:${collection}`;
  const now = Date.now();

  // Cache hit
  const cached = cache.get(cacheKey);
  if (cached && CACHE_TTL > 0 && now - cached.timestamp < CACHE_TTL) {
    return cached.data as RawDoc[];
  }

  const files = listCollectionFiles(collection);
  const docs: RawDoc[] = [];

  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = safeSlice(files, i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const [raw, stats] = await Promise.all([readFile(filePath, "utf8"), stat(filePath)]);
          const { data, content } = matter(raw);

          // Skip drafts in production
          if (process.env.NODE_ENV === "production" && data?.draft === true) return null;

          const base = path.basename(filePath).replace(/\.(mdx?|MDX?)$/i, "");
          const fmSlug = data?.slug;

          const slug = normalizeSlug(
            typeof fmSlug === "string" && fmSlug.trim().length ? fmSlug : base
          );

          const parsedData = parseFrontmatter(data, content);

          return {
            collection,
            filePath: normalizePath(filePath),
            slug,
            data: parsedData,
            content,
            fileStats: {
              mtime: stats.mtime,
              birthtime: stats.birthtime,
              size: stats.size,
            },
          } as RawDoc;
        } catch (error) {
          console.error(`[mdx-collections] Error reading ${filePath}:`, error);
          return null;
        }
      })
    );

    for (const d of batchResults) if (d) docs.push(d);
  }

  cache.set(cacheKey, { data: docs, timestamp: now });
  return docs;
}

// Internal sync version for compatibility
function readRawDocsSync(collectionRaw: string): RawDoc[] {
  const collection = normalizeCollection(collectionRaw);
  const files = listCollectionFiles(collection);
  const docs: RawDoc[] = [];

  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const stats = fs.statSync(filePath);
      const { data, content } = matter(raw);

      if (process.env.NODE_ENV === "production" && data?.draft === true) continue;

      const base = path.basename(filePath).replace(/\.(mdx?|MDX?)$/i, "");
      const fmSlug = data?.slug;

      const slug = normalizeSlug(
        typeof fmSlug === "string" && fmSlug.trim().length ? fmSlug : base
      );

      const parsedData = parseFrontmatter(data, content);

      docs.push({
        collection,
        filePath: normalizePath(filePath),
        slug,
        data: parsedData,
        content,
        fileStats: {
          mtime: stats.mtime,
          birthtime: stats.birthtime,
          size: stats.size,
        },
      });
    } catch (error) {
      console.error(`[mdx-collections] Error reading ${filePath}:`, error);
    }
  }

  return docs;
}

/* -----------------------------------------------------------------------------
  META MAPPING
----------------------------------------------------------------------------- */

function toMeta(doc: RawDoc): MdxMeta {
  const anyData = doc.data as any;
  const fallbackTitle = path.basename(doc.filePath, path.extname(doc.filePath));

  const date =
    (typeof anyData.date === "string" && anyData.date) ||
    doc.fileStats.birthtime.toISOString().split("T")[0];

  const updated =
    (typeof anyData.updated === "string" && anyData.updated) ||
    doc.fileStats.mtime.toISOString().split("T")[0];

  const readingTime =
    typeof anyData.readingTime === "number"
      ? anyData.readingTime
      : Math.max(1, Math.ceil(doc.content.split(/\s+/).filter(Boolean).length / 200));

  return {
    slug: doc.slug,
    title: anyData.title ?? fallbackTitle,
    date,
    excerpt: anyData.excerpt ?? anyData.description ?? undefined,
    coverImage: anyData.coverImage ?? anyData.image ?? undefined,
    tags: Array.isArray(anyData.tags) ? anyData.tags : [],
    draft: anyData.draft ?? false,
    updated,
    author: anyData.author ?? undefined,
    readingTime,
    ...anyData,
  };
}

/* -----------------------------------------------------------------------------
  PUBLIC API
----------------------------------------------------------------------------- */

/** Invalidate cache for a specific collection (accepts alias) */
export function invalidateCollectionCache(collection: string): void {
  cache.delete(`rawDocs:${normalizeCollection(collection)}`);
}

/** Get all available collections (folders inside /content) */
export function getCollections(): string[] {
  try {
    if (!fs.existsSync(CONTENT_ROOT)) return [];
    const items = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });

    return items
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .sort();
  } catch {
    return [];
  }
}

/** Meta-only list for a collection (sorted by date desc if available). */
export async function getMdxCollectionMeta(collection: string): Promise<MdxMeta[]> {
  const c = normalizeCollection(collection);
  const docs = await readRawDocs(c);
  return sortByDateDesc(docs.map(toMeta));
}

/** Full documents (meta + content) for a collection. */
export async function getMdxCollectionDocuments(collection: string): Promise<MdxDocument[]> {
  const c = normalizeCollection(collection);
  const docs = await readRawDocs(c);

  const documents = docs.map((doc) => {
    const meta = toMeta(doc);
    return {
      ...meta,
      content: doc.content,
      fileStats: doc.fileStats,
    } as MdxDocument;
  });

  return sortByDateDesc(documents);
}

/** Single document lookup by slug (case-insensitive). */
export async function getMdxDocumentBySlug(collection: string, slug: string): Promise<MdxDocument | null> {
  if (!slug) return null;

  const c = normalizeCollection(collection);
  const target = normalizeSlug(slug);

  const docs = await getMdxCollectionDocuments(c);
  return docs.find((d) => normalizeSlug(d.slug) === target) ?? null;
}

/** Get adjacent documents (previous/next) for navigation */
export async function getAdjacentDocuments(
  collection: string,
  currentSlug: string
): Promise<{ prev: MdxMeta | null; next: MdxMeta | null }> {
  const c = normalizeCollection(collection);
  const docs = await getMdxCollectionMeta(c);

  const cur = normalizeSlug(currentSlug);
  const idx = docs.findIndex((d) => normalizeSlug(d.slug) === cur);

  if (idx === -1) return { prev: null, next: null };

  return {
    prev: idx > 0 ? docs[idx - 1] ?? null : null,
    next: idx < docs.length - 1 ? docs[idx + 1] ?? null : null,
  };
}

/** Search documents by text in content or metadata */
export async function searchMdxDocuments(collection: string, query: string): Promise<MdxMeta[]> {
  const q = String(query || "").trim();
  if (!q) return [];

  const c = normalizeCollection(collection);
  const docs = await getMdxCollectionDocuments(c);
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1);

  return docs
    .filter((doc) => {
      const searchableText = `
        ${doc.title || ""}
        ${doc.excerpt || ""}
        ${doc.content || ""}
        ${(doc.tags || []).join(" ")}
      `.toLowerCase();

      return terms.every((t) => searchableText.includes(t));
    })
    .map(({ content, fileStats, ...meta }) => meta);
}

/* -----------------------------------------------------------------------------
  SYNC API (for legacy getStaticProps/getStaticPaths usage)
----------------------------------------------------------------------------- */

export function getMdxCollectionMetaSync(collection: string): MdxMeta[] {
  const c = normalizeCollection(collection);
  const docs = readRawDocsSync(c);
  return sortByDateDesc(docs.map(toMeta));
}

export function getMdxCollectionDocumentsSync(collection: string): MdxDocument[] {
  const c = normalizeCollection(collection);
  const docs = readRawDocsSync(c);

  const documents = docs.map((doc) => {
    const meta = toMeta(doc);
    return {
      ...meta,
      content: doc.content,
      fileStats: doc.fileStats,
    } as MdxDocument;
  });

  return sortByDateDesc(documents);
}

export function getMdxDocumentBySlugSync(collection: string, slug: string): MdxDocument | null {
  const c = normalizeCollection(collection);
  const target = normalizeSlug(slug);
  const docs = getMdxCollectionDocumentsSync(c);
  return docs.find((d) => normalizeSlug(d.slug) === target) ?? null;
}
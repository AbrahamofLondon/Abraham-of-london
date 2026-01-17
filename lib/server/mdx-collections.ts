// lib/server/mdx-collections.ts
// Generic, file-system based MDX loader for content/* collections.
// No Contentlayer dependency. Safe for Netlify / Next static builds.

import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import matter from "gray-matter";
import { safeListFiles } from "@/lib/fs-utils";

const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const exists = promisify(fs.exists);

export const CONTENT_ROOT = path.join(process.cwd(), "content");
const MD_EXTS = [".md", ".mdx"] as const;
const VALID_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// In-memory cache for production builds
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = process.env.NODE_ENV === "development" ? 0 : 60 * 1000; // 1 minute cache in production

type RawDoc = {
  collection: string;
  filePath: string;
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

/** Validate and normalize slug */
function normalizeSlug(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Convert to lowercase and trim
  let slug = input.toLowerCase().trim();
  
  // Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, '-');
  
  // Remove invalid characters
  slug = slug.replace(/[^a-z0-9-]/g, '');
  
  // Remove multiple consecutive hyphens
  slug = slug.replace(/--+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
}

/** Sort by date descending, fallback to file mtime, then slug */
function sortByDateDesc<T extends { date?: string | null; fileStats?: { mtime: Date } }>(items: T[]): T[] {
  const toKey = (item: T) => {
    // Priority 1: Frontmatter date
    if (item.date) {
      const t = new Date(item.date).getTime();
      if (Number.isFinite(t)) return t;
    }
    
    // Priority 2: File modification time
    if (item.fileStats?.mtime) {
      return item.fileStats.mtime.getTime();
    }
    
    // Fallback: 0
    return 0;
  };
  
  return [...items].sort((a, b) => {
    const keyA = toKey(a);
    const keyB = toKey(b);
    
    if (keyB !== keyA) return keyB - keyA;
    
    // Fallback to alphabetical by slug
    return (((a as any).slug || '') as string).localeCompare((((b as any).slug || '') as string));
  });
}

function getCollectionDir(collection: string): string | null {
  const dir = path.join(CONTENT_ROOT, collection);
  
  try {
    const stats = fs.statSync(dir, { throwIfNoEntry: false });
    if (stats?.isDirectory()) return dir;
  } catch {
    // In production, we might want to log this but not throw
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Collection directory not found: ${dir}`);
    }
  }
  return null;
}

function isMdxFile(absPath: string): boolean {
  const ext = path.extname(absPath).toLowerCase();
  return MD_EXTS.includes(ext as any);
}

/** Cross-platform path normalization */
function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function listCollectionFiles(collection: string): string[] {
  const dir = getCollectionDir(collection);
  if (!dir) return [];

  // ✅ safeListFiles handles directories AND accidental file paths
  const files = safeListFiles(dir);

  // Only MD/MDX files, filter out drafts in production
  return files.filter(filePath => {
    if (!isMdxFile(filePath)) return false;
    
    // In production, filter out draft files
    if (process.env.NODE_ENV === 'production') {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(raw);
        if (data.draft === true) return false;
      } catch {
        // If we can't read the file, include it and let later steps handle it
        return true;
      }
    }
    
    return true;
  });
}

/** Parse frontmatter with enhanced date parsing */
function parseFrontmatter(data: any): Record<string, unknown> {
  const result: Record<string, unknown> = { ...data };
  
  // Normalize date strings
  if (result.date && typeof result.date === 'string') {
    try {
      // Handle ISO strings and other formats
      const date = new Date(result.date);
      if (Number.isFinite(date.getTime())) {
        result.date = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
    } catch {
      // Keep original if parsing fails
    }
  }
  
  // Normalize tags
  if (result.tags) {
    if (typeof result.tags === 'string') {
      result.tags = result.tags.split(',').map((tag: string) => tag.trim());
    } else if (Array.isArray(result.tags)) {
      result.tags = result.tags.map(tag => 
        typeof tag === 'string' ? tag.trim() : tag
      );
    }
  }
  
  // Calculate reading time if not provided
  if (!result.readingTime && result.content) {
    const words = (result.content as string).split(/\s+/).length;
    result.readingTime = Math.ceil(words / 200); // 200 words per minute
  }
  
  return result;
}

async function readRawDocs(collection: string): Promise<RawDoc[]> {
  const cacheKey = `rawDocs:${collection}`;
  const now = Date.now();
  
  // Check cache
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL) {
      return cached.data as RawDoc[];
    }
  }
  
  const files = listCollectionFiles(collection);
  const docs: RawDoc[] = [];

  // Process files in batches for better performance
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(async (filePath) => {
      try {
        const [raw, stats] = await Promise.all([
          readFile(filePath, 'utf8'),
          stat(filePath)
        ]);
        
        const { data, content } = matter(raw);
        
        // Skip drafts in production
        if (process.env.NODE_ENV === 'production' && data.draft === true) {
          return null;
        }
        
        const base = path.basename(filePath).replace(/\.(mdx?|MDX?)$/i, '');
        const fmSlug = data?.slug;
        
        // Use normalized slug from frontmatter or filename
        const slug = normalizeSlug(
          typeof fmSlug === 'string' && fmSlug.trim().length ? fmSlug : base
        );
        
        const parsedData = parseFrontmatter(data);
        
        return {
          collection,
          filePath: normalizePath(filePath),
          slug,
          data: parsedData,
          content,
          fileStats: {
            mtime: stats.mtime,
            birthtime: stats.birthtime,
            size: stats.size
          }
        };
      } catch (error) {
        // Log but don't fail the whole batch
        console.error(`Error reading ${filePath}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    for (const doc of batchResults) {
      if (doc) docs.push(doc);
    }
  }
  
  // Update cache
  cache.set(cacheKey, { data: docs, timestamp: now });
  
  return docs;
}

function toMeta(doc: RawDoc): MdxMeta {
  const anyData = doc.data as any;
  return {
    slug: doc.slug,
    title: anyData.title ?? path.basename(doc.filePath, path.extname(doc.filePath)),
    date: anyData.date ?? doc.fileStats.birthtime.toISOString().split('T')[0],
    excerpt: anyData.excerpt ?? anyData.description ?? undefined,
    coverImage: anyData.coverImage ?? anyData.image ?? undefined,
    tags: anyData.tags ?? [],
    draft: anyData.draft ?? false,
    updated: anyData.updated ?? doc.fileStats.mtime.toISOString().split('T')[0],
    author: anyData.author ?? undefined,
    readingTime: anyData.readingTime ?? Math.ceil(doc.content.split(/\s+/).length / 200),
    ...anyData
  };
}

/** Invalidate cache for a specific collection */
export function invalidateCollectionCache(collection: string): void {
  cache.delete(`rawDocs:${collection}`);
}

/** Get all available collections */
export function getCollections(): string[] {
  try {
    if (!fs.existsSync(CONTENT_ROOT)) return [];
    
    const items = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name)
      .sort();
  } catch {
    return [];
  }
}

/** Meta-only list for a collection (sorted by date desc if available). */
export async function getMdxCollectionMeta(collection: string): Promise<MdxMeta[]> {
  const docs = await readRawDocs(collection);
  const metas = docs.map(doc => toMeta(doc));
  return sortByDateDesc(metas);
}

/** Full documents (meta + content) for a collection. */
export async function getMdxCollectionDocuments(collection: string): Promise<MdxDocument[]> {
  const docs = await readRawDocs(collection);
  const documents = docs.map(doc => {
    const meta = toMeta(doc);
    return { 
      ...meta, 
      content: doc.content,
      fileStats: doc.fileStats
    };
  });
  return sortByDateDesc(documents);
}

/** Single document lookup by slug (case-insensitive). */
export async function getMdxDocumentBySlug(
  collection: string,
  slug: string
): Promise<MdxDocument | null> {
  if (!slug) return null;
  
  const target = normalizeSlug(slug);
  const docs = await getMdxCollectionDocuments(collection);
  
  return docs.find(d => normalizeSlug(d.slug) === target) ?? null;
}

/** Get adjacent documents (previous/next) for navigation */
export async function getAdjacentDocuments(
  collection: string,
  currentSlug: string
): Promise<{ prev: MdxMeta | null; next: MdxMeta | null }> {
  const docs = await getMdxCollectionMeta(collection);
  const currentIndex = docs.findIndex(d => normalizeSlug(d.slug) === normalizeSlug(currentSlug));
  
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }
  
  return {
    prev: (currentIndex > 0 ? (docs[currentIndex - 1] ?? null) : null),
    next: (currentIndex < docs.length - 1 ? (docs[currentIndex + 1] ?? null) : null)
  };
}

/** Search documents by text in content or metadata */
export async function searchMdxDocuments(
  collection: string,
  query: string
): Promise<MdxMeta[]> {
  if (!query.trim()) return [];
  
  const docs = await getMdxCollectionDocuments(collection);
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  
  return docs.filter(doc => {
    const searchableText = `
      ${doc.title || ''}
      ${doc.excerpt || ''}
      ${doc.content}
      ${(doc.tags || []).join(' ')}
    `.toLowerCase();
    
    return searchTerms.every(term => searchableText.includes(term));
  }).map(({ content, fileStats, ...meta }) => meta); // Strip content for search results
}

// Sync versions for use in getStaticProps/getStaticPaths
export function getMdxCollectionMetaSync(collection: string): MdxMeta[] {
  const docs = readRawDocsSync(collection);
  const metas = docs.map(doc => toMeta(doc));
  return sortByDateDesc(metas);
}

export function getMdxCollectionDocumentsSync(collection: string): MdxDocument[] {
  const docs = readRawDocsSync(collection);
  return docs.map(doc => {
    const meta = toMeta(doc);
    return { ...meta, content: doc.content, fileStats: doc.fileStats };
  });
}

export function getMdxDocumentBySlugSync(collection: string, slug: string): MdxDocument | null {
  const target = normalizeSlug(slug);
  const docs = getMdxCollectionDocumentsSync(collection);
  return docs.find(d => normalizeSlug(d.slug) === target) ?? null;
}

// Internal sync version for compatibility
function readRawDocsSync(collection: string): RawDoc[] {
  const files = listCollectionFiles(collection);
  const docs: RawDoc[] = [];

  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      const { data, content } = matter(raw);
      
      if (process.env.NODE_ENV === 'production' && data.draft === true) {
        continue;
      }
      
      const base = path.basename(filePath).replace(/\.(mdx?|MDX?)$/i, '');
      const fmSlug = data?.slug;
      const slug = normalizeSlug(
        typeof fmSlug === 'string' && fmSlug.trim().length ? fmSlug : base
      );
      
      const parsedData = parseFrontmatter(data);
      
      docs.push({
        collection,
        filePath: normalizePath(filePath),
        slug,
        data: parsedData,
        content,
        fileStats: {
          mtime: stats.mtime,
          birthtime: stats.birthtime,
          size: stats.size
        }
      });
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
    }
  }
  
  return docs;
}




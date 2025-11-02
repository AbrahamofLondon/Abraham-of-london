// lib/mdx.ts (Final Data Serialization Fix)
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post";

function getContentDir(contentType: string) {
  return path.join(process.cwd(), "content", contentType);
}

// [Utility functions are assumed to be here or imported]
function toTitle(slug: string) { return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function stripMd(s: string) { return s.replace(/!\[[^\]]*]\([^)]+\)/g, "").replace(/\[[^\]]*]\([^)]+\)/g, "").replace(/[`#>*_~\-]+/g, " ").replace(/\s+/g, " ").trim(); }
function smartExcerpt(source: string, max = 180) { /* ... implementation ... */ return stripMd(source); }
function isLocalPath(src?: unknown): src is string { return typeof src === "string" && src.startsWith("/"); }
function safeDate(input: unknown): string | undefined {
  if (!(input instanceof Date) && typeof input !== 'string' && typeof input !== 'number') return undefined;
  const date = new Date(input);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}
function normalizeTags(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return undefined;
}
function pickCoverAspect(v: unknown): "book" | "wide" | "square" | null {
  return v === "book" || v === "wide" || v === "square" ? v : null;
}
function pickCoverFit(v: unknown): "cover" | "contain" | null {
  return v === "cover" || v === "contain" ? v : null;
}
function pickCoverPosition(v: unknown): "left" | "center" | "right" | null {
  return v === "left" || v === "center" || v === "right" ? v : null;
}

// --- Public API (CRITICAL FIX: Explicit null or empty array returns) ---

export function getContentSlugs(contentType: string): string[] {
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.mdx?$/i.test(f)).map((f) => f.replace(/\.mdx?$/i, ""));
}

export function getContentBySlug(
  contentType: string,
  slug: string,
  opts: { withContent?: boolean } = {},
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const dir = getContentDir(contentType);
  const mdx = path.join(dir, `${realSlug}.mdx`);
  const md = path.join(dir, `${realSlug}.md`);
  const fullPath = fs.existsSync(mdx) ? mdx : fs.existsSync(md) ? md : null;

  if (!fullPath) {
    // Return minimum required fields with null/safe values
    return { slug: realSlug, title: toTitle(realSlug), date: new Date().toISOString() };
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;

  const title = (typeof fm.title === "string" && fm.title.trim()) || toTitle(realSlug);
  const firstPara = (content || "").split(/\r?\n\r?\n/).find(Boolean) ?? "";
  const excerpt = (typeof fm.excerpt === "string" && fm.excerpt.trim()) || smartExcerpt(firstPara, 180);
  
  const item: Partial<PostMeta> & { content?: string } = {
    slug: realSlug,
    title,
    excerpt,
    date: safeDate(fm.date) || null, // Ensure date is null or string
    coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : null,
    readTime: typeof fm.readTime === "string" ? fm.readTime : null,
    category: typeof fm.category === "string" ? fm.category : null,
    author: typeof fm.author === "string" ? fm.author : null,
    tags: normalizeTags(fm.tags) || null,
    summary: typeof fm.summary === "string" ? fm.summary : null,
    location: typeof fm.location === "string" ? fm.location : null,
    subtitle: typeof fm.subtitle === "string" ? fm.subtitle : null,
    coverAspect: pickCoverAspect(fm.coverAspect) || null,
    coverFit: pickCoverFit(fm.coverFit) || null,
    coverPosition: pickCoverPosition(fm.coverPosition) || null,
  };

  if (opts.withContent) item.content = content;
  
  // Final check to replace any accidental undefineds with null
  Object.keys(item).forEach(key => {
    if (item[key] === undefined) {
      item[key] = null;
    }
  });

  return item;
}

type GetAllOptions = { includeDrafts?: boolean; limit?: number };

export function getAllContent(contentType: string, options: GetAllOptions = {}): PostMeta[] {
  const { includeDrafts = false, limit } = options;
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];

  const files = getContentSlugs(contentType);
  const items = files
    .map((slug) => {
      const item = getContentBySlug(contentType, slug) as PostMeta;
      const dir = getContentDir(contentType);
      const filePath = path.join(dir, `${slug}.mdx`) || path.join(dir, `${slug}.md`);
      
      const raw = fs.readFileSync(filePath, "utf8");
      const fm = matter(raw).data;

      if (!includeDrafts && (fm.draft === true || slug.startsWith('_'))) return null;
      return item;
    })
    .filter(Boolean) as PostMeta[];

  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

export function getAllPosts(options: GetAllOptions = {}): PostMeta[] {
    return getAllContent('blog', options);
}

export function getLatestPosts(limit = 3): PostMeta[] {
    return getAllContent('blog', { limit });
}
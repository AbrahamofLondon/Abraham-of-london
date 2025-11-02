// lib/mdx.ts (The Unified Code - Final Version)
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

// [Utility functions like toTitle, stripMd, smartExcerpt, etc. are assumed to be here]

function toTitle(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function stripMd(s: string) {
  return s
    .replace(/!\[[^\]]*]\([^)]+\)/g, "") // images
    .replace(/\[[^\]]*]\([^)]+\)/g, "")  // links
    .replace(/[`#>*_~\-]+/g, " ")        // md tokens
    .replace(/\s+/g, " ")
    .trim();
}
function smartExcerpt(source: string, max = 180) {
  const plain = stripMd(source);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return (at > 80 ? cut.slice(0, at) : plain.slice(0, max)).trim() + "…";
}
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
function pickCoverAspect(v: unknown): "book" | "wide" | "square" | undefined {
  return v === "book" || v === "wide" || v === "square" ? v : undefined;
}
function pickCoverFit(v: unknown): "cover" | "contain" | undefined {
  return v === "cover" || v === "contain" ? v : undefined;
}
function pickCoverPosition(v: unknown): "left" | "center" | "right" | undefined {
  return v === "left" || v === "center" || v === "right" ? v : undefined;
}

// --- Public API (Named Exports) ---

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
    date: safeDate(fm.date),
    coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : undefined,
    readTime: typeof fm.readTime === "string" ? fm.readTime : undefined,
    category: typeof fm.category === "string" ? fm.category : undefined,
    author: typeof fm.author === "string" ? fm.author : undefined,
    tags: normalizeTags(fm.tags),
    summary: typeof fm.summary === "string" ? fm.summary : undefined,
    location: typeof fm.location === "string" ? fm.location : undefined,
    subtitle: typeof fm.subtitle === "string" ? fm.subtitle : undefined,
    coverAspect: pickCoverAspect(fm.coverAspect),
    coverFit: pickCoverFit(fm.coverFit),
    coverPosition: pickCoverPosition(fm.coverPosition),
  };

  if (opts.withContent) item.content = content;
  return item;
}

type GetAllOptions = { includeDrafts?: boolean; limit?: number };

// ✅ Fixes TypeError: (0 , m.getAllPosts) is not a function
export function getAllContent(contentType: string, options: GetAllOptions = {}): PostMeta[] {
  const { includeDrafts = false, limit } = options;
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => /\.mdx?$/i.test(f));

  const items: PostMeta[] = files
    .map((file) => {
      const slug = file.replace(/\.mdx?$/i, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const fm = matter(raw).data;

      if (!includeDrafts && (fm.draft === true || slug.startsWith('_'))) return null;
      
      // We rely on getContentBySlug for the PostMeta object structure to ensure consistency
      return getContentBySlug(contentType, slug) as PostMeta;
    })
    .filter(Boolean) as PostMeta[];

  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

// This function must exist for pages/index.tsx and pages/blog/index.tsx
export function getAllPosts(options: GetAllOptions = {}): PostMeta[] {
    return getAllContent('blog', options);
}

export function getLatestPosts(limit = 3): PostMeta[] {
    return getAllContent('blog', { limit });
}
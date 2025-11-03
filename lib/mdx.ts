// lib/mdx.ts (ABSOLUTE FINAL DATA UTILITY)
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

// --- Utility Functions ---

function toTitle(slug: string) { return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
function stripMd(s: string) { 
  return s.replace(/!\[[^\]]*]\([^)]+\)/g, "").replace(/\[[^\]]*]\([^)]+\)/g, "").replace(/[`#>*_~\-]+/g, " ").replace(/\s+/g, " ").trim(); 
}
function smartExcerpt(source: string, max = 180) { 
  const plain = stripMd(source);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return (at > 80 ? cut.slice(0, at) : plain.slice(0, max)).trim() + "…";
}
function isLocalPath(src?: unknown): src is string { return typeof src === "string" && src.startsWith("/"); }

// CRITICAL FIX: safeDate must return null, NOT undefined, for serialization safety
function safeDate(input: unknown): string | null { 
  if (!(input instanceof Date) && typeof input !== 'string' && typeof input !== 'number') return null;
  const date = new Date(input);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeTags(v: unknown): string[] | null { 
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return null;
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

// --- Public API ---

export function getContentSlugs(contentType: string): string[] {
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];
  // Ensure we only collect slugs for existing MDX/MD files
  return fs.readdirSync(dir)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

export function getContentBySlug(
  contentType: string,
  slug: string,
  opts: { withContent?: boolean } = {},
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const dir = getContentDir(contentType);
  
  // CRITICAL ROBUSTNESS CHECK: Find the correct file path
  let fullPath: string | null = null;
  const potentialPaths = [`${realSlug}.mdx`, `${realSlug}.md`];

  for (const p of potentialPaths) {
    const checkPath = path.join(dir, p);
    if (fs.existsSync(checkPath)) {
      fullPath = checkPath;
      break;
    }
  }

  // CRITICAL FIX for ENOENT crash: if the file is not found, return a safe object.
  if (!fullPath) {
    return { slug: realSlug, title: toTitle(realSlug), date: null, author: null };
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
    date: safeDate(fm.date) || null,
    coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : null,
    readTime: typeof fm.readTime === "string" ? fm.readTime : null,
    category: typeof fm.category === "string" ? fm.category : null,
    author: typeof fm.author === "string" ? fm.author : null,
    tags: normalizeTags(fm.tags), // This returns string[] or null
    summary: typeof fm.summary === "string" ? fm.summary : null, // Fixes serialization crash
    location: typeof fm.location === "string" ? fm.location : null,
    subtitle: typeof fm.subtitle === "string" ? fm.subtitle : null,
    coverAspect: pickCoverAspect(fm.coverAspect),
    coverFit: pickCoverFit(fm.coverFit),
    coverPosition: pickCoverPosition(fm.coverPosition),
  };

  if (opts.withContent) item.content = content;
  
  // Final check to replace any accidental undefineds with null for JSON serialization
  Object.keys(item).forEach(key => {
    if (item[key] === undefined) {
      (item as any)[key] = null;
    }
  });

  return item;
}

type GetAllOptions = { includeDrafts?: boolean; limit?: number };

export function getAllContent(contentType: string, options: GetAllOptions = {}): PostMeta[] {
  const { includeDrafts = false, limit } = options;
  const slugs = getContentSlugs(contentType);
  
  const items = slugs
    .map((slug) => {
      // CRITICAL: Rely ONLY on getContentBySlug, which handles file reading safely
      const item = getContentBySlug(contentType, slug) as PostMeta;
      
      // Safety check for drafts/leading underscores
      if (!includeDrafts && slug.startsWith('_')) return null;

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

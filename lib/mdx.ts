// lib/mdx.ts
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post";

// ✅ UPGRADE: Generic function to get the directory for any content type
function getContentDir(contentType: string) {
  return path.join(process.cwd(), "content", contentType);
}

// --- Utils (mostly unchanged but hardened) ---
function toTitle(slug: string) { /* ... same as your file ... */ }
function stripMd(s: string) { /* ... same as your file ... */ }
function smartExcerpt(source: string, max = 180) { /* ... same as your file ... */ }
function isLocalPath(src?: unknown): src is string { return typeof src === "string" && src.startsWith("/"); }

// ✅ UPGRADE: More robust date handling
function safeDate(input: unknown): string | undefined {
  if (!(input instanceof Date) && typeof input !== 'string' && typeof input !== 'number') return undefined;
  const date = new Date(input);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeTags(v: unknown): string[] | undefined { /* ... same as your file ... */ }

// --- Public API (Now Generic for All Content Types) ---

/** ✅ UPGRADE: Get slugs for any content type (e.g., 'blog', 'books', 'events') */
export function getContentSlugs(contentType: string): string[] {
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.mdx?$/i.test(f)).map((f) => f.replace(/\.mdx?$/i, ""));
}

/** ✅ UPGRADE: Get a single piece of content by slug and type */
export function getContentBySlug(
  contentType: string,
  slug: string,
  opts: { withContent?: boolean } = {},
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const dir = getContentDir(contentType);
  const fullPath = fs.existsSync(path.join(dir, `${realSlug}.mdx`))
    ? path.join(dir, `${realSlug}.mdx`)
    : fs.existsSync(path.join(dir, `${realSlug}.md`))
    ? path.join(dir, `${realSlug}.md`)
    : null;

  if (!fullPath) return { slug: realSlug, title: toTitle(realSlug) };

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;

  const item: Partial<PostMeta> & { content?: string } = {
    slug: realSlug,
    title: (typeof fm.title === "string" && fm.title.trim()) || toTitle(realSlug),
    excerpt: (typeof fm.excerpt === "string" && fm.excerpt.trim()) || smartExcerpt(content, 180),
    date: safeDate(fm.date),
    coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : undefined,
    readTime: typeof fm.readTime === "string" ? fm.readTime : undefined,
    category: typeof fm.category === "string" ? fm.category : undefined,
    author: typeof fm.author === "string" ? fm.author : undefined,
    tags: normalizeTags(fm.tags),
    // Add other fields you use, like summary, location, etc.
    summary: typeof fm.summary === "string" ? fm.summary : undefined,
    location: typeof fm.location === "string" ? fm.location : undefined,
  };

  if (opts.withContent) item.content = content;
  return item;
}

/** ✅ UPGRADE: Get all content for a specific type, with sanitization */
export function getAllContent(contentType: string, limit?: number): PostMeta[] {
  const slugs = getContentSlugs(contentType);

  const items = slugs
    .map((slug) => getContentBySlug(contentType, slug) as PostMeta)
    .filter((item) => {
      const fm = matter(fs.readFileSync(path.join(getContentDir(contentType), `${item.slug}.mdx`), "utf8")).data;
      return fm.draft !== true;
    });

  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}
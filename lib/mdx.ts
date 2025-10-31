// lib/mdx.ts
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post"; // Assuming this type is generic enough

// ✅ UPGRADE: This is now a function to get the directory for any content type
function getContentDir(contentType: string) {
  return path.join(process.cwd(), "content", contentType);
}

/* ------------ utils (unchanged but still excellent) ------------ */
function toTitle(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function stripMd(s: string) {
  return s
    .replace(/!\[[^\]]*]\([^)]+\)/g, "") // images
    .replace(/\[[^\]]*]\([^)]+\)/g, "") // links
    .replace(/[`#>*_~\-]+/g, " ")       // md tokens
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
function isLocalPath(src?: unknown): src is string {
  return typeof src === "string" && src.startsWith("/");
}
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

/* ------------ public API (Now Generic for Any Content Type) ------------ */

/** ✅ UPGRADE: Get slugs for any content type (e.g., 'blog', 'books') */
export function getContentSlugs(contentType: string): string[] {
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

/** ✅ UPGRADE: Get a single piece of content by slug and type */
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
    // Return a minimal object if file not found
    return { slug: realSlug, title: toTitle(realSlug) };
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
    // Add any other fields you use here
  };

  if (opts.withContent) item.content = content;
  return item;
}

/** ✅ UPGRADE: Get all content for a specific type */
export function getAllContent(contentType: string): PostMeta[] {
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => /\.mdx?$/i.test(f));

  const items: PostMeta[] = files
    .map((file) => {
      const slug = file.replace(/\.mdx?$/i, "");
      const item = getContentBySlug(contentType, slug) as PostMeta;
      // Filter out drafts
      const fm = matter(fs.readFileSync(path.join(dir, file), "utf8")).data;
      if (fm.draft === true) return null;
      return item;
    })
    .filter(Boolean) as PostMeta[];

  // Sort newest first
  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return items;
}
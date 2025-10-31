// lib/mdx.ts
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

// --- Utils ---
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

// --- Public API ---

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
  const fullPath = fs.existsSync(path.join(dir, `${realSlug}.mdx`))
    ? path.join(dir, `${realSlug}.mdx`)
    : fs.existsSync(path.join(dir, `${realSlug}.md`))
    ? path.join(dir, `${realSlug}.md`)
    : null;

  if (!fullPath) {
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
    summary: typeof fm.summary === "string" ? fm.summary : undefined,
    location: typeof fm.location === "string" ? fm.location : undefined,
    subtitle: typeof fm.subtitle === "string" ? fm.subtitle : undefined,
  };

  if (opts.withContent) item.content = content;
  return item;
}

export function getAllContent(contentType: string, limit?: number): PostMeta[] {
  const slugs = getContentSlugs(contentType);

  const items = slugs
    .map((slug) => getContentBySlug(contentType, slug) as PostMeta)
    .filter((item) => {
      const dir = getContentDir(contentType);
      const mdxPath = path.join(dir, `${item.slug}.mdx`);
      const mdPath = path.join(dir, `${item.slug}.md`);
      const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;
        
      if (!filePath) return false;
      
      const raw = fs.readFileSync(filePath, "utf8");
      const fm = matter(raw).data;
      return fm.draft !== true;
    });

  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}
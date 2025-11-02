// lib/mdx.ts
if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post";

// --- CRITICAL FIX: Base directory now handles all content types dynamically ---
function getContentDir(contentType: string) {
  // contentType will be 'blog', 'books', 'downloads', 'events', etc.
  return path.join(process.cwd(), "content", contentType);
}

/* ------------ utils ------------ */

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

// framing pickers (keeps types tight)
function pickCoverAspect(v: unknown): "book" | "wide" | "square" | undefined {
  return v === "book" || v === "wide" || v === "square" ? v : undefined;
}
function pickCoverFit(v: unknown): "cover" | "contain" | undefined {
  return v === "cover" || v === "contain" ? v : undefined;
}
function pickCoverPosition(v: unknown): "left" | "center" | "right" | undefined {
  return v === "left" || v === "center" || v === "right" ? v : undefined;
}

/* ------------ public API ------------ */

/** Return file names (no recursion) ending with .md or .mdx for a given content type */
// ✅ NEW: Generic function replacing getPostSlugs
export function getContentSlugs(contentType: string): string[] {
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

/** Read one piece of content by slug and type; set opts.withContent to include MDX content */
// ✅ NEW: Generic function replacing getPostBySlug
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

  const author =
    typeof fm.author === "string"
      ? fm.author
      : fm && typeof fm.author === "object" && fm.author !== null
      ? (fm as any).author?.name ?? undefined
      : undefined;
      
  const item: Partial<PostMeta> & { content?: string } = {
    slug: realSlug,
    title,
    excerpt,
    date: safeDate(fm.date),
    coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : undefined,
    readTime: typeof fm.readTime === "string" ? fm.readTime : undefined,
    category: typeof fm.category === "string" ? fm.category : undefined,
    author,
    tags: normalizeTags(fm.tags),
    summary: typeof fm.summary === "string" ? fm.summary : undefined,
    location: typeof fm.location === "string" ? fm.location : undefined,
    subtitle: typeof fm.subtitle === "string" ? fm.subtitle : undefined,

    // framing hints
    coverAspect: pickCoverAspect(fm.coverAspect),
    coverFit: pickCoverFit(fm.coverFit),
    coverPosition: pickCoverPosition(fm.coverPosition),
  };

  if (opts.withContent) item.content = content;
  return item;
}

type GetAllOptions = { includeDrafts?: boolean; limit?: number };

/** Read all content items (non-drafts by default) for a given type, newest first */
// ✅ NEW: Generic function replacing getAllPosts
export function getAllContent(contentType: string, options: GetAllOptions = {}): PostMeta[] {
  const { includeDrafts = false, limit } = options;
  const dir = getContentDir(contentType);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => /\.mdx?$/i.test(f));

  const items: PostMeta[] = files
    .map((file) => {
      const slug = file.replace(/\.mdx?$/i, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;

      // Filter out files starting with '_' (drafts) and files explicitly marked as draft
      if (!includeDrafts && (fm.draft === true || slug.startsWith('_'))) return null;
      
      const title = (typeof fm.title === "string" && fm.title.trim()) || toTitle(slug);
      const firstPara = (content || "").split(/\r?\n\r?\n/).find(Boolean) ?? "";
      const excerpt = (typeof fm.excerpt === "string" && fm.excerpt.trim()) || smartExcerpt(firstPara, 180);

      const author =
        typeof fm.author === "string"
          ? fm.author
          : fm && typeof fm.author === "object" && fm.author !== null
          ? (fm as any).author?.name ?? undefined
          : undefined;

      const meta: PostMeta = {
        slug,
        title,
        excerpt,
        date: safeDate(fm.date),
        coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : undefined,
        readTime: typeof fm.readTime === "string" ? fm.readTime : undefined,
        category: typeof fm.category === "string" ? fm.category : undefined,
        author,
        tags: normalizeTags(fm.tags),
        summary: typeof fm.summary === "string" ? fm.summary : undefined,
        location: typeof fm.location === "string" ? fm.location : undefined,
        subtitle: typeof fm.subtitle === "string" ? fm.subtitle : undefined,

        // framing hints
        coverAspect: pickCoverAspect(fm.coverAspect),
        coverFit: pickCoverFit(fm.coverFit),
        coverPosition: pickCoverPosition(fm.coverPosition),
      };

      return meta;
    })
    .filter(Boolean) as PostMeta[];

  // newest first (undefined dates sink)
  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}
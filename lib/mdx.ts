// lib/mdx.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

/* ------------ utils ------------ */

function toTitle(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripMd(s: string) {
  return s
    .replace(/!\[[^\]]*]\([^)]+\)/g, "") // images
    .replace(/\[[^\]]*]\([^)]+\)/g, "")  // links
    .replace(/[`#>*_~\-]+/g, " ")        // md tokens
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
  if (typeof input !== "string") return undefined;
  return Number.isNaN(Date.parse(input)) ? undefined : input;
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

/** Return file names (no recursion) ending with .md or .mdx */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

/** Read one post by slug; set opts.withContent to include MDX content */
export function getPostBySlug(
  slug: string,
  opts: { withContent?: boolean } = {},
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const mdx = path.join(BLOG_DIR, `${realSlug}.mdx`);
  const md = path.join(BLOG_DIR, `${realSlug}.md`);
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

  const post: Partial<PostMeta> & { content?: string } = {
    slug: realSlug,
    title,
    excerpt,
    date: safeDate(fm.date),
    coverImage: isLocalPath(fm.coverImage) ? (fm.coverImage as string) : undefined,
    readTime: typeof fm.readTime === "string" ? fm.readTime : undefined,
    category: typeof fm.category === "string" ? fm.category : undefined,
    author,
    tags: normalizeTags(fm.tags),

    // framing hints
    coverAspect: pickCoverAspect(fm.coverAspect),
    coverFit: pickCoverFit(fm.coverFit),
    coverPosition: pickCoverPosition(fm.coverPosition),
  };

  if (opts.withContent) post.content = content;
  return post;
}

type GetAllOptions = { includeDrafts?: boolean; limit?: number };

/** Read all posts (non-drafts by default), newest first */
export function getAllPosts(options: GetAllOptions = {}): PostMeta[] {
  const { includeDrafts = false, limit } = options;
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/i.test(f));

  const items: PostMeta[] = files
    .map((file) => {
      const slug = file.replace(/\.mdx?$/i, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data, content } = matter(raw);
      const fm = data as Record<string, unknown>;

      if (!includeDrafts && fm.draft === true) return null;

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

/** Convenience for feeds/landing pages */
export function getLatestPosts(limit = 3): PostMeta[] {
  return getAllPosts({ limit });
}

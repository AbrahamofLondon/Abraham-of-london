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
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[[^\]]*]\([^)]+\)/g, "")
    .replace(/[`#>*_~\-]+/g, " ")
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
  const t = Date.parse(input);
  return Number.isNaN(t) ? undefined : input;
}
function normalizeTags(v: unknown): string[] | undefined {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return undefined;
}

/* ------------ public API ------------ */

/** Return file names (no recursion) ending with .md or .mdx */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/i.test(f)).map((f) => f.replace(/\.mdx?$/i, ""));
}

/** Read one post by slug; set opts.withContent to include MDX content */
export function getPostBySlug(
  slug: string,
  opts: { withContent?: boolean } = {},
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const fullPathMdx = path.join(BLOG_DIR, `${realSlug}.mdx`);
  const fullPathMd = path.join(BLOG_DIR, `${realSlug}.md`);
  const fullPath = fs.existsSync(fullPathMdx) ? fullPathMdx : fs.existsSync(fullPathMd) ? fullPathMd : null;

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

    // NEW framing hints
    coverAspect: (fm.coverAspect as any) ?? null,
    coverFit: (fm.coverFit as any) ?? null,
    coverPosition: (fm.coverPosition as any) ?? null,
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

        // NEW
        coverAspect: (fm.coverAspect as any) ?? null,
        coverFit: (fm.coverFit as any) ?? null,
        coverPosition: (fm.coverPosition as any) ?? null,
      };

      return meta;
    })
    .filter(Boolean) as PostMeta[];

  items.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return typeof limit === "number" && limit > 0 ? items.slice(0, limit) : items;
}

export function getLatestPosts(limit = 3): PostMeta[] {
  return getAllPosts({ limit });
}

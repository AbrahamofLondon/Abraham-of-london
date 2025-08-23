// lib/mdx.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function toTitle(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripMd(s: string) {
  return s
    // images ![alt](url)
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    // links [text](url)
    .replace(/\[[^\]]*]\([^)]+\)/g, (_m, _g1) => "")
    // code fences / inline code / headings / blockquotes / list tokens
    .replace(/[`#>*_~\-]+/g, " ")
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

function smartExcerpt(source: string, max = 180) {
  const plain = stripMd(source);
  if (plain.length <= max) return plain;
  // cut at the last space before max, then add ellipsis
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

/** Return file names (no recursion) ending with .md or .mdx */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

/** Read one post by slug (optionally include raw content) */
export function getPostBySlug(
  slug: string,
  opts: { withContent?: boolean } = {},
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/i, "");
  const fullPathMd = path.join(BLOG_DIR, `${realSlug}.md`);
  const fullPathMdx = path.join(BLOG_DIR, `${realSlug}.mdx`);
  const fullPath = fs.existsSync(fullPathMdx)
    ? fullPathMdx
    : fs.existsSync(fullPathMd)
    ? fullPathMd
    : null;

  if (!fullPath) {
    return {
      slug: realSlug,
      title: toTitle(realSlug),
      date: new Date().toISOString(),
    };
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as Record<string, unknown>;

  const title =
    (typeof fm.title === "string" && fm.title.trim()) || toTitle(realSlug);

  const firstPara = (content || "").split(/\r?\n\r?\n/).find(Boolean) ?? "";
  const excerpt =
    (typeof fm.excerpt === "string" && fm.excerpt.trim()) ||
    smartExcerpt(firstPara, 180);

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
  };

  if (opts.withContent) post.content = content;

  return post;
}

type GetAllOptions = {
  includeDrafts?: boolean;
  limit?: number;
};

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

      // skip drafts unless opted in
      if (!includeDrafts && fm.draft === true) return null;

      const title =
        (typeof fm.title === "string" && fm.title.trim()) || toTitle(slug);

      const firstPara = (content || "").split(/\r?\n\r?\n/).find(Boolean) ?? "";
      const excerpt =
        (typeof fm.excerpt === "string" && fm.excerpt.trim()) ||
        smartExcerpt(firstPara, 180);

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

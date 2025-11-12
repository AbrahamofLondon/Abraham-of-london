// lib/mdx.ts
// Centralised MDX utilities: load, parse, and (optionally) serialize MDX files.
// App Router + server runtime safe.

import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

/** Canonical MDX content root (customise if needed) */
const CONTENT_ROOT = path.join(process.cwd(), "content");

/** Collections we typically use (blog, posts, books, downloads, print…) */
export type Collection = "blog" | "posts" | "books" | "downloads" | "print" | string;

/** Minimal, safe shape used across the app (re-exported elsewhere). */
export type PostMeta = {
  slug: string;
  title?: string;
  subtitle?: string;
  excerpt?: string;
  description?: string;
  date?: string;
  lastModified?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  author?: string;
  readTime?: string;
  // Optional SEO
  ogImage?: string;
  canonicalUrl?: string;
  ogDescription?: string;
  // Control flags
  draft?: boolean;
  published?: boolean;
  // Arbitrary extras
  [key: string]: unknown;
};

export type LoadedMdx = { meta: PostMeta; content: string };
export type SerializedMdx = { meta: PostMeta; mdx: any };

function ensureDir(p: string): string | null {
  const abs = path.isAbsolute(p) ? p : path.join(CONTENT_ROOT, p);
  try {
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) return abs;
  } catch {}
  return null;
}

function listMdFiles(absDir: string): string[] {
  try {
    return fs
      .readdirSync(absDir)
      .filter((f) => /\.(md|mdx)$/i.test(f))
      .map((f) => path.join(absDir, f));
  } catch {
    return [];
  }
}

function toCanonicalSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[\/\s-]+|[\/\s-]+$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-");
  return s || "untitled";
}

function fileToSlug(absFile: string): string {
  const base = path.basename(absFile).replace(/\.(mdx?|MDX?)$/, "");
  return toCanonicalSlug(base);
}

function normaliseBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return undefined;
}

function coerceArray<T = unknown>(v: unknown): T[] | undefined {
  return Array.isArray(v) ? (v as T[]) : undefined;
}

function toMeta(slug: string, data: Record<string, unknown>): PostMeta {
  return {
    slug,
    title: typeof data.title === "string" ? data.title : undefined,
    subtitle: typeof data.subtitle === "string" ? data.subtitle : undefined,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : undefined,
    description: typeof data.description === "string" ? data.description : undefined,
    date: typeof data.date === "string" ? data.date : undefined,
    lastModified: typeof data.lastModified === "string" ? data.lastModified : undefined,
    category: typeof data.category === "string" ? data.category : undefined,
    tags: coerceArray<string>(data.tags),
    coverImage: typeof data.coverImage === "string" ? data.coverImage : undefined,
    author: typeof data.author === "string" ? data.author : undefined,
    readTime: typeof data.readTime === "string" ? data.readTime : undefined,
    ogImage: typeof data.ogImage === "string" ? data.ogImage : undefined,
    canonicalUrl: typeof data.canonicalUrl === "string" ? data.canonicalUrl : undefined,
    ogDescription: typeof data.ogDescription === "string" ? data.ogDescription : undefined,
    draft: normaliseBool(data.draft),
    published: normaliseBool(data.published),
    // keep any other front-matter keys (namespaced safely)
    ...Object.fromEntries(
      Object.entries(data).filter(([k]) =>
        ![
          "title","subtitle","excerpt","description","date","lastModified","category","tags",
          "coverImage","author","readTime","ogImage","canonicalUrl","ogDescription","draft","published",
        ].includes(k),
      ),
    ),
  };
}

function isDraftLike(meta: PostMeta): boolean {
  if (meta.draft === true) return true;
  if (meta.published === false) return true;
  return false;
}

/** Get all slugs in a collection (without extensions). */
export function getMdxSlugs(collection: Collection): string[] {
  const abs = ensureDir(collection);
  if (!abs) return [];
  return listMdFiles(abs).map(fileToSlug);
}

/** Load a single MDX (raw content + parsed front-matter) */
export function getMdxBySlug(collection: Collection, slug: string): LoadedMdx | null {
  const abs = ensureDir(collection);
  if (!abs) return null;

  const candidates = [path.join(abs, `${slug}.mdx`), path.join(abs, `${slug}.md`)];
  const found = candidates.find((f) => {
    try { return fs.existsSync(f); } catch { return false; }
  });
  if (!found) return null;

  const raw = fs.readFileSync(found, "utf8");
  const fm = matter(raw);
  const meta = toMeta(slug, (fm.data ?? {}) as Record<string, unknown>);
  return { meta, content: fm.content ?? "" };
}

/** Serialize MDX (for MDXRemote) */
export async function getSerializedMdx(
  collection: Collection,
  slug: string,
  opts?: { 
    scope?: Record<string, unknown>; 
    mdxOptions?: any;  // Keep it loose to match next-mdx-remote v5
  },
): Promise<SerializedMdx | null> {
  const loaded = getMdxBySlug(collection, slug);
  if (!loaded) return null;
  const mdx = await serialize(loaded.content, {
    scope: { ...(opts?.scope ?? {}), ...loaded.meta },
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug],
      development: process.env.NODE_ENV === "development",
      ...(opts?.mdxOptions ?? {}),
    },
  });
  return { meta: loaded.meta, mdx };
}

/** Serialize arbitrary MDX string with our standard plugin stack */
export async function renderMdx(source: string, scope: Record<string, unknown> = {}) {
  return serialize(source, {
    scope,
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
  });
}

/** Get all MDX metas in a collection (optionally include drafts) */
export function getAllMdx(collection: Collection, options?: { includeDrafts?: boolean }): PostMeta[] {
  const slugs = getMdxSlugs(collection);
  const metas: PostMeta[] = [];
  for (const slug of slugs) {
    const item = getMdxBySlug(collection, slug);
    if (!item) continue;
    if (!options?.includeDrafts && isDraftLike(item.meta)) continue;
    metas.push(item.meta);
  }
  return metas.sort((a, b) => {
    const da = a.date ? +new Date(a.date) || 0 : 0;
    const db = b.date ? +new Date(b.date) || 0 : 0;
    return db - da;
  });
}

/** Convenience: get all posts from both blog/ and posts/ */
export function getAllPosts(options?: { includeDrafts?: boolean }): PostMeta[] {
  const a = getAllMdx("blog", options);
  const b = getAllMdx("posts", options);
  const seen = new Set<string>();
  const out: PostMeta[] = [];
  for (const m of [...a, ...b]) {
    if (!seen.has(m.slug)) { seen.add(m.slug); out.push(m); }
  }
  return out.sort((x, y) => {
    const dx = x.date ? +new Date(x.date) || 0 : 0;
    const dy = y.date ? +new Date(y.date) || 0 : 0;
    return dy - dx;
  });
}

/** Convenience: get one post by slug (checks blog/ then posts/) */
export function getPostBySlug(slug: string): LoadedMdx | null {
  return getMdxBySlug("blog", slug) ?? getMdxBySlug("posts", slug);
}

/** Named export that some modules alias/import as LibPostMeta */
export type { PostMeta as LibPostMeta };
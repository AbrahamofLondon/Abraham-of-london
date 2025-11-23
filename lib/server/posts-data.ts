// lib/server/posts-data.ts
// Blog loader using the generic MDX collections helper (NO Contentlayer).

import {
  getMdxCollectionMeta,
  getMdxCollectionDocuments,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

export type PostMeta = MdxMeta & {
  slug?: string; // will be normalised to "foo" (no "blog/" prefix) where we return it
  description?: string;
  updated?: string;
  author?: string;
  tags?: (string | number)[];
  category?: string;
  coverImage?: string;
  heroImage?: string;
  readTime?: string;
  resources?: {
    downloads?: { href?: string }[];
    reads?: { href?: string }[];
  };
  keyInsights?: string[];
  authorNote?: string;
  authorTitle?: string;
};

export type PostWithContent = PostMeta & {
  content: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Normalise slugs like "blog/foo" → "foo"
function cleanSlug(raw: string): string {
  return raw
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^blog\//i, "");
}

/**
 * Normalise an MdxMeta into a PostMeta with a clean slug and sensible defaults.
 */
function fromMdxMeta(meta: MdxMeta): PostMeta {
  const anyMeta = meta as any;

  // Try, in order: explicit slug, flattenedPath, fallback to empty
  const rawSlug: string =
    (anyMeta.slug as string | undefined) ??
    (anyMeta._raw?.flattenedPath as string | undefined) ??
    "";

  const slug = cleanSlug(String(rawSlug || ""));

  return {
    ...meta,
    slug: slug || undefined,
    description: anyMeta.description ?? anyMeta.excerpt ?? undefined,
    updated: anyMeta.updated ?? anyMeta.updatedAt ?? undefined,
    author: anyMeta.author ?? "Abraham of London",
    tags: anyMeta.tags ?? [],
    category: anyMeta.category ?? anyMeta.section ?? undefined,
    coverImage: anyMeta.coverImage ?? anyMeta.image ?? undefined,
    heroImage: anyMeta.heroImage ?? undefined,
    readTime: anyMeta.readTime ?? anyMeta.readingTime ?? undefined,
    resources: anyMeta.resources ?? undefined,
    keyInsights: anyMeta.keyInsights ?? undefined,
    authorNote: anyMeta.authorNote ?? undefined,
    authorTitle: anyMeta.authorTitle ?? undefined,
  };
}

function fromMdxDocument(doc: MdxDocument): PostWithContent {
  const { content, ...rest } = doc;
  const meta = fromMdxMeta(rest as unknown as MdxMeta);
  return { ...meta, content };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/** All blog post slugs for SSG paths, normalised to "slug" (no "blog/"). */
export function getPostSlugs(): string[] {
  const metas = getMdxCollectionMeta("blog");
  return metas
    .map((m) => fromMdxMeta(m).slug || "")
    .map((s) => cleanSlug(s))
    .filter((s) => s.length > 0);
}

/** All posts (meta only), with normalised slug. */
export function getAllPostsMeta(): PostMeta[] {
  const docs = getMdxCollectionDocuments("blog");
  return docs.map((d) => fromMdxMeta(d as unknown as MdxMeta));
}

/**
 * Single post lookup by slug (with optional field filter, Next.js-style).
 * Accepts both "foo" and "blog/foo" as incoming slug.
 */
export function getPostBySlug(
  slug: string,
  fields: string[] = [],
): (PostMeta & { content?: string }) | null {
  const target = cleanSlug(slug);

  // Let the underlying helper resolve it; it may expect either "foo" or "blog/foo"
  const doc =
    getMdxDocumentBySlug("blog", target) ??
    getMdxDocumentBySlug("blog", `blog/${target}`);

  if (!doc) return null;

  const full = fromMdxDocument(doc);

  if (!fields || fields.length === 0) {
    return full;
  }

  const filtered: Record<string, unknown> = {};
  for (const field of fields) {
    if (field === "content") {
      filtered.content = full.content;
      continue;
    }
    if (field in full) {
      filtered[field] = (full as any)[field];
    }
  }
  return filtered as PostMeta & { content?: string };
}
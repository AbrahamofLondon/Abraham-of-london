// lib/server/posts-data.ts
// Filesystem + MDX based blog loader (content/blog/*)

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

export type PostMeta = MdxMeta & {
  description?: string;
  excerpt?: string;
  coverImage?: string;
  heroImage?: string;
  updated?: string;
  author?: string;
  tags?: string[];
  category?: string;
  readTime?: string;
  resources?: {
    downloads?: { href?: string }[];
    reads?: { href?: string }[];
  };
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
};

export type PostWithContent = PostMeta & {
  content: string;
};

// ----------------- helpers -----------------

function cleanSlug(raw: unknown): string {
  return String(raw || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
}

function normaliseBlogSlug(raw: unknown): string {
  const s = cleanSlug(raw);
  return s.replace(/^blog\//i, "");
}

function normaliseDate(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (raw instanceof Date) {
    // keep it simple: YYYY-MM-DD
    return raw.toISOString().split("T")[0];
  }
  return String(raw);
}

function fromMdxMeta(meta: MdxMeta): PostMeta {
  const anyMeta = meta as any;

  const tags = Array.isArray(anyMeta.tags)
    ? (anyMeta.tags as unknown[]).map((t) => String(t))
    : undefined;

  return {
    ...meta,
    slug: normaliseBlogSlug(meta.slug),
    // normalise date to plain string
    date: normaliseDate(anyMeta.date),
    description: anyMeta.description ?? meta.excerpt ?? undefined,
    excerpt: anyMeta.excerpt ?? anyMeta.description ?? meta.excerpt ?? undefined,
    coverImage: anyMeta.coverImage ?? anyMeta.image ?? meta.coverImage,
    heroImage: anyMeta.heroImage ?? undefined,
    updated: normaliseDate(anyMeta.updated),
    author: anyMeta.author ?? undefined,
    tags,
    category: anyMeta.category ?? undefined,
    readTime: anyMeta.readTime ?? undefined,
    resources: anyMeta.resources ?? undefined,
    seoTitle: anyMeta.seoTitle ?? anyMeta.title ?? undefined,
    seoDescription:
      anyMeta.seoDescription ??
      anyMeta.excerpt ??
      anyMeta.description ??
      undefined,
    status: anyMeta.status ?? "published",
  };
}

function fromMdxDocument(doc: MdxDocument): PostWithContent {
  const meta = fromMdxMeta(doc);
  return {
    ...meta,
    content: doc.content,
  };
}

// ----------------- public API -----------------

export function getAllPostsMeta(): PostMeta[] {
  const metas = getMdxCollectionMeta("blog");
  return metas.map(fromMdxMeta);
}

export function getPostSlugs(): string[] {
  return getAllPostsMeta()
    .map((m) => m.slug)
    .filter((s): s is string => Boolean(s && s.trim()));
}

/**
 * Legacy-style accessor compatible with your /blog/[slug].tsx page.
 */
export function getPostBySlug(
  slug: string,
  fields: string[] = [],
): Partial<PostWithContent> {
  const key = normaliseBlogSlug(slug);
  const doc =
    getMdxDocumentBySlug("blog", key) ??
    // last-ditch: maybe slug came in already "blog/foo"
    getMdxDocumentBySlug("blog", cleanSlug(slug).replace(/^blog\//i, ""));

  if (!doc) {
    return {};
  }

  const full = fromMdxDocument(doc) as any;

  if (!fields || fields.length === 0) {
    return full;
  }

  const result: any = {};
  for (const field of fields) {
    if (field in full) {
      result[field] = full[field];
    }
  }
  return result;
}
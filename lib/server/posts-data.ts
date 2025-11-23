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

// -----------------  PUBLIC HELPERS  -----------------

// Normalise slugs like "blog/foo" → "foo"
function cleanSlug(raw: string): string {
  return raw
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^blog\//i, "");
}

function fromMdxMeta(meta: MdxMeta): PostMeta {
  const anyMeta = meta as any;

  // Always force a string slug and strip any "blog/" prefix
  const rawSlug: string =
    (typeof anyMeta.slug === "string" && anyMeta.slug.length > 0
      ? anyMeta.slug
      : typeof anyMeta._raw?.flattenedPath === "string"
      ? anyMeta._raw.flattenedPath
      : "") || "";

  const slug = cleanSlug(rawSlug);

  return {
    ...meta,
    // make sure slug is a clean string, never undefined
    slug,
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
  const meta = fromMdxMeta(rest);
  return { ...meta, content };
}

// -----------------  PUBLIC API  -----------------

/** All blog post slugs for SSG paths. */
export function getPostSlugs(): string[] {
  const metas = getMdxCollectionMeta("blog");
  return metas
    .map((m) => cleanSlug(String((m as any).slug || "")))
    .filter((s) => s.length > 0);
}

/** All posts (meta only). */
export function getAllPostsMeta(): PostMeta[] {
  const docs = getMdxCollectionDocuments("blog");
  return docs.map((d) => fromMdxMeta(d));
}

/** Single post lookup by slug (with optional field filter, Next.js-style). */
export function getPostBySlug(
  slug: string,
  fields: string[] = [],
): (PostMeta & { content?: string }) | null {
  const target = cleanSlug(slug);
  const doc =
    getMdxDocumentBySlug("blog", target) ??
    getMdxDocumentBySlug("blog", `blog/${target}`);
  if (!doc) return null;

  const full = fromMdxDocument(doc);

  if (!fields || fields.length === 0) {
    return full;
  }

  const filtered: any = {};
  for (const field of fields) {
    if (field === "content") {
      filtered.content = full.content;
      continue;
    }
    if (field in full) {
      filtered[field] = (full as any)[field];
    }
  }
  return filtered;
}
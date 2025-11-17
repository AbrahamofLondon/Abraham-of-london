// lib/server/posts-data.ts
// Server-side helpers for blog posts under content/posts/*

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

export type PostMeta = MdxMeta & {
  tags?: string[] | null;
  category?: string | null;
  author?: string | null;
};

export type PostWithContent = PostMeta & {
  content: string;
};

function normaliseTags(value: unknown): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);
  }
  const t = String(value).trim();
  return t ? [t] : null;
}

function fromMdxMeta(meta: MdxMeta): PostMeta {
  const anyMeta = meta as any;
  return {
    ...meta,
    author: anyMeta.author ?? null,
    category: anyMeta.category ?? null,
    tags: normaliseTags(anyMeta.tags),
  };
}

function fromMdxDocument(doc: MdxDocument): PostWithContent {
  const { content, ...rest } = doc;
  const asMeta = fromMdxMeta(rest);
  return {
    ...asMeta,
    content,
  };
}

/** All blog posts (meta only) */
export function getAllPostsMeta(): PostMeta[] {
  const metas = getMdxCollectionMeta("posts");
  return metas.map(fromMdxMeta);
}

/** Single post with content by slug */
export function getPostBySlug(slug: string): PostWithContent | null {
  const doc = getMdxDocumentBySlug("posts", slug);
  return doc ? fromMdxDocument(doc) : null;
}
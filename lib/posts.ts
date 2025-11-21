// lib/posts.ts
// Contentlayer-free adapter used by unified-content and /blog index

import {
  getAllPostsMeta,
  getPostBySlug as getPostBySlugServer,
  type PostMeta,
} from "@/lib/server/posts-data";

export type Post = PostMeta & {
  content?: string;
};

const DEFAULT_FIELDS = [
  "slug",
  "title",
  "description",
  "excerpt",
  "coverImage",
  "heroImage",
  "date",
  "updated",
  "author",
  "tags",
  "category",
  "readTime",
  "resources",
  "content",
  "seoTitle",
  "seoDescription",
  "status",
] as const;

/**
 * Legacy-style async API returning all posts.
 * Used by lib/server/unified-content.ts and any old callers.
 */
export async function getAllPosts(): Promise<Post[]> {
  const metas = getAllPostsMeta?.() ?? [];

  const posts: Post[] = metas.map((meta) => {
    const full = getPostBySlugServer(meta.slug, [...DEFAULT_FIELDS]) as any;
    const merged = { ...meta, ...(full || {}) };

    // JSON-safe clone to strip Dates etc.
    return JSON.parse(JSON.stringify(merged)) as Post;
  });

  return posts;
}

/**
 * Optional convenience if you ever want an async single-post helper.
 */
export async function getPostBySlug(
  slug: string,
): Promise<Post | null> {
  const full = getPostBySlugServer(slug, [...DEFAULT_FIELDS]) as any;
  if (!full || !full.title) return null;
  return JSON.parse(JSON.stringify(full)) as Post;
}
// lib/posts.ts
// Contentlayer-free adapter hooked into lib/server/posts-data

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
 * Used by lib/server/unified-content.ts
 */
export async function getAllPosts(): Promise<Post[]> {
  const metas = getAllPostsMeta?.() ?? [];

  const posts: Post[] = metas.map((meta) => {
    // pull full doc if needed
    const full = getPostBySlugServer(meta.slug, [...DEFAULT_FIELDS]) as any;
    const merged = { ...meta, ...(full || {}) };
    // JSON clone to strip Date objects etc.
    return JSON.parse(JSON.stringify(merged)) as Post;
  });

  return posts;
}

/**
 * Optional convenience single-fetch
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const full = getPostBySlugServer(slug, [...DEFAULT_FIELDS]) as any;
  if (!full || !full.title) return null;
  return JSON.parse(JSON.stringify(full)) as Post;
}
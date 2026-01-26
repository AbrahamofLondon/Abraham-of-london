// lib/posts.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * POSTS (SERVER-SAFE)
 * -------------------
 * Used by getStaticProps + API routes.
 * Must import server boundary for content collections.
 */

const WARN =
  process.env.NODE_ENV !== "production"
    ? (...args: any[]) => console.warn("[posts]", ...args)
    : () => {};

import { normalizeSlug } from "@/lib/content";
import { getPublishedPosts as getPublishedPostDocs } from "@/lib/content/server";

/**
 * Get post by slug (metadata only).
 */
export function getPostBySlug(slug: string): any | null {
  try {
    const target = normalizeSlug(slug);
    if (!target) return null;

    const posts = getPublishedPostDocs();
    return (
      posts.find((p: any) => normalizeSlug(p?.slug) === target) || null
    );
  } catch (e) {
    WARN(`getPostBySlug failed for "${slug}"`, e);
    return null;
  }
}

/**
 * Get post by slug including body/content if present (contentlayer usually stores `body`).
 * If your build uses a different field, adjust here ONCE.
 */
export function getPostBySlugWithContent(slug: string): any | null {
  try {
    const post = getPostBySlug(slug);
    if (!post) return null;

    // If content is stored in a known place, return it as-is.
    // Common patterns: post.body.raw, post.body.code, post._raw.flattenedPath
    return post;
  } catch (e) {
    WARN(`getPostBySlugWithContent failed for "${slug}"`, e);
    return null;
  }
}
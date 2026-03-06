// lib/server/posts-data.ts — SSOT ALIGNED (MDX: content/blog/*)
import "server-only";

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";

import type { Post } from "@/types/index";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";
import { safeSlice } from "@/lib/utils/safe";

export type PostWithContent = Post & { content: string };

function s(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function b(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const x = v.toLowerCase().trim();
    if (["true", "yes", "1"].includes(x)) return true;
    if (["false", "no", "0"].includes(x)) return false;
  }
  return undefined;
}
function n(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const x = parseInt(v, 10);
    return Number.isFinite(x) ? x : undefined;
  }
  return undefined;
}
function a(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x) => typeof x === "string") as string[];
  return out.length ? out : undefined;
}
function safeAccessLevel(v: unknown): AccessTier | undefined {
  if (!v) return undefined;
  return normalizeRequiredTier(v);
}

function fromMdxMeta(meta: MdxMeta): Post {
  const m: any = meta as any;

  const slug = s(m.slug) || "";
  const title = s(m.title) || "Untitled Post";

  return {
    slug,
    title,

    description: s(m.description),
    excerpt: s(m.excerpt) || s(m.description),
    subtitle: s(m.subtitle),

    date: s(m.date),
    author: s(m.author),
    category: s(m.category),
    tags: a(m.tags),
    featured: b(m.featured),
    readTime: s(m.readTime) || (n(m.readTime) as any) || (n(m.readingTime) as any),

    coverImage: s(m.coverImage) || s(m.image),
    ogImage: s(m.ogImage),

    series: s(m.series),
    seriesOrder: n(m.seriesOrder),

    canonicalUrl: s(m.canonicalUrl),
    metaTitle: s(m.metaTitle),
    metaDescription: s(m.metaDescription),
    keywords: a(m.keywords),
    lastModified: s(m.lastModified),

    draft: b(m.draft),
    published: m.published === undefined ? true : b(m.published),
    status: s(m.status) as any,

    accessLevel: safeAccessLevel(m.accessLevel) || "public",
    lockMessage: s(m.lockMessage),

    _raw: m._raw,
    _id: s(m._id),
    url: s(m.url),

    type: "post",
  } as any;
}

function fromMdxDocument(doc: MdxDocument): PostWithContent {
  const d: any = doc as any;
  const meta = fromMdxMeta(d);
  return {
    ...(meta as any),
    content: typeof d.content === "string" ? d.content : "",
    body: d.body || undefined,
  } as any;
}

// ACCESS
export function canAccessPost(post: Post, userTier?: string | AccessTier | null): boolean {
  const user = normalizeUserTier(userTier || "public");
  const required = (post as any).accessLevel || "public";
  return hasAccess(user, required);
}

export async function getAccessiblePosts(userTier?: string | AccessTier | null): Promise<Post[]> {
  const all = await getAllPostsMeta();
  const user = normalizeUserTier(userTier || "public");
  return all.filter((p: any) => hasAccess(user, p?.accessLevel || "public"));
}

// PUBLIC
export async function getAllPostsMeta(): Promise<Post[]> {
  try {
    // ✅ IMPORTANT: folder is content/blog (not content/posts)
    const metas = await getMdxCollectionMeta("blog");
    const posts = (metas || []).map(fromMdxMeta).filter((p: any) => p?.slug && p?.title);
    return posts;
  } catch (e) {
    console.error("[posts-data] getAllPostsMeta failed:", e);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostWithContent | null> {
  try {
    const doc = await getMdxDocumentBySlug("blog", slug);
    if (!doc) return null;
    return fromMdxDocument(doc);
  } catch (e) {
    console.error(`[posts-data] getPostBySlug failed (${slug}):`, e);
    return null;
  }
}

export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getAllPostsMeta();
  return all.filter((p: any) => p?.draft !== true && p?.status !== "draft" && (p?.published !== false));
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const all = await getPublishedPosts();
  return all.filter((p: any) => p?.featured === true);
}

export async function getRecentPosts(limit = 20): Promise<Post[]> {
  const all = await getPublishedPosts();
  const sorted = [...all].sort((a: any, b: any) => {
    const da = a?.date ? new Date(a.date).getTime() : 0;
    const db = b?.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
  return safeSlice(sorted, 0, limit);
}

export default {
  getAllPostsMeta,
  getPostBySlug,
  getPublishedPosts,
  getFeaturedPosts,
  getRecentPosts,
  canAccessPost,
  getAccessiblePosts,
};
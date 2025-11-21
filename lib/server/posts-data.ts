// lib/server/posts-data.ts
// Filesystem-based blog loader for content/blog/*
// Canonicalises slugs so /blog/[slug] routing is stable.

import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "@/lib/server/md-utils";

export type PostResources = {
  downloads?: { href?: string }[];
  reads?: { href?: string }[];
};

export type PostMeta = {
  slug: string;
  title?: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  heroImage?: string;
  date?: string;
  updated?: string;
  author?: string;
  tags?: (string | number)[];
  category?: string;
  readTime?: string;
  resources?: PostResources;
  [key: string]: unknown;
};

export type PostWithContent = PostMeta & {
  content: string;
};

// ------------------------
// slug helpers
// ------------------------

function cleanSlug(raw: unknown): string {
  // Input like " blog/when-the-storm-finds-you/ " → "when-the-storm-finds-you"
  return String(raw || "")
    .trim()
    .replace(/^\/+|\/+$/g, "") // trim leading/trailing slashes
    .replace(/^blog\//i, ""); // drop leading "blog/"
}

// ------------------------
// internal FS loader
// ------------------------

function loadAllPostsFromFs(): PostWithContent[] {
  const abs = ensureDir("blog"); // => content/blog
  if (!abs) return [];

  const files = listMdFiles(abs);
  if (!files.length) return [];

  const items: PostWithContent[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);

    const anyData = data as any;

    const rawSlug =
      (typeof anyData.slug === "string" && anyData.slug.trim()) ||
      fileToSlug(absFile);
    const slug = cleanSlug(rawSlug);

    const title =
      (typeof anyData.title === "string" && anyData.title.trim()) ||
      slug ||
      "Untitled post";

    const description =
      (typeof anyData.description === "string" &&
        anyData.description.trim()) ||
      undefined;

    const excerpt =
      (typeof anyData.excerpt === "string" && anyData.excerpt.trim()) ||
      (typeof anyData.summary === "string" && anyData.summary.trim()) ||
      description ||
      undefined;

    const coverImage =
      (typeof anyData.coverImage === "string" &&
        anyData.coverImage.trim()) ||
      (typeof anyData.image === "string" && anyData.image.trim()) ||
      undefined;

    const heroImage =
      (typeof anyData.heroImage === "string" &&
        anyData.heroImage.trim()) || undefined;

    const date =
      (typeof anyData.date === "string" && anyData.date.trim()) ||
      undefined;

    const updated =
      (typeof anyData.updated === "string" && anyData.updated.trim()) ||
      undefined;

    const author =
      (typeof anyData.author === "string" && anyData.author.trim()) ||
      undefined;

    const category =
      (typeof anyData.category === "string" && anyData.category.trim()) ||
      undefined;

    const readTime =
      (typeof anyData.readTime === "string" && anyData.readTime.trim()) ||
      undefined;

    const tags = Array.isArray(anyData.tags)
      ? (anyData.tags as unknown[]).map((t) => String(t))
      : undefined;

    const resources: PostResources | undefined =
      anyData.resources && typeof anyData.resources === "object"
        ? (anyData.resources as PostResources)
        : undefined;

    const base: PostWithContent = {
      slug,
      title,
      description,
      excerpt,
      coverImage,
      heroImage,
      date,
      updated,
      author,
      category,
      readTime,
      tags,
      resources,
      content,
    };

    // Spread data LAST so we keep any extra fields,
    // then re-assert our canonical fields to avoid being overwritten.
    return {
      ...anyData,
      ...base,
      slug,
      title,
      description,
      excerpt,
      coverImage,
      heroImage,
      date,
      updated,
      author,
      category,
      readTime,
      tags,
      resources,
      content,
    };
  });

  // newest first
  return sortByDateDesc(items);
}

let POSTS_CACHE: PostWithContent[] | null = null;

function allPosts(): PostWithContent[] {
  if (!POSTS_CACHE) {
    POSTS_CACHE = loadAllPostsFromFs();
  }
  return POSTS_CACHE;
}

// ------------------------
// public API
// ------------------------

export function getPostSlugs(): string[] {
  return allPosts().map((p) => p.slug);
}

export function getAllPostsMeta(): PostMeta[] {
  return allPosts().map((p) => {
    const { content, ...meta } = p;
    return meta;
  });
}

// Supports "slug", "/slug", "blog/slug"
export function getPostBySlug(
  rawSlug: string,
  fields: string[] = [],
): Record<string, unknown> | null {
  const target = cleanSlug(rawSlug);
  if (!target) return null;

  const match =
    allPosts().find(
      (p) => cleanSlug(p.slug) === target,
    ) || null;

  if (!match) return null;

  if (!fields || fields.length === 0) {
    // return full object
    return { ...match };
  }

  const filtered: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (field === "slug") {
      filtered.slug = match.slug;
      return;
    }
    if (field in match) {
      filtered[field] = (match as any)[field];
    }
  });

  return filtered;
}
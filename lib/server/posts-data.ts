// lib/server/posts-data.ts
import {
  getMdxCollectionMeta,
  getMdxCollectionDocuments,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Post } from "@/types/index";

export type PostWithContent = Post & {
  content: string;
  body?: {
    code: string;
    raw: string;
  };
};

// Clean slug helper
function cleanSlug(raw: string): string {
  return raw
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^(posts?|blog)\//i, "");
}

// Safe property extractors
function safeString(value: any): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeArray(value: any): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(item => typeof item === "string");
}

function safeNumber(value: any): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function safeBoolean(value: any): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true" || lower === "yes" || lower === "1") return true;
    if (lower === "false" || lower === "no" || lower === "0") return false;
  }
  return undefined;
}

// Convert MDX to Post
function fromMdxMeta(meta: MdxMeta): Post {
  const m = meta as any;
  
  const rawSlug = safeString(m.slug) || safeString(m._raw?.flattenedPath) || "";
  const slug = cleanSlug(rawSlug);
  
  return {
    // Required
    slug,
    title: safeString(m.title) || "Untitled",
    
    // Content
    description: safeString(m.description) || safeString(m.excerpt),
    excerpt: safeString(m.excerpt) || safeString(m.description),
    subtitle: safeString(m.subtitle),
    
    // Metadata
    date: safeString(m.date),
    author: safeString(m.author) || "Abraham of London",
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    readTime: safeNumber(m.readTime) || safeNumber(m.readingTime) || safeString(m.readTime),
    
    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),
    
    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    status: safeString(m.status) as any,
    
    // Access
    accessLevel: safeString(m.accessLevel) as any || "public",
    lockMessage: safeString(m.lockMessage),
    
    // Post-specific
    updated: safeString(m.updated),
    seoTitle: safeString(m.seoTitle),
    seoDescription: safeString(m.seoDescription),
    canonicalUrl: safeString(m.canonicalUrl),
    series: safeString(m.series),
    part: safeNumber(m.part),
    layout: safeString(m.layout) as any,
    template: safeString(m.template),
    
    // System
    _raw: m._raw,
    _id: safeString(m._id),
    url: safeString(m.url),
    type: safeString(m.type) || "post",
    
    // Additional fields
    ...Object.fromEntries(
      Object.entries(m).filter(([key]) => ![
        'slug', 'title', 'description', 'excerpt', 'subtitle', 'date',
        'author', 'category', 'tags', 'featured', 'readTime', 'coverImage',
        'image', 'draft', 'published', 'status', 'accessLevel', 'lockMessage',
        'updated', 'seoTitle', 'seoDescription', 'canonicalUrl', 'series',
        'part', 'layout', 'template', '_raw', '_id', 'url', 'type'
      ].includes(key))
    ),
  };
}

function fromMdxDocument(doc: MdxDocument): PostWithContent {
  const { content, ...rest } = doc as any;
  const meta = fromMdxMeta(rest);
  
  return {
    ...meta,
    content: typeof content === "string" ? content : "",
    body: doc.body,
  };
}

// Public API
export function getPostSlugs(): string[] {
  try {
    const metas = getMdxCollectionMeta("posts");
    return metas
      .map(m => cleanSlug(String((m as any).slug || "")))
      .filter(s => s.length > 0);
  } catch (error) {
    console.error("[posts-data] Error getting post slugs:", error);
    return [];
  }
}

export function getAllPostsMeta(): Post[] {
  try {
    const docs = getMdxCollectionDocuments("posts");
    return docs.map(d => fromMdxMeta(d));
  } catch (error) {
    console.error("[posts-data] Error getting all posts meta:", error);
    return [];
  }
}

export function getPostBySlug(
  slug: string,
  options?: { fields?: string[]; withContent?: boolean }
): (Post | PostWithContent) | null {
  try {
    const target = cleanSlug(slug);
    let doc = getMdxDocumentBySlug("posts", target);
    
    if (!doc) {
      doc = getMdxDocumentBySlug("posts", `posts/${target}`);
    }
    
    if (!doc) {
      console.warn(`[posts-data] Post not found: ${slug}`);
      return null;
    }
    
    const full = fromMdxDocument(doc);
    
    if (!options?.fields || options.fields.length === 0) {
      return options?.withContent ? full : fromMdxMeta(doc);
    }
    
    const filtered: any = {};
    for (const field of options.fields) {
      if (field === "content" && options.withContent) {
        filtered.content = full.content;
        continue;
      }
      if (field in full) {
        filtered[field] = (full as any)[field];
      }
    }
    
    return filtered;
  } catch (error) {
    console.error(`[posts-data] Error getting post ${slug}:`, error);
    return null;
  }
}

export function getRecentPosts(limit?: number): Post[] {
  try {
    const posts = getAllPostsMeta()
      .filter(p => !p.draft)
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    
    return limit ? posts.slice(0, limit) : posts;
  } catch (error) {
    console.error("[posts-data] Error getting recent posts:", error);
    return [];
  }
}

export function getPostsByCategory(category: string): Post[] {
  try {
    return getAllPostsMeta()
      .filter(p => !p.draft && p.category?.toLowerCase() === category.toLowerCase());
  } catch (error) {
    console.error(`[posts-data] Error getting posts by category ${category}:`, error);
    return [];
  }
}

export function getPostsByTag(tag: string): Post[] {
  try {
    return getAllPostsMeta()
      .filter(p => !p.draft && p.tags?.some(t => t.toLowerCase() === tag.toLowerCase()));
  } catch (error) {
    console.error(`[posts-data] Error getting posts by tag ${tag}:`, error);
    return [];
  }
}

export default {
  getPostSlugs,
  getAllPostsMeta,
  getPostBySlug,
  getRecentPosts,
  getPostsByCategory,
  getPostsByTag,
};
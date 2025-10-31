// lib/posts.ts

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Enforce server-side usage for file system operations
if (typeof window !== "undefined") {
  throw new Error("This module is server-only and cannot be imported by client components.");
}

// --- Type Definitions ---

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string; // ISO date string
  publishedAt?: string; // ISO date string
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[]; // Always an array of strings
  featured?: boolean;
  wordCount?: number;
  views?: number;
  content?: string;
};

// Type alias for all possible frontmatter fields we might request
export type PostField = keyof PostMeta;

const POSTS_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

// --- Private Helper Functions (for safe coercion) ---

/** Coerces a value into a boolean, defaulting to false. */
function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v.toLowerCase() === '1';
  if (typeof v === 'number') return v === 1;
  return false;
}

/** Coerces a value into an ISO date string, or undefined if not a valid date. */
function toDateString(v: unknown): string | undefined {
  let date: Date;

  if (v instanceof Date) {
    date = v;
  } else if (typeof v === "number") {
    date = new Date(v);
  } else if (typeof v === "string") {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return undefined;
    date = new Date(t);
  } else {
    return undefined;
  }

  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Coerces a value into an integer, or undefined. */
function toInteger(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isInteger(v) && Number.isFinite(v)) return v;
  
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseInt(v.trim(), 10);
    return Number.isInteger(n) && Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Coerces a value into an array of trimmed, non-empty strings. */
function toStringArray(v: unknown): string[] {
  let values: unknown[] = [];

  if (Array.isArray(v)) {
    values = v;
  } else if (typeof v === "string") {
    // Split by comma for convenience, but handle single string tags too
    values = v.split(',');
  }
  
  return values
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
}

// --- Public API ---

/** Retrieves all valid post slugs (filenames ending in .mdx or .md). */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_CONTENT_DIR)) return [];
  
  return fs
    .readdirSync(POSTS_CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

/**
 * Retrieves a single post's metadata and optional content by slug.
 * @param slug The filename of the post (e.g., 'my-post.mdx').
 * @param fields The subset of fields to retrieve.
 */
export function getPostBySlug<T extends PostField | "content">(
  slug: string,
  fields: T[] = [] as T[],
): Partial<Pick<PostMeta, Exclude<T, "content">>> & { content?: string } & Pick<PostMeta, "slug"> {
  
  // Clean the slug: 'my-post.mdx' -> 'my-post'
  const realSlug = slug.replace(/\.(mdx|md)$/, "");
  
  const mdxPath = path.join(POSTS_CONTENT_DIR, `${realSlug}.mdx`);
  const mdPath = path.join(POSTS_CONTENT_DIR, `${realSlug}.md`);
  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(fullPath)) {
    return { slug: realSlug, title: "Post Not Found" } as any;
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<PostMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === "content") {
      item.content = content;
      continue;
    }

    const raw = fm[field as string];
    if (typeof raw === "undefined") continue; 

    // Explicitly coerce types for safety and consistency
    switch (field as PostField) {
      case "tags": {
        item.tags = toStringArray(raw);
        break;
      }
      case "date":
      case "publishedAt": {
        item[field] = toDateString(raw);
        break;
      }
      case "featured": {
        item.featured = toBoolean(raw);
        break;
      }
      case "wordCount":
      case "views": {
        item[field] = toInteger(raw);
        break;
      }
      // Simple string fields
      case "title":
      case "excerpt":
      case "coverImage":
      case "author":
      case "readTime":
      case "category": {
        if (typeof raw === "string") {
          item[field] = raw.trim();
        }
        break;
      }
      default: {
        // Fallback for any other valid but uncoerced field
        (item as Record<string, unknown>)[field] = raw;
      }
    }
  }

  return item as any; // Cast required due to complex generic return type
}

/**
 * Retrieves all posts with the specified fields, sorted by publication date (newest first).
 * @param fields The subset of fields to retrieve.
 */
export function getAllPosts<T extends PostField | "content">(
  fields: T[] = [] as T[],
): (Partial<Pick<PostMeta, Exclude<T, "content">>> & { content?: string } & Pick<PostMeta, "slug">)[] {
  
  // Ensure we include date/publishedAt for sorting
  const requiredFields = Array.from(new Set<PostField | "content">([...fields, "date", "publishedAt", "slug"])) as (PostField | "content")[];

  const posts = getPostSlugs()
    .map((slug) => getPostBySlug(slug, requiredFields))
    .filter(post => post.slug); // Filter out any posts that couldn't be retrieved

  // Sort by the latest available date (publishedAt preferred over date), newest first
  posts.sort((a, b) => {
    // Coerce dates to numeric timestamps for reliable comparison
    const dateA = Date.parse(a.publishedAt || a.date || "1970-01-01");
    const dateB = Date.parse(b.publishedAt || b.date || "1970-01-01");
    
    // Sort descending (newest first)
    return dateB - dateA;
  });

  return posts as any; // Cast required due to complex generic return type
}
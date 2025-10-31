// lib/strategy.ts

import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Enforce server-side usage for file system operations
if (typeof window !== "undefined") {
  throw new Error("This module is server-only and cannot be imported by client components.");
}

// --- Type Definitions ---

export type StrategyMeta = {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string; // ISO date string for publication
  category?: string;
  tags?: string[]; // Always an array of strings
  featured?: boolean;
  coverImage?: string;
  readTime?: string;
  content?: string;
};

export type StrategyField = keyof StrategyMeta;

const STRATEGY_CONTENT_DIR = path.join(process.cwd(), "content", "strategy");

// --- Private Helpers (reusing logic from safe-coercion/posts) ---

/** Converts a value to an ISO date string, or undefined. */
function toDateString(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return new Date(v).toISOString();
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? undefined : new Date(t).toISOString();
  }
  return undefined;
}

/** Coerces a value into an array of trimmed, non-empty strings. */
function toStringArray(v: unknown): string[] {
  let values: unknown[] = [];
  if (Array.isArray(v)) values = v;
  else if (typeof v === "string") values = v.split(',');
  
  return values.map(String).map((s) => s.trim()).filter(Boolean);
}

/** Coerces a value into a boolean. */
function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v.toLowerCase() === '1';
  if (typeof v === 'number') return v === 1;
  return false;
}

// --- Public API ---

/** Retrieves all valid strategy content slugs. */
export function getStrategySlugs(): string[] {
  if (!fs.existsSync(STRATEGY_CONTENT_DIR)) return [];
  return fs
    .readdirSync(STRATEGY_CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.(mdx|md)$/, ""));
}

/** Finds the full path to a strategy file, supporting .mdx and .md. */
function resolveStrategyPath(slug: string): string | null {
  const mdx = path.join(STRATEGY_CONTENT_DIR, `${slug}.mdx`);
  const md = path.join(STRATEGY_CONTENT_DIR, `${slug}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

/**
 * Retrieves a single strategy entry's metadata and optional content by slug.
 * @param slug The filename slug (e.g., 'the-principled-leader').
 * @param fields The subset of fields to retrieve.
 */
export function getStrategyBySlug<T extends StrategyField | "content">(
  slug: string,
  fields: T[] = [] as T[],
): Partial<Pick<StrategyMeta, Exclude<T, "content">>> & { content?: string } & Pick<StrategyMeta, "slug" | "title"> {
  
  const realSlug = slug.replace(/\.(mdx|md)$/, "");
  const fullPath = resolveStrategyPath(realSlug);

  if (!fullPath) {
    return { slug: realSlug, title: "Strategy Not Found" } as any;
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<StrategyMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === "content") {
      item.content = content;
      continue;
    }

    const raw = fm[field as string];
    if (typeof raw === "undefined") continue; 

    // Explicitly coerce types
    switch (field as StrategyField) {
      case "tags": {
        item.tags = toStringArray(raw);
        break;
      }
      case "date": {
        item.date = toDateString(raw);
        break;
      }
      case "featured": {
        item.featured = toBoolean(raw);
        break;
      }
      // Simple string fields
      case "title":
      case "excerpt":
      case "category":
      case "coverImage":
      case "readTime": {
        if (typeof raw === "string") {
          item[field] = raw.trim();
        }
        break;
      }
      default: {
        (item as Record<string, unknown>)[field] = raw;
      }
    }
  }

  // Ensure mandatory fields have safe fallbacks
  if (!item.title) item.title = realSlug.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return item as any;
}

/**
 * Retrieves all strategy entries with the specified fields, sorted by date (newest first).
 * @param fields The subset of fields to retrieve.
 */
export function getAllStrategies<T extends StrategyField | "content">(
  fields: T[] = [] as T[],
): (Partial<Pick<StrategyMeta, Exclude<T, "content">>> & { content?: string } & Pick<StrategyMeta, "slug" | "title">)[] {
  
  // Ensure we include date for sorting
  const requiredFields = Array.from(new Set<StrategyField | "content">([...fields, "date", "title", "slug"])) as (StrategyField | "content")[];

  const strategies = getStrategySlugs()
    .map((slug) => getStrategyBySlug(slug, requiredFields))
    .filter(s => s.slug && s.title !== "Strategy Not Found");

  // Sort by date descending (newest first)
  strategies.sort((a, b) => {
    const dateA = Date.parse(a.date || "1970-01-01");
    const dateB = Date.parse(b.date || "1970-01-01");
    return dateB - dateA;
  });

  return strategies as any;
}

// --- Legacy/Placeholder Exports (now mapped to new implementations) ---

/** @deprecated Use getAllStrategies */
export async function getAll(): Promise<StrategyMeta[]> {
    // Synchronous function made async to match legacy signature
    return getAllStrategies(["title", "excerpt", "date", "category"]) as Promise<StrategyMeta[]>;
}

/** @deprecated Use getStrategyBySlug */
export async function findBySlug(slug: string): Promise<StrategyMeta | null> {
    const result = getStrategyBySlug(slug, ["title", "excerpt", "date", "category", "content"]);
    // Return null if post not found
    return result.title === "Strategy Not Found" ? null : result as Promise<StrategyMeta>;
}
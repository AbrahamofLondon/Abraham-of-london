if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}
// lib/books.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BookMeta {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
  date?: string; 

  // Optional extras used by pages/books.tsx
  publishedDate?: string; // stored as ISO or original string
  isbn?: string;
  pages?: number;
  rating?: number;
  language?: string;
  publisher?: string;
  tags?: string[];

  downloadPdf?: string;
  downloadEpub?: string;

  content?: string;
}

const booksDir = path.join(process.cwd(), "content", "books");

/* ------------ small helpers ------------ */

function toTitle(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toDateString(v: unknown): string | undefined {
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? undefined : v.toISOString();
  }
  if (typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  if (typeof v === "string") {
    // Keep as-is if parseable; otherwise return original (lets you store "TBA" etc.)
    const t = Date.parse(v);
    return Number.isNaN(t) ? v : new Date(t).toISOString();
  }
  return undefined;
}

/* ------------ public API ------------ */

export function getBookSlugs(): string[] {
  if (!fs.existsSync(booksDir)) return [];
  return fs
    .readdirSync(booksDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}

function resolveBookPath(slug: string): string | null {
  const mdx = path.join(booksDir, `${slug}.mdx`);
  const md = path.join(booksDir, `${slug}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

export function getBookBySlug(
  slug: string,
  fields: (keyof BookMeta | "content")[] = [],
): Partial<BookMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/, "");
  const fullPath = resolveBookPath(realSlug);

  // Minimal object if file not found
  if (!fullPath) {
    const minimal: Partial<BookMeta> = { slug: realSlug };
    if (fields.includes("title")) minimal.title = "Book Not Found";
    return minimal;
  }

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<BookMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === "content") {
      item.content = content;
      continue;
    }

    const raw = fm[field as string];

    if (typeof raw === "undefined") continue;

    switch (field) {
      case "genre": {
        item.genre = Array.isArray(raw)
          ? toStringArray(raw).join(", ")
          : String(raw);
        break;
      }
      case "tags": {
        item.tags = toStringArray(raw);
        break;
      }
      case "pages": {
        item.pages = toNumber(raw);
        break;
      }
      case "rating": {
        item.rating = toNumber(raw);
        break;
      }
      case "publishedDate": {
        item.publishedDate = toDateString(raw);
        break;
      }
      default: {
        // Pass-through for strings/links/etc.
        (item as Record<string, unknown>)[field] = raw;
      }
    }
  }

  // Ensure useful fallbacks if requested but missing
  if (fields.includes("title") && !item.title) item.title = toTitle(realSlug);

  return item;
}

export function getAllBooks(
  fields: (keyof BookMeta | "content")[] = [],
): Partial<BookMeta>[] {
  const books = getBookSlugs().map((s) => getBookBySlug(s, fields));

  // Sort alphabetically by title (fallback to slug)
  books.sort((a, b) =>
    (a.title || a.slug || "")
      .toString()
      .localeCompare((b.title || b.slug || "").toString(), undefined, {
        sensitivity: "base",
      }),
  );

  return books;
}

if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}
// lib/books.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Define an interface for the required frontmatter properties
export interface BookRequiredMeta {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
}

// Define the full interface, extending the required fields
export interface BookMeta extends BookRequiredMeta {
  date?: string; // Kept as-is, but often used for sorting/display

  // Optional extras used by pages/books.tsx
  publishedDate?: string; // Always coerced to ISO string if possible
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

/** Converts a slug to a PascalCase title (fallback). */
function toTitle(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Coerces a value into an array of trimmed, non-empty strings. */
function toStringArray(v: unknown): string[] {
  if (Array.isArray(v))
    return v
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

/** Coerces a value into a finite number, or undefined. */
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Coerces a value into an ISO date string, or undefined if not a valid date.
 */
function toDateString(v: unknown): string | undefined {
  let date: Date;

  if (v instanceof Date) {
    date = v;
  } else if (typeof v === "number") {
    date = new Date(v);
  } else if (typeof v === "string") {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return undefined; // Fail if string cannot be parsed as a date
    date = new Date(t);
  } else {
    return undefined;
  }

  return isNaN(date.getTime()) ? undefined : date.toISOString();
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
      // --- Special Coercion Fields ---
      case "genre": {
        // Handle genre as a special case for array/string conversion
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

      // --- REQUIRED & Simple String Fields (String validation) ---
      case "title":
      case "author":
      case "excerpt":
      case "coverImage":
      case "buyLink":
      case "isbn":
      case "language":
      case "publisher":
      case "date": // date field from original type
      case "downloadPdf":
      case "downloadEpub": {
        if (typeof raw === "string") {
          (item as Record<string, unknown>)[field] = raw.trim();
        }
        break;
      }

      default: {
        // Fallback for any other valid but uncoerced field
        (item as Record<string, unknown>)[field] = raw;
      }
    }
  }

  // Ensure mandatory fields have safe fallbacks if requested but missing
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

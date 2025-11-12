// lib/server/books-data.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

if (typeof window !== "undefined") {
  throw new Error("This module is server-only");
}

export type BookMeta = {
  slug: string;
  title?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: string | null;
  date?: string | null;
  category?: string | null;
  tags?: string[] | null;
  readTime?: string | null;
  coverAspect?: "book" | "square" | "16/9" | string | null;
  coverFit?: "contain" | "cover" | string | null;
  coverPosition?: "center" | "top" | "left" | "right" | string | null;
  content?: string;
};

type FieldKey = keyof BookMeta;

const booksDir = path.join(process.cwd(), "content", "books");
const exts = [".mdx", ".md"] as const;

const DEFAULT_FIELDS: FieldKey[] = [
  "slug",
  "title",
  "excerpt",
  "coverImage",
  "author",
  "date",
  "category",
  "tags",
  "readTime",
  "coverAspect",
  "coverFit",
  "coverPosition",
];

function resolveBookPath(slug: string): string | null {
  const real = slug.replace(/\.mdx?$/i, "");
  for (const ext of exts) {
    const full = path.join(booksDir, `${real}${ext}`);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function ensureLocal(p?: string | null): string | null {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`;
}

function normalizeCoverImage(v: unknown): string | null {
  const raw = ensureLocal(typeof v === "string" ? v : null);
  if (!raw) return null;
  if (!raw.startsWith("/assets/") && !raw.startsWith("/_next/") && !/^https?:\/\//i.test(raw)) {
    return `/assets/images/books/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
}

export function getBookSlugs(): string[] {
  if (!fs.existsSync(booksDir)) return [];
  return fs
    .readdirSync(booksDir)
    .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
    .map((f) => f.replace(/\.mdx?$/i, ""));
}

export function getBookBySlug(
  slug: string,
  fields: FieldKey[] = DEFAULT_FIELDS,
  includeContent = false
): BookMeta {
  const real = slug.replace(/\.mdx?$/i, "");
  const fullPath = resolveBookPath(real);

  if (!fullPath) {
    const base: BookMeta = {
      slug: real,
      title: "Book Not Found",
      excerpt: null,
      coverImage: null,
      author: null,
      date: null,
      category: null,
      tags: null,
      readTime: null,
      coverAspect: null,
      coverFit: null,
      coverPosition: null,
      content: includeContent ? "" : null,
    };
    const out: any = { slug: base.slug };
    for (const f of fields) out[f] = base[f] ?? null;
    if (includeContent) out.content = base.content ?? "";
    return out as BookMeta;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const fm = (data || {}) as Record<string, unknown>;

  const out: any = { slug: real };

  for (const f of fields) {
    switch (f) {
      case "slug":
        out.slug = real;
        break;
      case "title":
      case "excerpt":
      case "author":
      case "date":
      case "category":
      case "readTime":
      case "coverAspect":
      case "coverFit":
      case "coverPosition": {
        const v = typeof fm[f] === "string" ? fm[f].trim() : null;
        out[f] = v;
        break;
      }
      case "coverImage": {
        const v = normalizeCoverImage(fm.coverImage);
        out.coverImage = v;
        break;
      }
      case "tags": {
        const v = Array.isArray(fm.tags) ? fm.tags.map(String) : null;
        out.tags = v;
        break;
      }
      case "content": {
        if (includeContent) {
          out.content = content || "";
        }
        break;
      }
      default:
        break;
    }
  }

  return out as BookMeta;
}

export function getAllBooks(fields: FieldKey[] = DEFAULT_FIELDS): BookMeta[] {
  const slugs = getBookSlugs();
  const items = slugs.map((s) => getBookBySlug(s, fields));
  
  items.sort((a, b) => {
    const at = (a.title || a.slug || "").toLowerCase();
    const bt = (b.title || b.slug || "").toLowerCase();
    return at.localeCompare(bt);
  });
  return items;
}
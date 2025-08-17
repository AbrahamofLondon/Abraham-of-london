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

  // Optional extras used by pages/books.tsx
  publishedDate?: string;
  isbn?: string;
  pages?: number;
  rating?: number;
  language?: string;
  publisher?: string;
  tags?: string[]; // <-- add this

  downloadPdf?: string;
  downloadEpub?: string;

  content?: string;
}

const booksDir = path.join(process.cwd(), "content", "books");

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
    return { slug: realSlug, title: "Book Not Found" } as Partial<BookMeta>;
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

    if (field === "genre") {
      // normalize genre to a single string
      item.genre = Array.isArray(raw)
        ? (raw as unknown[]).map(String).filter(Boolean).join(", ")
        : String(raw);
      continue;
    }

    if (field === "tags") {
      // normalize tags to string[]
      if (Array.isArray(raw)) {
        item.tags = (raw as unknown[])
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (typeof raw === "string") {
        item.tags = raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      continue;
    }

    (item as Record<string, unknown>)[field] = raw;
  }

  return item;
}

export function getAllBooks(
  fields: (keyof BookMeta | "content")[] = [],
): Partial<BookMeta>[] {
  const books = getBookSlugs().map((slug) => getBookBySlug(slug, fields));

  books.sort((a, b) =>
    (a.title || a.slug || "")
      .toString()
      .localeCompare((b.title || b.slug || "").toString(), undefined, {
        sensitivity: "base",
      }),
  );

  return books;
}














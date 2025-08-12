// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type BookMeta = {
  slug: string;
  title?: string;
  author?: string;
  excerpt?: string;
  coverImage?: string;
  buyLink?: string;
  genre?: string | string[];
  date?: string;
  publishedAt?: string;
  description?: string;
  tags?: string[] | string;
  // downloads
  downloadPdf?: string;
  downloadEpub?: string;
  // raw content when requested
  content?: string;
};

const booksDirectory = path.join(process.cwd(), 'content', 'books');

function toStringSafe(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  return String(v);
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => toStringSafe(x)).filter(Boolean);
  const s = toStringSafe(v);
  if (!s) return [];
  // allow comma-separated fallbacks from legacy frontmatter
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

export function getBookSlugs(): string[] {
  if (!fs.existsSync(booksDirectory)) return [];
  return fs
    .readdirSync(booksDirectory)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
}

export function getBookBySlug(
  slug: string,
  fields: string[] = []
): Partial<BookMeta> & { content?: string } {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = path.join(booksDirectory, `${realSlug}.mdx`);
  const mdPath = path.join(booksDirectory, `${realSlug}.md`);

  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  if (!fs.existsSync(fullPath)) {
    return { slug: realSlug, title: 'Book Not Found' };
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents) as {
    data: Record<string, unknown>;
    content: string;
  };

  const item: Partial<BookMeta> & { content?: string } = {};

  // Always allow slug, optionally content
  if (fields.includes('slug')) item.slug = realSlug;
  if (fields.includes('content')) item.content = content;

  // Copy whitelisted fields with safe coercion
  fields.forEach((field) => {
    if (field === 'slug' || field === 'content') return;
    const raw = data[field];

    switch (field) {
      case 'title':
      case 'author':
      case 'excerpt':
      case 'coverImage':
      case 'buyLink':
      case 'date':
      case 'publishedAt':
      case 'description':
      case 'downloadPdf':
      case 'downloadEpub': {
        (item as Record<string, unknown>)[field] = toStringSafe(raw);
        break;
      }
      case 'tags': {
        (item as Record<string, unknown>).tags = toStringArray(raw);
        break;
      }
      case 'genre': {
        // preserve array if given; otherwise string
        const arr = toStringArray(raw);
        (item as Record<string, unknown>).genre = arr.length ? arr : toStringSafe(raw);
        break;
      }
      default: {
        // ignore unknown fields safely
        break;
      }
    }
  });

  // Ensure slug is always set (even if not requested explicitly)
  item.slug ||= realSlug;

  return item;
}

export function getAllBooks(fields: string[] = []): Partial<BookMeta>[] {
  const slugs = getBookSlugs();
  return slugs
    .map((s) => getBookBySlug(s, fields))
    .sort((a, b) => {
      const at = toStringSafe(a.title).toLowerCase();
      const bt = toStringSafe(b.title).toLowerCase();
      return at > bt ? 1 : at < bt ? -1 : 0;
    });
}
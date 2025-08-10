// lib/books.ts (only showing the important part near your getBookBySlug)
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { formatDate } from './dateUtils';
import { safeString, safeSplit } from './stringUtils';

const booksDirectory = join(process.cwd(), 'content/books');
const downloadsDir = join(process.cwd(), 'public/downloads');

export type BookMeta = {
  slug: string;
  title: string;
  author?: string;
  coverImage?: string;
  excerpt?: string;
  description?: string;
  genre?: string | string[];
  tags?: string[];
  buyLink?: string;
  image?: string;
  date?: string;
  publishedAt?: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  content?: string;
};

export function getBookSlugs(): string[] {
  if (!fs.existsSync(booksDirectory)) return [];
  return fs.readdirSync(booksDirectory).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
}

export function getBookBySlug(slug: string, fields: string[] = []): Partial<BookMeta> {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = join(booksDirectory, `${realSlug}.mdx`);
  const mdPath = join(booksDirectory, `${realSlug}.md`);
  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(fullPath)) {
    return { slug: realSlug, title: 'Book Not Found' };
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const item: Partial<BookMeta> = { slug: realSlug };

  // Always allow 'content' even if not listed, to keep pages simple
  if (fields.includes('content')) item.content = content;

  for (const field of fields) {
    if (field === 'slug' || field === 'content') continue;
    if (data[field] !== undefined) {
      (item as any)[field] = data[field];
    }
  }

  // Safe defaults
  item.title = item.title || safeString(data.title) || 'Untitled Book';
  item.author = item.author || safeString(data.author) || 'Abraham of London';
  item.excerpt = item.excerpt || safeString(data.excerpt) || '';
  item.description = item.description || safeString(data.description) || item.excerpt || '';
  item.coverImage =
    item.coverImage ||
    (typeof data.coverImage === 'string' && data.coverImage.trim()
      ? data.coverImage
      : '/assets/images/default-book.jpg');

  // Dates
  const when = data.date || data.publishedAt;
  if (when) {
    const d = new Date(when);
    const iso = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    item.date = item.date || iso;
    item.publishedAt = item.publishedAt || iso;
  }

  // Tags / genre normalization (keep as array internally)
  if (data.tags) {
    item.tags = Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t))
      : safeSplit(safeString(data.tags), ',').map((t) => t.trim()).filter(Boolean);
  }
  if (data.genre) {
    item.genre = Array.isArray(data.genre)
      ? data.genre.map((t: unknown) => String(t))
      : String(data.genre);
  }

  // Free "buy" = point to the book page if missing
  item.buyLink = item.buyLink || `/books/${realSlug}`;

  // Auto-downloads if files exist in /public/downloads
  const pdfPath = join(downloadsDir, `${realSlug}.pdf`);
  const epubPath = join(downloadsDir, `${realSlug}.epub`);
  item.downloadPdf = fs.existsSync(pdfPath) ? `/downloads/${realSlug}.pdf` : null;
  item.downloadEpub = fs.existsSync(epubPath) ? `/downloads/${realSlug}.epub` : null;

  return item;
}

export function getAllBooks(fields: string[] = []): Partial<BookMeta>[] {
  const slugs = getBookSlugs();
  return slugs
    .map((slug) => getBookBySlug(slug, [...new Set(['slug', ...fields])]))
    .sort((a, b) => (String(a.title) > String(b.title) ? 1 : -1));
}

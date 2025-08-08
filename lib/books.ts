// lib/books.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { formatDate, parseDate } from './dateUtils';
import { safeString, safeSplit } from './stringUtils';

const booksDirectory = join(process.cwd(), 'content/books');

export type BookMeta = {
  slug: string;
  title: string;
  date?: string;
  publishedAt?: string;
  coverImage?: string;
  excerpt?: string;
  author?: string;
  description?: string;
  image?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  content?: string;
  downloadPdf?: string;
  downloadEpub?: string;
  buyLink?: string;
  genre?: string[]; // normalized to array
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

function ensureBooksDir(): void {
  try {
    if (!fs.existsSync(booksDirectory)) {
      fs.mkdirSync(booksDirectory, { recursive: true });
    }
  } catch (err) {
    // Last-ditch: don't throw during build
    console.error('Failed to ensure books directory exists:', err);
  }
}

export function getBookSlugs(): string[] {
  ensureBooksDir();
  try {
    return fs
      .readdirSync(booksDirectory)
      .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'));
  } catch (error) {
    console.error(`Error reading books directory: ${booksDirectory}`, error);
    return [];
  }
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta {
  ensureBooksDir();

  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPathMdx = join(booksDirectory, `${realSlug}.mdx`);
  const fullPathMd = join(booksDirectory, `${realSlug}.md`);

  let fileContents = '';
  try {
    if (fs.existsSync(fullPathMdx)) {
      fileContents = fs.readFileSync(fullPathMdx, 'utf8');
    } else if (fs.existsSync(fullPathMd)) {
      fileContents = fs.readFileSync(fullPathMd, 'utf8');
    } else {
      throw new Error(`Book file not found: ${fullPathMdx} or ${fullPathMd}`);
    }
  } catch (error) {
    console.error(`Error reading book ${slug}:`, error);
    // Return a minimal, safe stub so lists don’t die
    const now = formatDate(new Date());
    return {
      slug: realSlug,
      title: 'Book Not Found',
      date: now,
      publishedAt: now,
      excerpt: '',
      author: 'Abraham of London',
      description: '',
      content: '',
    };
  }

  const { data, content } = matter(fileContents);

  // Normalize helpers
  const normalizeArray = (val: unknown): string[] | undefined => {
    if (Array.isArray(val)) return val.map((v) => safeString(v)).filter(Boolean);
    if (typeof val === 'string') {
      return safeSplit(safeString(val), ',').map((t) => t.trim()).filter(Boolean);
    }
    return undefined;
  };

  const normalizedDate = formatDate((data as any).date || (data as any).publishedAt);

  const base: BookMeta = {
    slug: realSlug,
    title: safeString((data as any).title) || 'Untitled',
    date: normalizedDate,
    publishedAt: normalizedDate,
    coverImage: safeString((data as any).coverImage),
    excerpt: safeString((data as any).excerpt),
    author: safeString((data as any).author) || 'Abraham of London',
    description: safeString((data as any).description),
    image: safeString((data as any).image),
    readTime: safeString((data as any).readTime),
    category: safeString((data as any).category),
    tags: normalizeArray((data as any).tags),
    downloadPdf: safeString((data as any).downloadPdf),
    downloadEpub: safeString((data as any).downloadEpub),
    buyLink: safeString((data as any).buyLink),
    genre: normalizeArray((data as any).genre),
    seo: typeof (data as any).seo === 'object' && (data as any).seo !== null ? (data as any).seo : undefined,
  };

  // If specific fields requested, return a trimmed object.
  if (fields.length > 0) {
    const result: Partial<BookMeta> = {};
    for (const field of fields) {
      if (field === 'content') {
        (result as any).content = content || '';
        continue;
      }
      if (field === 'slug') {
        (result as any).slug = realSlug;
        continue;
      }
      // Copy from base if present
      if (field in base && (base as any)[field] !== undefined) {
        (result as any)[field] = (base as any)[field];
      } else if ((data as any)[field] !== undefined) {
        // Fallback: raw frontmatter (rare)
        (result as any)[field] = (data as any)[field];
      }
    }
    // Ensure title + slug at minimum for sanity
    (result as any).title ??= base.title;
    (result as any).slug ??= base.slug;
    return result as BookMeta;
  }

  // Otherwise include content by default
  return { ...base, content: content || '' };
}

export function getAllBooks(fields: string[] = []): BookMeta[] {
  const slugs = getBookSlugs();

  const books = slugs
    .map((slug) => getBookBySlug(slug, fields))
    // Filter out stubs
    .filter((b) => b.title && b.title !== 'Book Not Found')
    // Sort by date desc; fall back safely
    .sort((a, b) => {
      const d1 = a.date ? parseDate(a.date) : new Date(0);
      const d2 = b.date ? parseDate(b.date) : new Date(0);
      return d2.getTime() - d1.getTime();
    });

  return books;
}

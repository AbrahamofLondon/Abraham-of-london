// lib/books.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export type BookMeta = {
  slug: string;
  title?: string;
  author?: string;
  excerpt?: string;
  description?: string;
  coverImage?: string;
  image?: string;
  date?: string;
  publishedAt?: string;
  readTime?: string;
  category?: string;
  tags?: string[] | string;
  genre?: string[] | string;
  buyLink?: string;
  downloadPdf?: string;
  downloadEpub?: string;
  content?: string;
};

const booksDirectory = join(process.cwd(), 'content/books');

export function getBookSlugs(): string[] {
  try {
    if (!fs.existsSync(booksDirectory)) return [];
    return fs.readdirSync(booksDirectory).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch {
    return [];
  }
}

export function getBookBySlug(slug: string, fields: string[] = []): Partial<BookMeta> {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPathMdx = join(booksDirectory, `${realSlug}.mdx`);
  const fullPathMd = join(booksDirectory, `${realSlug}.md`);

  let fileContents = '';
  if (fs.existsSync(fullPathMdx)) fileContents = fs.readFileSync(fullPathMdx, 'utf8');
  else if (fs.existsSync(fullPathMd)) fileContents = fs.readFileSync(fullPathMd, 'utf8');
  else return { slug: realSlug, title: 'Book Not Found' };

  const { data, content } = matter(fileContents);
  const fm = data as Record<string, unknown>;

  const item: Partial<BookMeta> = {};
  const wants = new Set(fields);

  if (wants.has('slug')) item.slug = realSlug;
  if (wants.has('content')) item.content = content;

  // Copy known fields if present and correctly typed
  const assignString = (key: keyof BookMeta) => {
    const v = fm[key as string];
    if (typeof v === 'string') (item as Record<string, unknown>)[key] = v;
  };

  const assignStringOrArray = (key: 'tags' | 'genre') => {
    const v = fm[key];
    if (Array.isArray(v)) (item as Record<string, unknown>)[key] = v.map(String);
    else if (typeof v === 'string') (item as Record<string, unknown>)[key] = v;
  };

  const maybe = (k: keyof BookMeta) => wants.has(k as string);

  if (maybe('title')) assignString('title');
  if (maybe('author')) assignString('author');
  if (maybe('excerpt')) assignString('excerpt');
  if (maybe('description')) assignString('description');
  if (maybe('coverImage')) assignString('coverImage');
  if (maybe('image')) assignString('image');
  if (maybe('date')) assignString('date');
  if (maybe('publishedAt')) assignString('publishedAt');
  if (maybe('readTime')) assignString('readTime');
  if (maybe('category')) assignString('category');
  if (maybe('buyLink')) assignString('buyLink');
  if (maybe('downloadPdf')) assignString('downloadPdf');
  if (maybe('downloadEpub')) assignString('downloadEpub');
  if (maybe('tags')) assignStringOrArray('tags');
  if (maybe('genre')) assignStringOrArray('genre');

  // Always ensure slug at least
  if (!item.slug) item.slug = realSlug;

  return item;
}

export function getAllBooks(fields: string[] = []): Partial<BookMeta>[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((s) => getBookBySlug(s, fields))
    .sort((a, b) => {
      const d1 = (a.date || a.publishedAt || '').toString();
      const d2 = (b.date || b.publishedAt || '').toString();
      return d2.localeCompare(d1);
    });
  return books;
}

// lib/books.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// This should point to 'C:\Codex-setup\Abraham-of-london\books\'
const booksDirectory = join(process.cwd(), 'books'); 

export interface BookMeta {
  slug: string;
  title: string;
  date?: string; // date might be optional for books
  coverImage: string;
  excerpt: string;
  author: string;
  genre?: string;
  buyLink?: string;
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };
  [key: string]: any; // Allow for additional front matter properties
}

export function getBookSlugs() {
  const files = fs.readdirSync(booksDirectory);
  return files.filter(file => file.endsWith('.mdx')).map(file => file.replace(/\.mdx$/, ''));
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta {
  const fullPath = join(booksDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: BookMeta = { slug, title: '', coverImage: '', excerpt: '', author: '' };

  if (data.title) items.title = data.title;
  if (data.date) items.date = data.date;
  if (data.coverImage) items.coverImage = data.coverImage;
  if (data.excerpt) items.excerpt = data.excerpt;
  if (data.author) items.author = data.author;

  if (data.genre) items.genre = data.genre;
  if (data.buyLink) items.buyLink = data.buyLink;
  if (data.seo) items.seo = data.seo;

  if (fields.includes('content')) {
    items.content = content;
  }

  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && items[field] === undefined) {
      if (typeof data[field] !== 'undefined') {
        items[field] = data[field];
      }
    }
  });

  return items;
}

export function getAllBooks(fields: string[] = []): BookMeta[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields));
    // Books might not need sorting by date, but if they do, add .sort here.
  return books;
}
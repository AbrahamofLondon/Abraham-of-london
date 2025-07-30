// lib/books.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// CORRECTED: Changed '_books' to 'content/books' to match typical content structure
const booksDirectory = join(process.cwd(), 'content/books');

// Define the BookMeta type
export type BookMeta = {
  slug: string;
  title: string;
  coverImage?: string;
  excerpt: string;
  buyLink?: string;
  downloadLink?: string;
  author: string;
  genre?: string[];
  description: string;
  image?: string;
  readTime?: string;
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

export type BookWithContent = BookMeta & { content: string };

export function getBookSlugs() {
  // CORRECTED: Filter to only include .mdx files
  return fs.readdirSync(booksDirectory).filter(filename => filename.endsWith('.mdx'));
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta | BookWithContent {
  // CORRECTED: Changed /\.md$/ to /\.mdx$/ to handle .mdx slugs
  const realSlug = slug.replace(/\.mdx$/, '');
  // CORRECTED: Changed `.md` to `.mdx` for the full path
  const fullPath = join(booksDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: Partial<BookWithContent> = { slug: realSlug };

  if (fields.includes('content')) {
    items.content = content;
  }

  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && data[field] !== undefined) {
      if (field === 'genre' || field === 'tags') {
        items[field] = Array.isArray(data[field])
          ? data[field].map((g: any) => String(g))
          : [String(data[field])];
      } else if (field === 'seo') {
        if (typeof data[field] === 'object' && data[field] !== null) {
          items.seo = data[field];
        }
      } else {
        (items as any)[field] = data[field];
      }
    }
  });

  if (items.title === undefined) items.title = '';
  if (items.excerpt === undefined) items.excerpt = '';
  if (items.author === undefined) items.author = '';
  if (items.description === undefined) items.description = '';
  if (items.image === undefined) items.image = '';
  if (items.coverImage === undefined) items.coverImage = '';

  if (fields.includes('content')) {
    return items as BookWithContent;
  } else {
    return items as BookMeta;
  }
}

export function getAllBooks(fields: string[] = []): BookMeta[] {
  const slugs = getBookSlugs(); // Now correctly filters for .mdx files
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields) as BookMeta)
    .sort((book1, book2) => book1.title.localeCompare(book2.title));
  return books;
}
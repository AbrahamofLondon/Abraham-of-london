// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDirectory = path.join(process.cwd(), 'content', 'books');

export interface BookMeta {
  title: string;
  slug: string;
  author?: string;
  genre?: string;
  excerpt?: string;
  coverImage?: string;
  buyLink?: string;
  pdfLink?: string;
  epubLink?: string;
}

export function getBookSlugs(): string[] {
  return fs.readdirSync(booksDirectory).filter((file) => file.endsWith('.mdx'));
}

export function getBookBySlug(slug: string): BookMeta & { content: string } {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(booksDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    ...(data as BookMeta),
    slug: realSlug,
    content,
  };
}

export function getAllBooks(): BookMeta[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug))
    .map(({ content, ...meta }) => meta);

  // Optional: Sort by title or custom field
  return books.sort((a, b) => a.title.localeCompare(b.title));
}

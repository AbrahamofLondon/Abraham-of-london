// lib/books.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const booksDirectory = join(process.cwd(), '_books');

// Define the BookMeta type
export type BookMeta = {
  slug: string;
  title: string;
  coverImage?: string;
  excerpt: string;
  buyLink?: string;
  author: string;
  genre?: string[];
  description: string;
  image?: string;
  readTime?: string;
  tags?: string[]; // <--- ADD THIS LINE: To include optional tags for books
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

export type BookWithContent = BookMeta & { content: string };

export function getBookSlugs() {
  return fs.readdirSync(booksDirectory);
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta | BookWithContent {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(booksDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: Partial<BookWithContent> = { slug: realSlug };

  if (fields.includes('content')) {
    items.content = content;
  }

  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && data[field] !== undefined) {
      if (field === 'genre' || field === 'tags') { // <--- ALSO ADD 'tags' HERE
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
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields) as BookMeta)
    .sort((book1, book2) => book1.title.localeCompare(book2.title));
  return books;
}
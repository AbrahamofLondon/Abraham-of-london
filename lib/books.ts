import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const booksDirectory = join(process.cwd(), 'content/books');

// Type for SEO metadata
type BookSeo = {
  title?: string;
  description?: string;
  keywords?: string;
};

// Main book metadata
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
  tags?: string[];
  downloadLink?: string;
  downloadEpubLink?: string;
  seo?: BookSeo;
};

// Extended type for MDX content
export type BookWithContent = BookMeta & { content: string };

export function getBookSlugs(): string[] {
  return fs.readdirSync(booksDirectory).filter((filename) => filename.endsWith('.mdx'));
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta | BookWithContent {
  const realSlug = slug.replace(/\.mdx$/, '');
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
        if (Array.isArray(data[field])) {
          (items as Record<string, string[]>)[field] = data[field].map((g: unknown) => String(g));
        } else {
          (items as Record<string, string[]>)[field] = [String(data[field])];
        }
      } else if (field === 'seo') {
        if (typeof data[field] === 'object' && data[field] !== null) {
          items.seo = data[field] as BookSeo;
        }
      } else {
        (items as Record<string, string | undefined>)[field] = String(data[field]);
      }
    }
  });

  // Defaults to avoid undefined issues
  if (items.title === undefined) items.title = '';
  if (items.excerpt === undefined) items.excerpt = '';
  if (items.author === undefined) items.author = '';
  if (items.description === undefined) items.description = '';
  if (items.image === undefined) items.image = '';
  if (items.coverImage === undefined) items.coverImage = '';
  if (items.buyLink === undefined) items.buyLink = '';
  if (items.downloadLink === undefined) items.downloadLink = '';
  if (items.downloadEpubLink === undefined) items.downloadEpubLink = '';

  return fields.includes('content') ? (items as BookWithContent) : (items as BookMeta);
}

export function getAllBooks(fields: string[] = []): BookMeta[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields) as BookMeta)
    .sort((book1, book2) => book1.title.localeCompare(book2.title));
  return books;
}

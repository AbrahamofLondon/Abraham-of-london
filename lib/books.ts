import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const booksDirectory = join(process.cwd(), 'content/books');

type BookSeo = {
  title?: string;
  description?: string;
  keywords?: string;
};

export type BookMeta = {
  slug: string;
  title: string;
  date?: string;
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
  category?: string;
};

export type BookWithContent = BookMeta & { content: string };

export function getBookSlugs(): string[] {
  return fs.readdirSync(booksDirectory).filter((f) => f.endsWith('.mdx'));
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta | BookWithContent {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = join(booksDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const item: Partial<BookWithContent> = { slug: realSlug };

  if (fields.includes('content')) item.content = content;

  fields.forEach((field) => {
    if (field in data) {
      const value = data[field];
      if (Array.isArray(value)) {
        item[field] = value.map(String) as any;
      } else if (typeof value === 'object') {
        item[field] = value;
      } else {
        item[field] = String(value);
      }
    }
  });

  // Fallbacks
  item.title ??= '';
  item.excerpt ??= '';
  item.author ??= '';
  item.description ??= '';
  item.coverImage ??= '';
  item.buyLink ??= '';
  item.downloadLink ??= '';
  item.downloadEpubLink ??= '';
  item.category ??= '';

  return fields.includes('content') ? (item as BookWithContent) : (item as BookMeta);
}

export function getAllBooks(fields: string[] = []): BookMeta[] {
  return getBookSlugs()
    .map((slug) => getBookBySlug(slug, fields) as BookMeta)
    .sort((a, b) => a.title.localeCompare(b.title));
}

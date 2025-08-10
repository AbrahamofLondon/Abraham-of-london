import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type BookMeta = {
  slug: string;
  title?: string;
  author?: string;
  excerpt?: string;
  coverImage?: string;
  description?: string;
  date?: string;
  publishedAt?: string;
  buyLink?: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  tags?: string[] | string;
  genre?: string[] | string;
  content?: string;
};

const booksDir = path.join(process.cwd(), 'content', 'books');

export function getBookSlugs(): string[] {
  if (!fs.existsSync(booksDir)) return [];
  return fs.readdirSync(booksDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
}

export function getBookBySlug(
  slug: string,
  fields: (keyof BookMeta | 'content')[] = []
): Partial<BookMeta> & { content?: string } {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = path.join(booksDir, `${realSlug}.mdx`);
  const mdPath = path.join(booksDir, `${realSlug}.md`);

  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  if (!fs.existsSync(fullPath)) {
    return { slug: realSlug, title: 'Book Not Found' };
  }

  const file = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(file);

  const item: Partial<BookMeta> & { content?: string } = { slug: realSlug };

  fields.forEach((field) => {
    if (field === 'content') {
      item.content = content;
      return;
    }
    const value = (data as Record<string, unknown>)[field as string];
    if (typeof value !== 'undefined') {
      (item as Record<string, unknown>)[field] = value as unknown;
    }
  });

  return item;
}

export function getAllBooks(fields: (keyof BookMeta | 'content')[] = []): Partial<BookMeta>[] {
  return getBookSlugs()
    .map((slug) => getBookBySlug(slug, fields))
    .sort((a, b) => {
      const aT = (a.title ?? '').toString().toLowerCase();
      const bT = (b.title ?? '').toString().toLowerCase();
      return aT > bT ? 1 : -1;
    });
}

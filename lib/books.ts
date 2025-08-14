// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BookMeta {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
  downloadPdf?: string;
  downloadEpub?: string;
  content?: string; // only populated when explicitly requested
}

const booksDir = path.join(process.cwd(), 'content', 'books');

export function getBookSlugs(): string[] {
  if (!fs.existsSync(booksDir)) return [];
  return fs
    .readdirSync(booksDir)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
    .map((f) => f.replace(/\.mdx?$/, '')); // strip extension
}

function resolveBookPath(slug: string): string | null {
  const mdx = path.join(booksDir, `${slug}.mdx`);
  const md = path.join(booksDir, `${slug}.md`);
  if (fs.existsSync(mdx)) return mdx;
  if (fs.existsSync(md)) return md;
  return null;
}

export function getBookBySlug(
  slug: string,
  fields: (keyof BookMeta | 'content')[] = []
): Partial<BookMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/, '');

  const fullPath = resolveBookPath(realSlug);
  if (!fullPath) {
    // Graceful fallback — caller applies defaults downstream
    return { slug: realSlug, title: 'Book Not Found' } as Partial<BookMeta>;
  }

  const file = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<BookMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === 'content') {
      item.content = content;
      continue;
    }

    const raw = fm[field as string];

    if (typeof raw !== 'undefined') {
      if (field === 'genre') {
        if (Array.isArray(raw)) {
          item.genre = (raw as unknown[]).map(String).filter(Boolean).join(', ');
        } else {
          item.genre = String(raw);
        }
      } else {
        (item as Record<string, unknown>)[field] = raw;
      }
    }
  }

  return item;
}

export function getAllBooks(fields: (keyof BookMeta | 'content')[] = []): Partial<BookMeta>[] {
  const slugs = getBookSlugs();
  const books = slugs.map((slug) => getBookBySlug(slug, fields));

  // Sort by title (fallback to slug), case-insensitive, asc
  books.sort((a, b) =>
    (a.title || a.slug || '').toString().localeCompare((b.title || b.slug || '').toString(), undefined, {
      sensitivity: 'base',
    })
  );

  return books;
}

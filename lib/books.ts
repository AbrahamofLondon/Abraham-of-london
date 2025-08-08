// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type BookMeta = {
  slug: string;
  title?: string;
  author?: string;
  excerpt?: string;
  coverImage?: string;
  buyLink?: string;
  genre?: string[];       // normalized array
  date?: string;          // optional, for sorting if provided
  publishedAt?: string;   // alias
  tags?: string[];
  image?: string;
  description?: string;
  content?: string;       // included only when requested
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

const booksDirectory = path.join(process.cwd(), 'content/books');

function ensureDir(): void {
  try {
    if (!fs.existsSync(booksDirectory)) {
      fs.mkdirSync(booksDirectory, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to ensure books directory exists:', err);
  }
}

export function getBookSlugs(): string[] {
  ensureDir();
  try {
    return fs
      .readdirSync(booksDirectory)
      .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch (e) {
    console.error(`Error reading books dir: ${booksDirectory}`, e);
    return [];
  }
}

export function getBookBySlug(slug: string, fields: string[] = []): Partial<BookMeta> {
  ensureDir();

  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = path.join(booksDirectory, `${realSlug}.mdx`);
  const mdPath  = path.join(booksDirectory, `${realSlug}.md`);

  let fileContents = '';
  try {
    if (fs.existsSync(mdxPath)) fileContents = fs.readFileSync(mdxPath, 'utf8');
    else if (fs.existsSync(mdPath)) fileContents = fs.readFileSync(mdPath, 'utf8');
    else throw new Error(`Book not found: ${mdxPath} or ${mdPath}`);
  } catch (error) {
    console.error(`Error reading book ${slug}:`, error);
    return { slug: realSlug, title: 'Book Not Found', excerpt: '' };
  }

  const { data, content } = matter(fileContents);

  const normalizeArray = (val: unknown): string[] | undefined => {
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return undefined;
  };

  const normalizedDate = String((data as any).date || (data as any).publishedAt || '');

  const base: Partial<BookMeta> = {
    slug: realSlug,
    title: (data as any).title ?? 'Untitled',
    author: (data as any).author,
    excerpt: (data as any).excerpt,
    coverImage: (data as any).coverImage,
    buyLink: (data as any).buyLink,
    genre: normalizeArray((data as any).genre),
    date: normalizedDate || undefined,
    publishedAt: normalizedDate || undefined,
    tags: normalizeArray((data as any).tags),
    image: (data as any).image,
    description: (data as any).description,
    seo:
      typeof (data as any).seo === 'object' && (data as any).seo !== null
        ? (data as any).seo
        : undefined,
  };

  if (fields.length > 0) {
    const result: Partial<BookMeta> = {};
    for (const field of fields) {
      if (field === 'slug') { result.slug = realSlug; continue; }
      if (field === 'content') { result.content = content || ''; continue; }
      if (field in base && (base as any)[field] !== undefined) {
        (result as any)[field] = (base as any)[field];
      } else if ((data as any)[field] !== undefined) {
        (result as any)[field] = (data as any)[field];
      }
    }
    result.title ??= base.title;
    result.slug ??= realSlug;
    return result;
  }

  return { ...base, content: content || '' };
}

export function getAllBooks(fields: string[] = []): Partial<BookMeta>[] {
  const slugs = getBookSlugs();
  const books = slugs.map((slug) => getBookBySlug(slug, fields));

  // Prefer date sorting if present; otherwise alpha by title
  return books.sort((a, b) => {
    const d1 = new Date(a.date || a.publishedAt || 0).getTime();
    const d2 = new Date(b.date || b.publishedAt || 0).getTime();
    if (d1 !== d2) return d2 - d1;
    const t1 = (a.title || '').toLowerCase();
    const t2 = (b.title || '').toLowerCase();
    return t1.localeCompare(t2);
  });
}

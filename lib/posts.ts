// lib/posts.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { formatDate, parseDate } from './dateUtils';
import { safeString, safeSplit } from './stringUtils';

const postsDirectory = join(process.cwd(), 'content/blog');

export type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  publishedAt?: string;
  coverImage?: string;
  excerpt?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  content?: string;
  image?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

function ensurePostsDir(): void {
  try {
    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to ensure posts directory exists:', err);
  }
}

export function getPostSlugs(): string[] {
  ensurePostsDir();
  try {
    return fs
      .readdirSync(postsDirectory)
      .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'));
  } catch (error) {
    console.error(`Error reading posts directory: ${postsDirectory}`, error);
    return [];
  }
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta {
  ensurePostsDir();

  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPathMdx = join(postsDirectory, `${realSlug}.mdx`);
  const fullPathMd = join(postsDirectory, `${realSlug}.md`);

  let fileContents = '';
  try {
    if (fs.existsSync(fullPathMdx)) {
      fileContents = fs.readFileSync(fullPathMdx, 'utf8');
    } else if (fs.existsSync(fullPathMd)) {
      fileContents = fs.readFileSync(fullPathMd, 'utf8');
    } else {
      throw new Error(`Post file not found: ${fullPathMdx} or ${fullPathMd}`);
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    const now = formatDate(new Date());
    return {
      slug: realSlug,
      title: 'Post Not Found',
      date: now,
      publishedAt: now,
      excerpt: '',
      author: 'Abraham of London',
      content: '',
    };
  }

  const { data, content } = matter(fileContents);

  const normalizeArray = (val: unknown): string[] | undefined => {
    if (Array.isArray(val)) return val.map((v) => safeString(v)).filter(Boolean);
    if (typeof val === 'string') {
      return safeSplit(safeString(val), ',').map((t) => t.trim()).filter(Boolean);
    }
    return undefined;
  };

  const normalizedDate = formatDate((data as any).date || (data as any).publishedAt);

  const base: PostMeta = {
    slug: realSlug,
    title: safeString((data as any).title) || 'Untitled',
    date: normalizedDate,
    publishedAt: normalizedDate,
    coverImage: safeString((data as any).coverImage),
    excerpt: safeString((data as any).excerpt),
    author: safeString((data as any).author) || 'Abraham of London',
    readTime: safeString((data as any).readTime),
    category: safeString((data as any).category),
    tags: normalizeArray((data as any).tags),
    image: safeString((data as any).image),
    seo:
      typeof (data as any).seo === 'object' && (data as any).seo !== null
        ? (data as any).seo
        : undefined,
  };

  if (fields.length > 0) {
    const result: Partial<PostMeta> = {};
    for (const field of fields) {
      if (field === 'content') {
        (result as any).content = content || '';
        continue;
      }
      if (field === 'slug') {
        (result as any).slug = realSlug;
        continue;
      }
      if (field in base && (base as any)[field] !== undefined) {
        (result as any)[field] = (base as any)[field];
      } else if ((data as any)[field] !== undefined) {
        (result as any)[field] = (data as any)[field];
      }
    }
    (result as any).title ??= base.title;
    (result as any).slug ??= base.slug;
    return result as PostMeta;
  }

  return { ...base, content: content || '' };
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = getPostSlugs();

  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .filter((p) => p.title && p.title !== 'Post Not Found')
    .sort((a, b) => {
      const d1 = a.date ? parseDate(a.date) : new Date(0);
      const d2 = b.date ? parseDate(b.date) : new Date(0);
      return d2.getTime() - d1.getTime();
    });

  return posts;
}

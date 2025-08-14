// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string;           // ISO or readable
  publishedAt?: string;    // ISO or readable
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];         // normalized below
  featured?: boolean;      // <-- added
  wordCount?: number;      // <-- added
  views?: number;          // <-- added
  content?: string;        // only returned if requested
};

const postsDir = path.join(process.cwd(), 'content', 'blog');

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
}

function safeWordCount(markdown: string): number {
  // strip code fences/inline code and markdown syntax for a rough count
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/[#>*_~`>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(' ').length : 0;
}

function computeExcerpt(markdown: string, limit = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/[#>*_~`>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= limit ? text : `${text.slice(0, limit).trim()}…`;
}

function tsFromDateLike(v?: string): number {
  if (!v) return 0;
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
}

export function getPostBySlug(
  slug: string,
  fields: (keyof PostMeta | 'content')[] = []
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = path.join(postsDir, `${realSlug}.mdx`);
  const mdPath = path.join(postsDir, `${realSlug}.md`);
  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(fullPath)) {
    return { slug: realSlug, title: 'Post Not Found' };
  }

  const file = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(file);
  const fm = (data || {}) as Record<string, unknown>;

  const item: Partial<PostMeta> & { content?: string } = { slug: realSlug };

  for (const field of fields) {
    if (field === 'content') {
      item.content = content;
      continue;
    }

    // Pull raw value from front-matter if present
    let value = fm[field as string];

    switch (field) {
      case 'tags': {
        if (Array.isArray(value)) {
          item.tags = (value as unknown[]).map((x) => String(x)).filter(Boolean);
        } else if (typeof value === 'string') {
          item.tags = value.split(',').map((s) => s.trim()).filter(Boolean);
        }
        break;
      }
      case 'featured': {
        item.featured = Boolean(value);
        break;
      }
      case 'wordCount': {
        const precalced = typeof value === 'number' ? value : undefined;
        item.wordCount = typeof precalced === 'number' ? precalced : safeWordCount(content || '');
        break;
      }
      case 'views': {
        item.views = typeof value === 'number' ? value : undefined;
        break;
      }
      case 'excerpt': {
        const v = typeof value === 'string' && value.trim() ? (value as string) : computeExcerpt(content || '');
        item.excerpt = v;
        break;
      }
      case 'date':
      case 'publishedAt': {
        if (typeof value === 'string') item[field] = value as string;
        break;
      }
      default: {
        if (typeof value !== 'undefined') {
          (item as Record<string, unknown>)[field] = value;
        }
      }
    }
  }

  return item;
}

export function getAllPosts(
  fields: (keyof PostMeta | 'content')[] = []
): Partial<PostMeta>[] {
  const slugs = getPostSlugs();

  const posts = slugs.map((slug) => getPostBySlug(slug, fields));

  // Sort by publishedAt, then date, newest first
  posts.sort((a, b) => {
    const ta = tsFromDateLike(a.publishedAt || a.date);
    const tb = tsFromDateLike(b.publishedAt || b.date);
    return tb - ta;
  });

  return posts;
}

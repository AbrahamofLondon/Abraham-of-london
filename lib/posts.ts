import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string;          // normalized
  publishedAt?: string;   // normalized alias
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  image?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
  content?: string;       // only set if requested via fields
};

const postsDirectory = path.join(process.cwd(), 'content/blog');

function ensureDir(): void {
  try {
    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to ensure posts directory exists:', err);
  }
}

export function getPostSlugs(): string[] {
  ensureDir();
  try {
    return fs
      .readdirSync(postsDirectory)
      .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'));
  } catch (error) {
    console.error(`Error reading posts directory: ${postsDirectory}`, error);
    return [];
  }
}

export function getPostBySlug(slug: string, fields: string[] = []): Partial<PostMeta> {
  ensureDir();

  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = path.join(postsDirectory, `${realSlug}.mdx`);
  const mdPath  = path.join(postsDirectory, `${realSlug}.md`);

  let fileContents = '';
  try {
    if (fs.existsSync(mdxPath)) {
      fileContents = fs.readFileSync(mdxPath, 'utf8');
    } else if (fs.existsSync(mdPath)) {
      fileContents = fs.readFileSync(mdPath, 'utf8');
    } else {
      throw new Error(`Post file not found: ${mdxPath} or ${mdPath}`);
    }
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    // Minimal safe stub so callers don’t crash
    return { slug: realSlug, title: 'Post Not Found', excerpt: '' };
  }

  const { data, content } = matter(fileContents);

  // Normalize helpers
  const normalizeArray = (val: unknown): string[] | undefined => {
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
    return undefined;
  };

  const normalizedDate = String((data as any).date || (data as any).publishedAt || '');

  const base: Partial<PostMeta> = {
    slug: realSlug,
    title: (data as any).title ?? 'Untitled',
    date: normalizedDate || undefined,
    publishedAt: normalizedDate || undefined,
    excerpt: (data as any).excerpt,
    coverImage: (data as any).coverImage,
    author: (data as any).author,
    readTime: (data as any).readTime,
    category: (data as any).category,
    tags: normalizeArray((data as any).tags),
    image: (data as any).image,
    seo: typeof (data as any).seo === 'object' && (data as any).seo !== null ? (data as any).seo : undefined,
  };

  // If fields requested, return trimmed object + content when asked
  if (fields.length > 0) {
    const result: Partial<PostMeta> = {};
    for (const field of fields) {
      if (field === 'slug') { result.slug = realSlug; continue; }
      if (field === 'content') { result.content = content || ''; continue; }
      if (field in base && (base as any)[field] !== undefined) {
        (result as any)[field] = (base as any)[field];
      } else if ((data as any)[field] !== undefined) {
        (result as any)[field] = (data as any)[field];
      }
    }
    // Ensure sensible minimums
    result.title ??= base.title;
    result.slug ??= realSlug;
    return result;
  }

  // Default: include content
  return { ...base, content: content || '' };
}

export function getAllPosts(fields: string[] = []): Partial<PostMeta>[] {
  const slugs = getPostSlugs();
  const posts = slugs.map((slug) => getPostBySlug(slug, fields));

  // Sort by date desc; fall back safely
  return posts.sort((a, b) => {
    const d1 = new Date(a.date || a.publishedAt || 0).getTime();
    const d2 = new Date(b.date || b.publishedAt || 0).getTime();
    return d2 - d1;
  });
}

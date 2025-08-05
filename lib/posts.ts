// lib/posts.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { formatDate, parseDate } from './dateUtils';
import { safeString, safeSplit } from './stringUtils';

const postsDirectory = join(process.cwd(), 'content/posts');

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  coverImage?: string;
  excerpt: string;
  author: string;
  description: string;
  image?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  genre?: string[];
  content?: string;
};

export function getPostSlugs(): string[] {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn('⚠️ Posts directory does not exist. Creating...');
      fs.mkdirSync(postsDirectory, { recursive: true });
      return [];
    }
    return fs.readdirSync(postsDirectory).filter(name => name.endsWith('.mdx') || name.endsWith('.md'));
  } catch (error) {
    console.error('❌ Error reading posts directory:', error);
    return [];
  }
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = join(postsDirectory, `${realSlug}.mdx`);
  const mdPath = join(postsDirectory, `${realSlug}.md`);

  try {
    const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null;
    if (!filePath) throw new Error(`Post file not found for slug: ${slug}`);

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    const base: PostMeta = {
      slug: realSlug,
      title: safeString(data.title) || 'Untitled',
      excerpt: safeString(data.excerpt) || '',
      author: safeString(data.author) || 'Abraham of London',
      description: safeString(data.description) || '',
      date: formatDate(data.date || data.publishedAt),
      publishedAt: formatDate(data.date || data.publishedAt),
      coverImage: data.coverImage ?? '',
      image: data.image ?? '',
      readTime: data.readTime ?? '',
      category: safeString(data.category),
      tags: [],
      genre: [],
      content: content || '',
    };

    // Ensure consistent array parsing
    if (data.tags) {
      base.tags = Array.isArray(data.tags)
        ? data.tags.map(safeString)
        : safeSplit(safeString(data.tags), ',').map(tag => tag.trim());
    }

    if (data.genre) {
      base.genre = Array.isArray(data.genre)
        ? data.genre.map(safeString)
        : safeSplit(safeString(data.genre), ',').map(g => g.trim());
    }

    const filtered = fields.length > 0
      ? fields.reduce((acc, field) => {
          if (field in base) acc[field as keyof PostMeta] = base[field as keyof PostMeta];
          return acc;
        }, {} as Partial<PostMeta>)
      : base;

    return filtered as PostMeta;
  } catch (error) {
    console.error(`❌ Error reading post ${slug}:`, error);
    const now = formatDate(new Date());
    return {
      slug: realSlug,
      title: 'Post Not Found',
      date: now,
      publishedAt: now,
      excerpt: '',
      author: 'Abraham of London',
      description: 'This post could not be loaded.',
      content: '',
    };
  }
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  return getPostSlugs()
    .map(slug => getPostBySlug(slug, fields))
    .filter(post => post.title !== 'Post Not Found')
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
}

export function getPostsByCategory(category: string, fields: string[] = []): PostMeta[] {
  return getAllPosts(fields).filter(post =>
    post.category?.toLowerCase() === category.toLowerCase()
  );
}

export function getPostsByTag(tag: string, fields: string[] = []): PostMeta[] {
  return getAllPosts(fields).filter(post =>
    post.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getRelatedPosts(currentSlug: string, limit: number = 3, fields: string[] = []): PostMeta[] {
  const all = getAllPosts(fields);
  const current = getPostBySlug(currentSlug, ['category', 'tags']);

  if (current.title === 'Post Not Found') return [];

  return all
    .filter(post => post.slug !== currentSlug)
    .map(post => {
      let score = 0;

      if (post.category && current.category && post.category.toLowerCase() === current.category.toLowerCase()) {
        score += 3;
      }

      if (post.tags && current.tags) {
        const shared = post.tags.filter(tag =>
          current.tags!.some(cur => cur.toLowerCase() === tag.toLowerCase())
        );
        score += shared.length;
      }

      return { post, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.post);
}

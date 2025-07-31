import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const postsDirectory = join(process.cwd(), 'content/posts');

type PostSeo = {
  title?: string;
  description?: string;
  keywords?: string;
};

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  coverImage?: string;
  excerpt: string;
  author: string;
  description: string;
  image?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  genre?: string[];
  buyLink?: string;
  seo?: PostSeo;
};

export type PostWithContent = PostMeta & { content: string };

export function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory).filter((filename) => filename.endsWith('.mdx'));
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta | PostWithContent {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: Partial<PostWithContent> = { slug: realSlug };

  if (fields.includes('content')) {
    items.content = content;
  }

  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && data[field] !== undefined) {
      if (field === 'tags' || field === 'genre') {
        (items as Record<string, string[]>)[field] = Array.isArray(data[field])
          ? data[field].map((tag: unknown) => String(tag))
          : [String(data[field])];
      } else if (field === 'seo') {
        if (typeof data[field] === 'object' && data[field] !== null) {
          items.seo = data[field] as PostSeo;
        }
      } else {
        (items as Record<string, string>)[field] = String(data[field]);
      }
    }
  });

  // Fallback defaults
  if (!items.title) items.title = '';
  if (!items.date) items.date = '';
  if (!items.excerpt) items.excerpt = '';
  if (!items.author) items.author = '';
  if (!items.description) items.description = '';
  if (!items.image) items.image = '';

  return fields.includes('content') ? (items as PostWithContent) : (items as PostMeta);
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = getPostSlugs();
  return slugs
    .map((slug) => getPostBySlug(slug, fields) as PostMeta)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

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
  return fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.mdx'));
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta | PostWithContent {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const item: Partial<PostWithContent> = { slug: realSlug };

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
  item.date ??= '';
  item.excerpt ??= '';
  item.author ??= '';
  item.description ??= '';
  item.image ??= '';

  return fields.includes('content') ? (item as PostWithContent) : (item as PostMeta);
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug, fields) as PostMeta)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

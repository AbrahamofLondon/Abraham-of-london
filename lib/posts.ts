<<<<<<< Updated upstream
=======
// lib/posts.ts

>>>>>>> Stashed changes
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

<<<<<<< Updated upstream
export interface PostMeta {
=======
const postsDirectory = join(process.cwd(), 'posts');

export type PostMeta = {
>>>>>>> Stashed changes
  slug: string;
  title: string;
  date: string;
  coverImage?: string;
<<<<<<< Updated upstream
  excerpt?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  description?: string;
}

// Corrected path to the posts directory
const postsDirectory = join(process.cwd(), 'content/posts');

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta & { content?: string } {
  const realSlug = slug.replace(/\.mdx?$/, '');
=======
  excerpt: string;
  author: string;
  description: string;
  image?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  genre?: string[];
  buyLink?: string;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
};

export type PostWithContent = PostMeta & { content: string };

export function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.mdx'));
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta | PostWithContent {
  const realSlug = slug.replace(/\.mdx$/, '');
>>>>>>> Stashed changes
  const fullPath = join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

<<<<<<< Updated upstream
  const post: Partial<PostMeta & { content?: string }> = {};

  fields.forEach((field) => {
    if (field === 'slug') post.slug = realSlug;
    if (field === 'content') post.content = content;
    if (field in data) post[field as keyof PostMeta] = data[field];
  });

  // Fix image path to match /public/images/blog/
  if (post.coverImage && typeof post.coverImage === 'string' && !post.coverImage.startsWith('/')) {
    post.coverImage = `/images/blog/${post.coverImage}`;
  }

  return post as PostMeta & { content?: string };
=======
  const items: Partial<PostWithContent> = {};

  items.slug = typeof data.slug === 'string' ? data.slug : realSlug;

  if (fields.includes('content')) {
    items.content = content;
  }

  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && data[field] !== undefined) {
      if (field === 'tags' || field === 'genre') {
        items[field] = Array.isArray(data[field])
          ? data[field].map((item: any) => String(item))
          : [String(data[field])];
      } else if (field === 'seo' && typeof data[field] === 'object' && data[field] !== null) {
        items.seo = data[field];
      } else {
        (items as any)[field] = data[field];
      }
    }
  });

  items.title ??= '';
  items.date ??= '';
  items.excerpt ??= '';
  items.author ??= '';
  items.description ??= '';
  items.image ??= '';

  return fields.includes('content') ? (items as PostWithContent) : (items as PostMeta);
>>>>>>> Stashed changes
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = fs.readdirSync(postsDirectory);
  const posts = slugs
<<<<<<< Updated upstream
    .filter(slug => slug.endsWith('.mdx'))
    .map((slug) => getPostBySlug(slug, fields))
    .sort((a, b) => (a.date! > b.date! ? -1 : 1));
=======
    .map((slug) => getPostBySlug(slug, fields) as PostMeta)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
>>>>>>> Stashed changes
  return posts;
}

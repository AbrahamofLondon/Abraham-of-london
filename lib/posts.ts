import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  coverImage?: string;
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
  const fullPath = join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

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
}

export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = fs.readdirSync(postsDirectory);
  const posts = slugs
    .filter(slug => slug.endsWith('.mdx'))
    .map((slug) => getPostBySlug(slug, fields))
    .sort((a, b) => (a.date! > b.date! ? -1 : 1));
  return posts;
}
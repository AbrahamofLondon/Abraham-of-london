// lib/posts.ts
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// Correct path to your posts directory
// This should point to 'C:\Codex-setup\Abraham-of-london\posts\'
const postsDirectory = join(process.cwd(), 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  author: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  [key: string]: any; // Allow for additional front matter properties
}

export function getPostSlugs() {
  // Get all files from the posts directory
  const files = fs.readdirSync(postsDirectory);
  // Filter for .mdx files and extract slugs (filenames without extension)
  return files.filter(file => file.endsWith('.mdx')).map(file => file.replace(/\.mdx$/, ''));
}

export function getPostBySlug(slug: string, fields: string[] = []): PostMeta {
  const fullPath = join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: PostMeta = { slug, title: '', date: '', coverImage: '', excerpt: '', author: '' };

  // Ensure required fields are always included and cast correctly
  if (data.title) items.title = data.title;
  if (data.date) items.date = data.date;
  if (data.coverImage) items.coverImage = data.coverImage;
  if (data.excerpt) items.excerpt = data.excerpt;
  if (data.author) items.author = data.author;

  // Add optional fields if they exist and are requested
  if (data.readTime) items.readTime = data.readTime;
  if (data.category) items.category = data.category;
  if (data.tags) items.tags = data.tags;

  // Ensure content is always included if requested
  if (fields.includes('content')) {
    items.content = content;
  }

  // Iterate over other requested fields and add them to items
  fields.forEach((field) => {
    if (field !== 'slug' && field !== 'content' && items[field] === undefined) {
      if (typeof data[field] !== 'undefined') {
        items[field] = data[field];
      }
    }
  });

  return items;
}


export function getAllPosts(fields: string[] = []): PostMeta[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    // sort posts by date in descending order
    .sort((post1, post2) => (new Date(post1.date) > new Date(post2.date) ? -1 : 1));
  return posts;
}
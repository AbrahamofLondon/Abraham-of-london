// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter'; // You might need to install gray-matter: npm install gray-matter

// Define the path to your markdown posts directory
const postsDirectory = path.join(process.cwd(), 'posts'); // Assuming your posts are in a 'posts' directory at the root

export interface PostMeta {
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  category: string;
  author: string;
  readTime: string;
  slug: string; // The slug is typically the filename without extension
}

interface Post {
  slug: string;
  data: PostMeta;
  content: string;
}

export function getPostSlugs(): string[] {
  return fs.readdirSync(postsDirectory).map(fileName => fileName.replace(/\.mdx?$/, ''));
}

export function getPostBySlug(slug: string): Post {
  const fullPath = path.join(postsDirectory, `${slug}.md`); // Assuming .md files
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    data: data as PostMeta, // Cast data to PostMeta interface
    content,
  };
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs.map(slug => getPostBySlug(slug));

  // Sort posts by date in descending order (newest first)
  posts.sort((a, b) => {
    const dateA = new Date(a.data.date);
    const dateB = new Date(b.data.date);
    return dateB.getTime() - dateA.getTime();
  });

  return posts;
}
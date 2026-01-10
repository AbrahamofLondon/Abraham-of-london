// lib/content-manager.mjs
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const contentDir = path.join(rootDir, 'content');

export async function getAllPosts() {
  try {
    const blogDir = path.join(contentDir, 'blog');
    const files = await fs.readdir(blogDir);
    
    const posts = [];
    for (const file of files) {
      if (file.endsWith('.mdx') || file.endsWith('.md')) {
        const filePath = path.join(blogDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const { data } = matter(content);
        
        posts.push({
          ...data,
          slug: file.replace(/\.(mdx|md)$/, ''),
          url: `/blog/${file.replace(/\.(mdx|md)$/, '')}`,
        });
      }
    }
    
    return posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } catch (error) {
    console.warn('⚠️ Could not load posts:', error.message);
    return [];
  }
}

export async function getPost(slug) {
  try {
    const posts = await getAllPosts();
    return posts.find(post => post.slug === slug) || null;
  } catch (error) {
    console.warn('⚠️ Could not get post:', error.message);
    return null;
  }
}

// Similar functions for other content types...
export async function getAllBooks() { return []; }
export async function getBook(slug) { return null; }

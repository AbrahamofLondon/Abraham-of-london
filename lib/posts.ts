import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { PostMeta } from '@/types';

const postsDirectory = path.join(process.cwd(), 'posts');

export function getAllPosts(): PostMeta[] {
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      return {
        slug,
        title: data.title ?? '',
        date: data.date ?? '',
        excerpt: data.excerpt ?? '',
        coverImage: data.coverImage ?? '',
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      return dateB - dateA;
    });
}

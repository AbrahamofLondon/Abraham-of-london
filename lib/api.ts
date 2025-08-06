import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const postsDirectory = join(process.cwd(), '_posts');

type PostData = Record<string, string>;

export function getPostBySlug(slug: string, fields: string[] = []): PostData {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: PostData = {};

  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = realSlug;
    }
    if (field === 'content') {
      items[field] = content;
    }
    if (data[field] !== undefined) {
      // Safely convert non-string values to string
      items[field] = typeof data[field] === 'string' ? data[field] : JSON.stringify(data[field]);
    }
  });

  return items;
}

export function getAllPosts(fields: string[] = []): PostData[] {
  const slugs = fs.readdirSync(postsDirectory);
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((post1, post2) => {
      // Sort by date if date field exists
      const date1 = post1.date ? new Date(post1.date) : new Date(0);
      const date2 = post2.date ? new Date(post2.date) : new Date(0);
      return date2.getTime() - date1.getTime();
    });
  return posts;
}

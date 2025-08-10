// lib/posts.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[] | string;
  content?: string;
};

const postsDirectory = path.join(process.cwd(), 'content/blog');

export function getPostSlugs(): string[] {
  try {
    if (!fs.existsSync(postsDirectory)) return [];
    return fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
  } catch {
    return [];
  }
}

export function getPostBySlug(slug: string, fields: string[] = []): Partial<PostMeta> {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPathMdx = path.join(postsDirectory, `${realSlug}.mdx`);
  const fullPathMd = path.join(postsDirectory, `${realSlug}.md`);

  let fileContents = '';
  if (fs.existsSync(fullPathMdx)) fileContents = fs.readFileSync(fullPathMdx, 'utf8');
  else if (fs.existsSync(fullPathMd)) fileContents = fs.readFileSync(fullPathMd, 'utf8');
  else return { slug: realSlug, title: 'Post Not Found' };

  const { data, content } = matter(fileContents);
  const fm = data as Record<string, unknown>;

  const item: Partial<PostMeta> = {};
  const wants = new Set(fields);

  if (wants.has('slug')) item.slug = realSlug;
  if (wants.has('content')) item.content = content;

  const assignString = (key: keyof PostMeta) => {
    const v = fm[key as string];
    if (typeof v === 'string') (item as Record<string, unknown>)[key] = v;
  };

  const assignStringOrArray = (key: 'tags') => {
    const v = fm[key];
    if (Array.isArray(v)) (item as Record<string, unknown>)[key] = v.map(String);
    else if (typeof v === 'string') (item as Record<string, unknown>)[key] = v;
  };

  const maybe = (k: keyof PostMeta) => wants.has(k as string);

  if (maybe('title')) assignString('title');
  if (maybe('date')) assignString('date');
  if (maybe('excerpt')) assignString('excerpt');
  if (maybe('coverImage')) assignString('coverImage');
  if (maybe('author')) assignString('author');
  if (maybe('readTime')) assignString('readTime');
  if (maybe('category')) assignString('category');
  if (maybe('tags')) assignStringOrArray('tags');

  if (!item.slug) item.slug = realSlug;

  return item;
}

export function getAllPosts(fields: string[] = []): Partial<PostMeta>[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((s) => getPostBySlug(s, fields))
    .sort((a, b) => {
      const d1 = (a.date || '').toString();
      const d2 = (b.date || '').toString();
      return d2.localeCompare(d1);
    });
  return posts;
}

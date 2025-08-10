import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type PostMeta = {
  slug: string;
  title?: string;
  date?: string;
  publishedAt?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  content?: string;
};

const postsDir = path.join(process.cwd(), 'content', 'blog');

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir).filter((f) => f.endsWith('.mdx') || f.endsWith('.md'));
}

export function getPostBySlug(
  slug: string,
  fields: (keyof PostMeta | 'content')[] = []
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const mdxPath = path.join(postsDir, `${realSlug}.mdx`);
  const mdPath = path.join(postsDir, `${realSlug}.md`);

  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;
  if (!fs.existsSync(fullPath)) {
    return { slug: realSlug, title: 'Post Not Found' };
  }

  const file = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(file);

  const item: Partial<PostMeta> & { content?: string } = { slug: realSlug };

  fields.forEach((field) => {
    if (field === 'content') {
      item.content = content;
      return;
    }
    const value = (data as Record<string, unknown>)[field as string];
    if (typeof value !== 'undefined') {
      (item as Record<string, unknown>)[field] = value;
    }
  });

  return item;
}

export function getAllPosts(fields: (keyof PostMeta | 'content')[] = []): Partial<PostMeta>[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug, fields))
    .sort((a, b) => {
      const aDate = (a.date ?? a.publishedAt ?? '').toString();
      const bDate = (b.date ?? b.publishedAt ?? '').toString();
      return aDate > bDate ? -1 : 1;
    });
}

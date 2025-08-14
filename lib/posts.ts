// lib/posts.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

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
  tags?: string[] | string;
  // NEW optional fields your blog page requests:
  featured?: boolean;
  wordCount?: number;
  views?: number;
  content?: string;
};

const postsDir = path.join(process.cwd(), "content", "blog");

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
}

export function getPostBySlug(
  slug: string,
  fields: (keyof PostMeta | "content")[] = [],
): Partial<PostMeta> & { content?: string } {
  const realSlug = slug.replace(/\.(mdx|md)$/, "");
  const mdxPath = path.join(postsDir, `${realSlug}.mdx`);
  const mdPath = path.join(postsDir, `${realSlug}.md`);
  const fullPath = fs.existsSync(mdxPath) ? mdxPath : mdPath;

  if (!fs.existsSync(fullPath))
    return { slug: realSlug, title: "Post Not Found" };

  const file = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(file);

  const item: Partial<PostMeta> & { content?: string } = { slug: realSlug };

  fields.forEach((field) => {
    if (field === "content") {
      item.content = content;
    } else {
      const value = (data as Record<string, unknown>)[field as string];
      if (typeof value !== "undefined") {
        (item as Record<string, unknown>)[field] = value as never;
      }
    }
  });

  return item;
}

export function getAllPosts(
  fields: (keyof PostMeta | "content")[] = [],
): Partial<PostMeta>[] {
  return getPostSlugs()
    .map((slug) => getPostBySlug(slug, fields))
    .sort((a, b) => {
      const ad = (a.date ?? a.publishedAt ?? "").toString();
      const bd = (b.date ?? b.publishedAt ?? "").toString();
      return ad > bd ? -1 : 1;
    });
}





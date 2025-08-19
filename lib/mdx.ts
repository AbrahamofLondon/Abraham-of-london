// lib/mdx.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { PostMeta } from "@/types/post";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function toTitle(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stripMd(s: string) {
  return s
    .replace(/!\[[^\]]*]\([^)]+\)/g, "") // images
    .replace(/\[[^\]]*]\([^)]+\)/g, "")  // links
    .replace(/[#>*`~_*>-]+/g, " ")       // markdown tokens
    .replace(/\s+/g, " ")
    .trim();
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/i.test(f));

  const posts: PostMeta[] = files.map((file) => {
    const slug = file.replace(/\.mdx?$/i, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);

    const title =
      typeof data.title === "string" && data.title.trim()
        ? data.title
        : toTitle(slug);

    const firstPara = content.split(/\r?\n\r?\n/).find(Boolean) ?? "";
    const excerpt =
      typeof data.excerpt === "string" && data.excerpt.trim()
        ? data.excerpt
        : stripMd(firstPara).slice(0, 180);

    return {
      slug,
      title,
      excerpt,
      date: typeof data.date === "string" ? data.date : null,
      coverImage: typeof data.coverImage === "string" ? data.coverImage : null,
      readTime: typeof data.readTime === "string" ? data.readTime : null,
      category: typeof data.category === "string" ? data.category : null,
      author: typeof data.author === "string" ? data.author : null,
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : null,
    };
  });

  // newest first
  posts.sort((a, b) => {
    const at = a.date ? Date.parse(a.date) : 0;
    const bt = b.date ? Date.parse(b.date) : 0;
    return bt - at;
  });

  return posts;
}

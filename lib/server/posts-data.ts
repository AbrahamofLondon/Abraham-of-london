// lib/server/posts-data.ts
// Robust MDX data access for blog posts

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export type PostMeta = {
  slug: string;
  title?: string;
  description?: string;
  excerpt?: string;
  coverImage?: string;
  heroImage?: string;
  date?: string;
  updated?: string;
  author?: string;
  tags?: (string | number)[];
  category?: string;
  readTime?: string;
  draft?: boolean;
  resources?: {
    downloads?: { href?: string }[];
    reads?: { href?: string }[];
  };
  keyInsights?: string[];
  authorNote?: string;
  authorTitle?: string;
  [key: string]: unknown;
};

type PostWithContent = PostMeta & { content?: string };

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getPostFilePaths(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter(
      (file) =>
        file.toLowerCase().endsWith(".mdx") ||
        file.toLowerCase().endsWith(".md"),
    );
}

// Exposed slugs used by getStaticPaths
export function getPostSlugs(): string[] {
  return getPostFilePaths().map((file) =>
    file.replace(/\.mdx?$/i, ""),
  );
}

// Core loader
export function getPostBySlug(
  slug: string,
  fields: string[] = [],
): PostWithContent {
  const realSlug = slug.replace(/\.mdx?$/i, "");

  // Try .mdx first, then .md
  let fullPath = path.join(POSTS_DIR, `${realSlug}.mdx`);
  if (!fs.existsSync(fullPath)) {
    const mdPath = path.join(POSTS_DIR, `${realSlug}.md`);
    if (!fs.existsSync(mdPath)) {
      throw new Error(
        `Post not found for slug "${slug}" in ${POSTS_DIR}`,
      );
    }
    fullPath = mdPath;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // If fields not specified, use a sensible default set
  const defaultFields = [
    "slug",
    "title",
    "description",
    "excerpt",
    "coverImage",
    "heroImage",
    "date",
    "updated",
    "author",
    "tags",
    "category",
    "readTime",
    "draft",
    "resources",
    "keyInsights",
    "authorNote",
    "authorTitle",
    "content",
  ];

  const fieldSet = new Set(fields.length > 0 ? fields : defaultFields);

  const post: Record<string, unknown> = {};

  fieldSet.forEach((field) => {
    if (field === "slug") {
      post.slug = realSlug;
      return;
    }
    if (field === "content") {
      post.content = content;
      return;
    }
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      post[field] = (data as any)[field];
    }
  });

  return post as PostWithContent;
}

// All posts (for /blog index etc.)
export function getAllPosts(
  fields: string[] = [],
): PostWithContent[] {
  const slugs = getPostSlugs();

  const posts = slugs
    .map((slug) => {
      try {
        return getPostBySlug(slug, fields);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `Error reading post for slug "${slug}":`,
          err,
        );
        return null;
      }
    })
    .filter((p): p is PostWithContent => p !== null)
    // strip drafts
    .filter((post) => !post.draft)
    // sort by date desc
    .sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });

  return posts;
}
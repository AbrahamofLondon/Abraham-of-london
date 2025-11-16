// lib/posts.ts
import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "@/lib/server/md-utils";

export type Post = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string | null;
  tags?: string[] | null;
  coverImage?: string | null;
  // You may want access to raw MD content later
  content?: string;
  [key: string]: unknown;
};

export function safePosts(input: unknown): Post[] {
  if (!Array.isArray(input)) return [];
  return input.filter((x) => x && typeof x === "object" && "slug" in x) as Post[];
}

export function findPost(posts: Post[], slug: string): Post | undefined {
  const key = String(slug || "").toLowerCase();
  return posts.find((p) => String(p.slug || "").toLowerCase() === key);
}

// ------------------------------
// Internal FS loader
// ------------------------------

function loadAllPostsFromFs(): Post[] {
  // We support any of these directories under /content
  const candidateDirs = ["posts", "blog", "blogs"];

  const files: string[] = [];
  for (const dir of candidateDirs) {
    const abs = ensureDir(dir);
    if (!abs) continue;
    const dirFiles = listMdFiles(abs);
    files.push(...dirFiles);
  }

  if (!files.length) {
    // No blog directories found – empty, but safe
    return [];
  }

  const posts: Post[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);
    const rawSlug = (data.slug as string) || fileToSlug(absFile);

    const slug = String(rawSlug || "").trim().replace(/^\/+|\/+$/g, "");

    const title =
      (data.title as string) ||
      slug ||
      "Untitled";

    const date = (data.date as string | undefined) || undefined;

    const excerpt =
      (data.excerpt as string | undefined) ||
      (data.description as string | undefined) ||
      null;

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t))
      : null;

    const coverImage =
      (data.coverImage as string | undefined) ||
      (data.cover as string | undefined) ||
      null;

    return {
      slug,
      title,
      date,
      excerpt,
      tags,
      coverImage,
      content,
      ...data,
    };
  });

  return sortByDateDesc(posts);
}

// Simple in-memory cache to avoid re-reading disk repeatedly in dev/ISR
let POSTS_CACHE: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (!POSTS_CACHE) {
    POSTS_CACHE = loadAllPostsFromFs();
  }
  return POSTS_CACHE;
}

export function getPostBySlug(slug: string): Post | undefined {
  const posts = getAllPosts();
  return findPost(posts, slug);
}
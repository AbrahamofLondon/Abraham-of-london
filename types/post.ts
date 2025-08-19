// types/post.ts
export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;          // always a string (computed fallback)
  date: string | null;
  coverImage: string | null;
  readTime: string | null;
  category: string | null;
  author: string | null;
  tags: string[] | null;
};

// @/types/post.ts
export type PostMeta = {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  coverImage?: string;
  readTime?: string;
  category?: string;
  author?: string;
  tags?: string[];
};
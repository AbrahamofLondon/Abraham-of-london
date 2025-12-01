// types/post.ts

export interface PostMeta {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];

  // Reading / presentation
  readTime?: string;
  coverImage?: string | { src?: string } | null;
  heroImage?: string;

  // Editorial
  published?: boolean;
  draft?: boolean;

  // SEO
  description?: string;
}
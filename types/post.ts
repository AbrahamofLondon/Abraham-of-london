// types/post.ts
export interface PostMeta {
  slug: string;
  title: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  // ✅ ADD THESE OPTIONAL PROPERTIES:
  readTime?: string;
  coverImage?: string | { src?: string } | null;
  // Add any other missing properties that your posts might have
  published?: boolean;
  description?: string;
  heroImage?: string;
}
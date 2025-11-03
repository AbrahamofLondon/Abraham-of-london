// types/post.ts (CRITICAL FINAL TYPE FIX)

export type Author = string | { name?: string; image?: string } | null;

export interface PostMeta {
  slug: string; 
  title: string; 
  date?: string | null; 
  excerpt?: string | null;
  coverImage?: string | null;
  author?: Author; 
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
  summary?: string | null;
  location?: string | null;
  subtitle?: string | null;
  coverAspect?: "book" | "wide" | "square" | null; 
  coverFit?: "cover" | "contain" | null;        
  coverPosition?: "left" | "center" | "right" | null; 
}
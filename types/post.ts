// types/post.ts (CRITICAL FINAL TYPE FIX)
export type PostMeta = {
  slug: string; 
  title: string; 
  
  // FIX: Allow null for all optional properties derived from MDX/Frontmatter
  date: string | null; 
  excerpt: string | null;
  coverImage: string | null;
  author: string | { name?: string; image?: string } | null;
  readTime: string | null;
  category: string | null;
  tags: string[] | null;
  
  // Fixes the complex union type errors:
  summary?: string | null;
  location?: string | null;
  subtitle?: string | null;

  coverAspect?: "book" | "wide" | "square" | null; 
  coverFit?: "cover" | "contain" | null;        
  coverPosition?: "left" | "center" | "right" | null; 
  
  // NOTE: Ensure 'content' is part of this type if needed elsewhere
  // content?: string; 
};
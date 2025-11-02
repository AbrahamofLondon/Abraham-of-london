// types/post.ts (CRITICAL FINAL TYPE FIX)

// Define the Author type explicitly as it is a union in the errors
export type Author = string | { name?: string; image?: string } | null;

/**
 * Defines the complete structure of a Post or similar content document.
 * All optional fields are explicitly unioned with 'null' to allow for missing data.
 */
export interface PostMeta {
  // Required fields (slug and title are essential)
  slug: string; 
  title: string; 
  
  // FIX: Allow null for all optional properties derived from MDX/Frontmatter
  date?: string | null; 
  excerpt?: string | null;
  coverImage?: string | null;
  author?: Author; // Uses the robust Author type
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
  
  // Extra fields used across different content types
  summary?: string | null;
  location?: string | null;
  subtitle?: string | null;
  
  // Cover properties
  coverAspect?: "book" | "wide" | "square" | null; 
  coverFit?: "cover" | "contain" | null;        
  coverPosition?: "left" | "center" | "right" | null; 
}
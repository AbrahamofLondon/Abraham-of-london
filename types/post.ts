// type s/post.ts
export type PostMeta = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string | { name?: string; image?: string };
  readTime?: string;
  category?: string;
  tags?: string[];

  // NEW (all optional)
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "left" | "center" | "right";
};

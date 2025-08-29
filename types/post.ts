export type PostMeta = {
  slug: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: string | { name?: string; image?: string } | null;
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;

  // New framing hints (optional)
  coverAspect?: "book" | "wide" | "square" | null;   // default "book" (3:4)
  coverFit?: "cover" | "contain" | null;             // default depends on aspect
  coverPosition?: "center" | "left" | "right" | null;
};

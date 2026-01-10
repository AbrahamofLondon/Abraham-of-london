// components/Cards/types.ts
export type CoverAspect = "wide" | "square" | "book";
export type CoverFit = "cover" | "contain";
export type CoverPosition = "center" | "top" | "bottom" | "left" | "right";

export type AccessLevel = "public" | "inner-circle" | "premium" | "private";

export interface PostLike {
  slug: string;
  title: string;

  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;

  coverImage?: string | null;

  coverAspect?: CoverAspect | null;
  coverFit?: CoverFit | null;
  coverPosition?: CoverPosition | null;

  date?: string | null;
  tags?: string[] | null;

  featured?: boolean;

  accessLevel?: AccessLevel | string | null;
  lockMessage?: string | null;

  category?: string | null;
  readingTime?: string | null;

  isNew?: boolean;

  href?: string;

  author?: string | null;
  authorPicture?: string | null;

  volumeNumber?: string | null;

  downloadUrl?: string | null;
  fileSize?: string | null;

  price?: string | null;
  dimensions?: string | null;

  type?: string | null;
}

export interface BaseCardProps extends PostLike {
  className?: string;
}

export interface DocumentCardProps {
  document: unknown;
  className?: string;
  href?: string;
}

// Import and re-export types from individual components
export type { BookCardProps } from "./BookCard";
export type { BlogPostCardProps } from "./BlogPostCard";
export type { CanonCardProps } from "./CanonResourceCard";
export type { HeroCardProps } from "./ArticleHero";


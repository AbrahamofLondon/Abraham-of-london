// components/Cards/types.ts
export interface PostLike {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  accessLevel?: string | null;
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
}

export interface BaseCardProps extends PostLike {
  className?: string;
}

export interface DocumentCardProps {
  document: any;
  className?: string;
  href?: string;
}

// Import and re-export types from individual components
export type { BookCardProps } from "./BookCard";
export type { BlogPostCardProps } from "./BlogPostCard";
export type { CanonCardProps } from "./CanonResourceCard";
export type { HeroCardProps } from "./ArticleHero";
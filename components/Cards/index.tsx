// components/Cards/index.tsx

// ✅ type-only re-exports; no runtime imports; no unused-vars warnings
export type {
  PostLike,
  BaseCardProps,
  DocumentCardProps,
  CoverAspect,
  CoverFit,
  CoverPosition,
  AccessLevel,
} from "./types";

// Components
export { default as BaseCard } from "./BaseCard";
export { default as BookCard } from "./BookCard";
export { default as BlogPostCard } from "./BlogPostCard";
export { default as CanonResourceCard } from "./CanonResourceCard";
export { default as ArticleHero } from "./ArticleHero";
export { default as CanonPrimaryCard } from "./CanonPrimaryCard";

// ✅ FIXED: Re-exporting the default export as a named member
export { default as DocumentCard } from "./BaseCard";

// Component prop types
export type { BookCardProps } from "./BookCard";
export type { BlogPostCardProps } from "./BlogPostCard";
export type { CanonCardProps } from "./CanonResourceCard";
export type { HeroCardProps } from "./ArticleHero";

// Utils
export * from "./utils";

// Mapping
export { getCardPropsForDocument } from "./getCardPropsForDocument";
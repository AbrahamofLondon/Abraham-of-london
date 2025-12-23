// components/Cards/index.tsx
import * as React from "react";

// ✅ bring types into local scope (for downstream type re-exports consistency)
import type {
  PostLike,
  BaseCardProps,
  DocumentCardProps,
  CoverAspect,
  CoverFit,
  CoverPosition,
  AccessLevel,
} from "./types";

// ✅ re-export: your single source of truth
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
export { DocumentCard } from "./BaseCard";

// Component prop types
export type { BookCardProps } from "./BookCard";
export type { BlogPostCardProps } from "./BlogPostCard";
export type { CanonCardProps } from "./CanonResourceCard";
export type { HeroCardProps } from "./ArticleHero";

// Utils (keep your existing file)
export * from "./utils";

// ✅ mapping function (new file below)
export { getCardPropsForDocument } from "./getCardPropsForDocument";
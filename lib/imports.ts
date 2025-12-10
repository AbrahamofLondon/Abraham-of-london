// lib/imports.ts - CORRECTED VERSION
// Centralized imports for Abraham of London

// =============================================================================
// SITE CONFIGURATION - VALUES from siteConfig
// =============================================================================

export {
  siteConfig,
  getPageTitle,
  getPageTitleMethod,
  absUrl,
  internalHref,
  getRoutePath,
  siteUrl,
  title,
  description,
  author,
  contact,
  seo,
  brand,
  routes,
  ventures,
  socialLinks,
  brandConfig,
  siteRoutes,
  siteVentures
} from "./siteConfig";

// =============================================================================
// SITE CONFIGURATION - TYPES from siteConfig
// =============================================================================

export type {
  FullSiteConfig,
  Venture,
  RouteConfig,
  RouteId,
  BrandConfig
} from "./siteConfig";

// =============================================================================
// SITE CONFIGURATION - TYPES from @/types/config
// =============================================================================

export type {
  SocialLink,
  ContactInfo,
  SEOConfig,
  SocialPlatform,
  FaviconConfig,
  AnalyticsConfig,
  SiteConfigContext,
  SiteConfigValidation
} from "@/types/config";

export { defaultSocialLinks } from "@/types/config";

// =============================================================================
// CORE UTILITIES
// =============================================================================

export { safeString, cn, getEnv, absoluteUrl } from "./utils";

// =============================================================================
// IMAGE UTILITIES
// =============================================================================

export {
  getSafeImageProps,
  createFallbackSequence,
  getFallbackImage,
  isValidImageUrl,
  normalizeImageUrl,
} from "./image-utils";

export type {
  FallbackConfig,
  ImageMetadata
} from "./image-utils";

// =============================================================================
// CARD SYSTEM - COMPONENTS
// =============================================================================

export {
  BookCard,
  BlogPostCard,
  CanonResourceCard,
  ArticleHero,
  BaseCard,
  DocumentCard,
} from "@/components/Cards";

// =============================================================================
// CARD SYSTEM - UTILITIES (from Cards index)
// =============================================================================

export {
  getCardFallbackConfig,
  getCardImage,
  formatCardDate,
  formatReadTime,
  getAuthorName,
  getAuthorPicture,
  getCardAriaLabel,
  getCardAriaDescription,
  CARD_COLORS,
  CARD_SIZES,
  CARD_ANIMATIONS,
  createCardClassName,
  renderCardTags,
  renderCardDate,
} from "@/components/Cards";

// =============================================================================
// CARD SYSTEM - TYPES
// =============================================================================

export type {
  PostLike,
  BaseCardProps,
  DocumentCardProps,
  BookCardProps,
  CanonCardProps,
  BlogPostCardProps,
  HeroCardProps,
} from "@/components/Cards";

// =============================================================================
// CONTENTLAYER EXPORTS - CORRECTED
// =============================================================================

export {
  getAllContentlayerDocs,
  getPublishedPosts,
  getPublishedShorts,
  getShortBySlug,
  getCardPropsForDocument,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllCanons,
  getAllStrategies,
  isBook,
  isCanon,
  isDownload,
  isEvent,
  isPost,
  isPrint,
  isResource,
  isShort,
  isStrategy,
} from "./contentlayer-helper";

export type {
  AnyDoc,
  ContentlayerCardProps,
} from "./contentlayer-helper";

// =============================================================================
// MDX EXPORTS
// =============================================================================

export type { PostDocument } from "./mdx";
export { getAllContent, getContentBySlug } from "./mdx";

// =============================================================================
// ADDITIONAL UTILITY EXPORTS
// =============================================================================

// Re-export PostMeta from types/post for compatibility
export type { PostMeta } from "@/types/post";

// Re-export common React utilities if needed
export type { FC, ReactNode, ComponentProps } from "react";
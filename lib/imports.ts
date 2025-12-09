// lib/imports.ts - FIXED VERSION (no duplicate exports)
// Centralized imports for Abraham of London

// =============================================================================
// SITE CONFIGURATION - VALUES from siteConfig
// =============================================================================

// Export all site configuration VALUES from siteConfig
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
  socialLinks,           // VALUE: Array of social link objects
  brandConfig,
  siteRoutes,
  siteVentures
} from "./siteConfig";

// =============================================================================
// SITE CONFIGURATION - TYPES from siteConfig
// =============================================================================

// Export types defined IN siteConfig.ts
export type {
  FullSiteConfig,
  Venture,
  RouteConfig,
  RouteId,
  BrandConfig
  // Note: SocialLink type is NOT here - it comes from @/types/config
} from "./siteConfig";

// =============================================================================
// SITE CONFIGURATION - TYPES from @/types/config
// =============================================================================

// Export additional types from your types file
export type {
  // SiteConfig type is already exported from ./siteConfig above
  SocialLink,          // TYPE: SocialLink interface
  ContactInfo,
  SEOConfig,
  SocialPlatform,
  FaviconConfig,
  AnalyticsConfig,
  SiteConfigContext,
  SiteConfigValidation
} from "@/types/config";

// Export default social links (VALUE)
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
// CARD SYSTEM - TYPES - UPDATED (PostLike is now available in Cards)
// =============================================================================

export type {
  PostLike,           // Now exported from Cards/index.tsx
  BaseCardProps,
  DocumentCardProps,
  BookCardProps,
  CanonCardProps,
  BlogPostCardProps,
  HeroCardProps,
} from "@/components/Cards";

// =============================================================================
// CONTENTLAYER/MDX EXPORTS
// =============================================================================

// Export from mdx.ts for content handling
export type { PostDocument } from "./mdx";
export { getAllContent, getContentBySlug } from "./mdx";

// Export from contentlayer-helper
export {
  getAllContentlayerDocs,
  getContentlayerDocBySlug,
  getPublishedDocuments,
  getDocumentBySlug,
  getFeaturedDocuments,
  isContentlayerLoaded,
} from "./contentlayer-helper";

export type {
  ContentlayerDocument,
  PostDocument as ContentlayerPostDocument,
  BookDocument,
  CanonDocument,
} from "./contentlayer-helper";

// =============================================================================
// ADDITIONAL UTILITY EXPORTS
// =============================================================================

// Optional: Export commonly used utilities from other files
// export { formatDate, truncateText, slugify } from "./string-utils";
// export { isServer, isClient, isProduction } from "./env-utils";

// =============================================================================
// RE-EXPORT FOR BACKWARD COMPATIBILITY
// =============================================================================

// Re-export PostMeta from types/post for compatibility
export type { PostMeta } from "@/types/post";

// Re-export common React utilities if needed
export type { FC, ReactNode, ComponentProps } from "react";

// =============================================================================
// REMOVED DUPLICATE EXPORTS - Lines 182-183 were duplicates
// =============================================================================
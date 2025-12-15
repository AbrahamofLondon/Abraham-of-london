// lib/imports.ts - CORRECTED VERSION (No Duplicate Exports)
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
// CARD SYSTEM - COMPONENTS (from Cards index)
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
// CONTENTLAYER EXPORTS - PRIMARY SOURCE
// REMOVED duplicate card utilities (they come from @/components/Cards)
// =============================================================================

export {
  // Collections
  allPosts,
  allShorts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allDocuments,
  allContent,
  allPublished,
  
  // Document accessors
  getAllContentlayerDocs,
  getDocumentBySlug,
  getDocumentsByType,
  getPublishedDocuments,
  getBySlugAndKind,
  getDocByHref,
  
  // Type-specific getters (non-canon)
  getPublishedPosts,
  getPublishedShorts,
  getRecentShorts,
  getShortBySlug,
  getShortUrl,
  
  // Book exports
  getAllBooks,
  
  // Download exports
  getAllDownloads,
  
  // Event exports
  getAllEvents,
  
  // Print exports
  getAllPrints,
  
  // Resource exports
  getAllResources,
  
  // Strategy exports
  getAllStrategies,
  
  // Type-specific filters
  getPublishedDocumentsByType,
  
  // Type guards
  isBook,
  isDownload,
  isEvent,
  isPost,
  isPrint,
  isResource,
  isShort,
  isStrategy,
  
  // Card utilities - REMOVED (now come from @/components/Cards)
  // getCardPropsForDocument,
  // getCardFallbackConfig,
  // getCardImage,
  // formatCardDate,
  
  // Routing utilities
  getDocHref,
  getDocKind,
  normalizeSlug,
  
  // Status check
  isContentlayerLoaded,
  isDraft,
} from "./contentlayer-helper";

// =============================================================================
// CANON-SPECIFIC EXPORTS (from canon.ts for type safety)
// =============================================================================

export {
  getPublicCanon,
  getAllCanons,
  getCanonIndexItems,
  getCanonDocBySlug,
  getFeaturedCanons,
  getCanonBySlug,
  isCanon, // Added from canon.ts
} from "./canon";

// Export Canon type directly from canon.ts
export type { Canon } from "./canon";

// =============================================================================
// TYPES FROM CONTENTLAYER-HELPER
// =============================================================================

export type {
  ContentlayerDocument,
  PostDocument as CLPostDocument,
  ShortDocument,
  BookDocument,
  DownloadDocument,
  EventDocument,
  PrintDocument,
  ResourceDocument,
  StrategyDocument,
  AnyDoc,
  ContentlayerCardProps,
} from "./contentlayer-helper";

// =============================================================================
// MDX EXPORTS
// =============================================================================

export type { PostDocument as MDXPostDocument } from "./mdx";
export { getAllContent, getContentBySlug } from "./mdx";

// =============================================================================
// ADDITIONAL UTILITY EXPORTS
// =============================================================================

// Re-export PostMeta from types/post for compatibility
export type { PostMeta } from "@/types/post";

// Re-export common React utilities if needed
export type { FC, ReactNode, ComponentProps } from "react";

// =============================================================================
// ALIASES FOR BACKWARD COMPATIBILITY
// =============================================================================

// For backward compatibility - main PostDocument type should be from contentlayer-helper
export type { CLPostDocument as PostDocument };

// Export getCardPropsForDocument separately (if it exists in contentlayer-helper)
export { getCardPropsForDocument } from "./contentlayer-helper";

// Helper function to get the correct type based on source
export function getPostDocumentType(source: 'contentlayer' | 'mdx') {
  return source === 'contentlayer' ? 'CLPostDocument' : 'MDXPostDocument';
}
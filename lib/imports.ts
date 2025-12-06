// lib/imports.ts
/**
 * Central import hub for optimized tree-shaking
 * Single source of truth for frequently used imports
 */

// =============================================================================
// SITE CONFIGURATION
// =============================================================================

export { siteConfig, getPageTitle, absUrl, internalHref } from "./siteConfig";

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
  BaseCardProps,
  DocumentCardProps,
  BookCardProps,
  CanonCardProps,
  BlogPostCardProps,
  HeroCardProps,
} from "@/components/Cards";

// =============================================================================
// CONTENTLAYER UTILITIES (from lib/contentlayer.ts)
// =============================================================================

// Note: We're NOT importing all utilities from contentlayer.ts here
// since many are already in the Cards index. If you need specific
// contentlayer utilities, import them directly where needed.

// =============================================================================
// SITE CONFIGURATION - TYPES
// =============================================================================

export type { 
  SocialLink, 
  Venture, 
  RouteConfig,
  RouteId 
} from "./siteConfig";

// =============================================================================
// CONTENTLAYER TYPES (if needed elsewhere)
// =============================================================================

// Optional: Only export these if they're needed by multiple files
// export type {
//   ContentlayerDocument,
//   BookDocument,
//   PostDocument,
//   CanonDocument,
//   DownloadDocument,
//   EventDocument,
//   ResourceDocument,
//   PrintDocument,
//   StrategyDocument,
// } from "./contentlayer";
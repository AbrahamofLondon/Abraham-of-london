// lib/api.ts
// Central content API for the application. All data fetching for static generation
// and server components should route through this file for a clean public interface.

// --- 1. Blog Posts (lib/posts.ts) ---

export {
  getAllPosts,
  getPostBySlug,
  getPostSlugs,
  type PostMeta,
  type PostField, // Exported for type safety in fields selection
} from "./posts";

// --- 2. Strategy Content (lib/strategy.ts) ---

export {
  getAllStrategies,
  getStrategyBySlug,
  getStrategySlugs,
  type StrategyMeta,
  type StrategyField,
} from "./strategy";

// --- 3. Downloads / Static Assets (lib/downloads.ts) ---

export {
  getDownloadsMetadata,
  buildDownloadPills,
  type DownloadItem,
  type ManifestEntry,
  type DownloadPill,
} from "./downloads";

// --- 4. Site Configuration / Utilities (Frequently needed in data layers) ---

export {
    siteConfig,
    absUrl,
    ensureLocal,
    isExternal,
    type SiteConfig,
    type SocialLink,
} from "./siteConfig";

export {
    isExternalUrl,
    safeString,
    compact,
    ensureLeadingSlash,
} from "./stringUtils";

export {
    toInteger,
    toDateString,
    toBoolean,
}
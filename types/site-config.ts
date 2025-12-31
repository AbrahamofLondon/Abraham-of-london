// types/site-config.ts
// Single source of truth for site configuration types.
// Designed to support BOTH new config shape and legacy components.

export type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "facebook"
  | "github"
  | "website"
  | "email"
  | "tiktok"
  | "phone"
  | "whatsapp"
  | "medium";

export interface SocialLink {
  href: string;
  label: string;
  kind?: SocialPlatform;
  external?: boolean;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  ogImage?: string;
  keywords?: string[];
  canonicalUrl?: string;

  // Optional but commonly useful (your siteConfig.ts uses these)
  author?: string;
  twitterHandle?: string;
  siteName?: string;
  type?: string;
  locale?: string;
}

export interface FaviconConfig {
  src: string;
  sizes?: string;
  type?: string;
}

export interface AnalyticsConfig {
  googleAnalyticsId?: string;
  hotjarId?: string;
  facebookPixelId?: string;
}

/**
 * Legacy compatibility layer: some components expect:
 * siteConfig.social.twitter / siteConfig.social.linkedin
 */
export interface LegacySocialConfig {
  twitter: string;
  linkedin: string;
}

/**
 * Optional "brand" object (your lib/siteConfig.ts includes it).
 * We keep it flexible so your config can evolve without breaking types.
 */
export interface BrandConfig {
  name: string;
  tagline?: string;
  logo?: string;
  logoDark?: string;
  logoAlt?: string;
  favicon?: string;
  themeColor?: string;
  accentColor?: string;
  // Allow future keys without type fights
  [key: string]: unknown;
}

/**
 * Routes are very project-specific, so keep it permissive.
 */
export type RouteConfigMap = Record<
  string,
  { path: string; label: string; description?: string }
>;

/**
 * SiteConfig:
 * - Includes NEW shape (title, socialLinks, contact, seo)
 * - Includes LEGACY shape (siteName, social, email at top-level)
 * - Avoids circular dependency landmines.
 */
export interface SiteConfig {
  // Canonical
  siteUrl: string;
  title: string;
  description: string;
  author: string;
  contact: ContactInfo;
  seo: SEOConfig;

  // ✅ Common legacy convenience (PolicyFooter/LegalStrip rely on this)
  // Keep optional to allow strict configs, but strongly recommended.
  email?: string;

  // ✅ Legacy alias used by older components
  siteName?: string;

  // ✅ New social model
  socialLinks?: SocialLink[];

  // ✅ Legacy social model
  social?: LegacySocialConfig;

  // Optional extras frequently used across your repo
  brand?: BrandConfig;
  routes?: RouteConfigMap;
  ventures?: unknown[];

  favicon?: FaviconConfig;
  analytics?: AnalyticsConfig;

  // Add this to support callers like getPageTitle(...)
  getPageTitle?: (pageTitle?: string) => string;

  // Allow controlled expansion without breaking builds
  [key: string]: unknown;
}

/* -------------------------------------------------------------------------- */
/* Defaults                                                                    */
/* -------------------------------------------------------------------------- */

export const defaultSocialLinks: SocialLink[] = [
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X",
    kind: "twitter",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321",
    label: "LinkedIn",
    kind: "linkedin",
    external: true,
  },
  {
    href: "https://medium.com/@seunadaramola",
    label: "Medium",
    kind: "medium",
    external: true,
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    kind: "email",
    external: false,
  },
];

/* -------------------------------------------------------------------------- */
/* Utility Types                                                               */
/* -------------------------------------------------------------------------- */

export type SocialPlatformWithIcons = SocialPlatform | "mail" | "phone";

export interface SiteConfigContext {
  config: SiteConfig;
  isValid: boolean;
  warnings: string[];
}

export interface SiteConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

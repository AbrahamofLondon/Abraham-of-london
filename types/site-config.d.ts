// types/site-config.ts

// Re-export all types from the site config for easy access
export type {
  SocialPlatform,
  SocialLink,
  ContactInfo,
  SEOConfig,
  FaviconConfig,
  AnalyticsConfig,
  SiteConfig,
} from "@/lib/siteConfig";

// Additional utility types
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

// Window augmentation for global config access
declare global {
  interface Window {
    __SITE_CONFIG?: SiteConfig;
    __SITE_CONFIG_VALIDATION?: SiteConfigValidation;
  }
}

export {};

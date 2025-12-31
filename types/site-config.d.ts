// types/site-config.d.ts
// Ambient types for Site Config.
// Keeps consumers happy even when TS can't follow path aliases during tooling,
// and provides global window augmentations.

export {};

declare module "@/types/site-config" {
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

  export interface SiteConfig {
    siteUrl: string;
    title: string;
    description: string;
    author: string;
    contact: ContactInfo;
    seo: SEOConfig;
    favicon?: FaviconConfig;
    analytics?: AnalyticsConfig;
    socialLinks?: SocialLink[];
    getPageTitle?: (pageTitle?: string) => string;
  }

  export const defaultSocialLinks: SocialLink[];

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
}

declare global {
  interface Window {
    __SITE_CONFIG?: import("@/types/site-config").SiteConfig;
    __SITE_CONFIG_VALIDATION?: import("@/types/site-config").SiteConfigValidation;
  }
}

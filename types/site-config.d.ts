// types/site-config.ts

// Define the core types here to avoid circular dependencies
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
}

// Default social links from your siteConfig
export const defaultSocialLinks: SocialLink[] = [
  {
    href: "https://twitter.com/abrahamoflondon",
    label: "Twitter",
    kind: "twitter",
    external: true,
  },
  {
    href: "https://linkedin.com/company/abraham-of-london",
    label: "LinkedIn", 
    kind: "linkedin",
    external: true,
  },
  {
    href: "https://github.com/AbrahamofLondon",
    label: "GitHub",
    kind: "github",
    external: true,
  },
  {
    href: "https://medium.com/@seunadaramola",
    label: "Medium",
    kind: "medium",
    external: true,
  },
  // Add other social platforms you use
  {
    href: "https://instagram.com/abrahamoflondon",
    label: "Instagram",
    kind: "instagram",
    external: true,
  },
  {
    href: "https://youtube.com/@abrahamoflondon",
    label: "YouTube",
    kind: "youtube", 
    external: true,
  },
  {
    href: "https://facebook.com/abrahamoflondon",
    label: "Facebook",
    kind: "facebook",
    external: true,
  }
];

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
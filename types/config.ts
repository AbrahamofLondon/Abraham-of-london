// types/config.ts - COMPLETE CORRECTED VERSION
export type SocialPlatform = 
  | "twitter"
  | "linkedin"
  | "github"
  | "instagram"
  | "youtube"
  | "website"
  | "tiktok"
  | "facebook"
  | "email"
  | "phone"
  | "whatsapp"
  | "medium";

export interface SocialLink {
  href: string;
  label: string;
  external?: boolean;
  kind?: SocialPlatform;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  priority?: number;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  author?: string;
  ogImage?: string;
  keywords?: string[];
  canonicalUrl?: string;
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

export interface SiteConfig {
  title: string;
  description: string;
  email: string;
  socialLinks: SocialLink[];
  copyright?: string;
  companyNumber?: string;
  vatNumber?: string;
  siteUrl: string;
  author: string;
  contact: ContactInfo;
  seo: SEOConfig;
  favicon?: FaviconConfig;
  analytics?: AnalyticsConfig;
  getPageTitle?: (pageTitle?: string) => string;
}

export const defaultSocialLinks: SocialLink[] = [
  {
    href: "https://tiktok.com/@abrahamoflondon",
    label: "TikTok",
    kind: "tiktok",
    external: true,
  },
  {
    href: "https://x.com/AbrahamAda48634",
    label: "X (Twitter)",
    kind: "twitter",
    external: true,
  },
  {
    href: "https://www.instagram.com/abraham_of_london_/",
    label: "Instagram",
    kind: "instagram",
    external: true,
  },
  {
    href: "https://www.facebook.com/share/16tvsnTgRG/",
    label: "Facebook",
    kind: "facebook",
    external: true,
  },
  {
    href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
    label: "LinkedIn",
    kind: "linkedin",
    external: true,
  },
  {
    href: "https://www.youtube.com/@abrahamoflondon",
    label: "YouTube",
    kind: "youtube",
    external: true,
  },
  {
    href: "mailto:info@abrahamoflondon.org",
    label: "Email",
    kind: "email",
    external: true,
  },
  {
    href: "https://wa.me/447496334022",
    label: "WhatsApp",
    kind: "whatsapp",
    external: true,
  },
  {
    href: "tel:+442086225909",
    label: "Landline",
    kind: "phone",
    external: false,
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
];

// Additional utility types
export type SocialPlatformWithIcons = SocialPlatform | "mail";

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

// =============================================================================
// OPTIONAL: Additional types for enhanced functionality
// =============================================================================

// Optional: Add these types if you need them
export interface MetaTag {
  property?: string;
  name?: string;
  content: string;
}

export interface OpenGraph {
  type?: string;
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  locale?: string;
}

export interface TwitterCard {
  card?: "summary" | "summary_large_image" | "player" | "app";
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

// Optional: Structured data types for JSON-LD
export interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

export interface ArticleStructuredData extends StructuredData {
  "@type": "Article";
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  author: {
    "@type": "Person";
    name: string;
  };
  publisher: {
    "@type": "Organization";
    name: string;
    logo: {
      "@type": "ImageObject";
      url: string;
    };
  };
}

// Empty export to ensure this is a module
export {};
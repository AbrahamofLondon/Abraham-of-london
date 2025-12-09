// lib/siteConfig.ts - CORRECTED VERSION
import { SiteConfig, SEOConfig, ContactInfo, SocialLink } from "@/types/config";

// =============================================================================
// PUBLIC ENVIRONMENT VARIABLES
// =============================================================================

export const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org";

// =============================================================================
// BRAND CONFIGURATION
// =============================================================================

export const brand = {
  name: "Abraham of London",
  tagline: "Faith · Strategy · Fatherhood",
  logo: "/images/logo.svg",
  logoDark: "/images/logo-dark.svg",
  logoAlt: "Abraham of London Logo",
  favicon: "/favicon.ico",
  themeColor: "#1a1a1a",
  accentColor: "#D4AF37",
} as const;

// =============================================================================
// ROUTE CONFIGURATION
// =============================================================================

export type RouteId =
  | "home"
  | "about"
  | "blogIndex"
  | "contentIndex"
  | "booksIndex"
  | "canonIndex"
  | "ventures"
  | "downloadsIndex"
  | "strategyLanding"
  | "contact";

export interface RouteConfig {
  path: string;
  label: string;
  description?: string;
}

export const routes: Record<RouteId, RouteConfig> = {
  home: {
    path: "/",
    label: "Home",
    description: "Welcome to Abraham of London",
  },
  about: {
    path: "/about",
    label: "About",
    description: "Learn about Abraham's journey and philosophy",
  },
  blogIndex: {
    path: "/blog",
    label: "Insights",
    description: "Strategic wisdom and insights",
  },
  contentIndex: {
    path: "/content",
    label: "Content",
    description: "Articles, resources, and frameworks",
  },
  booksIndex: {
    path: "/books",
    label: "Books",
    description: "Curated volumes and publications",
  },
  canonIndex: {
    path: "/canon",
    label: "The Canon",
    description: "The 10-volume system of strategic wisdom",
  },
  ventures: {
    path: "/ventures",
    label: "Ventures",
    description: "Business pursuits and initiatives",
  },
  downloadsIndex: {
    path: "/downloads",
    label: "Downloads",
    description: "Resources and tools for download",
  },
  strategyLanding: {
    path: "/strategy",
    label: "Strategy",
    description: "Strategic frameworks and consulting",
  },
  contact: {
    path: "/contact",
    label: "Contact",
    description: "Get in touch with Abraham",
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getRoutePath = (route: RouteId): string => {
  return routes[route]?.path || "/";
};

export const absUrl = (path: string): string => {
  return `${PUBLIC_SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export const internalHref = (route: RouteId): string => {
  return getRoutePath(route);
};

// =============================================================================
// CONTACT INFORMATION
// =============================================================================

export const contact: ContactInfo = {
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
  address: "London, United Kingdom",
};

// =============================================================================
// SEO CONFIGURATION - UPDATED
// =============================================================================

export const seo: SEOConfig = {
  title: "Abraham of London",
  description: "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.",
  author: "Abraham of London", // Now allowed with updated SEOConfig type
  ogImage: "/images/og-default.jpg",
  keywords: ["strategy", "leadership", "fatherhood", "legacy", "faith", "business"],
  canonicalUrl: PUBLIC_SITE_URL,
  twitterHandle: "@AbrahamofLondon",
  siteName: "Abraham of London",
  type: "website",
  locale: "en_GB",
};

// =============================================================================
// SOCIAL LINKS
// =============================================================================

export const socialLinks: SocialLink[] = [
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
    external: false,
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

// =============================================================================
// VENTURES
// =============================================================================

export interface Venture {
  id: string;
  name: string;
  description: string;
  url: string;
  status: "active" | "upcoming" | "archived";
  category: string;
}

export const ventures: Venture[] = [
  {
    id: "chatham-rooms",
    name: "Chatham Rooms",
    description: "Strategic advisory and board-level counsel",
    url: "/ventures/chatham-rooms",
    status: "active",
    category: "consulting",
  },
  {
    id: "canon-prelude",
    name: "Canon Prelude",
    description: "The Architecture of Human Purpose",
    url: "/books/the-architecture-of-human-purpose-landing",
    status: "active",
    category: "publication",
  },
  {
    id: "fatherhood-frameworks",
    name: "Fatherhood Frameworks",
    description: "Resources for intentional fatherhood",
    url: "/content/fatherhood-frameworks",
    status: "active",
    category: "education",
  },
];

// =============================================================================
// PAGE TITLE HELPER
// =============================================================================

export const getPageTitle = (pageTitle?: string): string => {
  const baseTitle = "Abraham of London";
  return pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle;
};

// Alias for backward compatibility
export const getPageTitleMethod = getPageTitle;

// =============================================================================
// MAIN SITE CONFIGURATION
// =============================================================================

export interface BrandConfig {
  name: string;
  tagline: string;
  logo: string;
  logoDark: string;
  logoAlt: string;
  favicon: string;
  themeColor: string;
  accentColor: string;
}

export interface FullSiteConfig extends SiteConfig {
  brand: BrandConfig;
  routes: Record<RouteId, RouteConfig>;
  ventures: Venture[];
}

export const siteConfig: FullSiteConfig = {
  // Core
  title: brand.name,
  description: seo.description,
  siteUrl: PUBLIC_SITE_URL,
  author: "Abraham of London",
  
  // Contact
  email: contact.email,
  contact,
  
  // Social
  socialLinks,
  
  // SEO
  seo,
  
  // Brand
  brand,
  
  // Navigation
  routes,
  
  // Ventures
  ventures,
  
  // Optional fields
  copyright: `© ${new Date().getFullYear()} Abraham of London. All rights reserved.`,
  getPageTitle,
  
  // Analytics (optional - can be added later)
  analytics: {
    // googleAnalyticsId: "G-XXXXXXXXXX",
    // hotjarId: "XXXXXXXX",
  },
};

// =============================================================================
// ALIAS EXPORTS FOR CONVENIENCE
// =============================================================================

export const title = siteConfig.title;
export const description = siteConfig.description;
export const author = siteConfig.author;
export const siteUrl = siteConfig.siteUrl;
export const brandConfig = siteConfig.brand;
export const siteRoutes = siteConfig.routes;
export const siteVentures = siteConfig.ventures;
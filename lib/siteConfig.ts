// lib/siteConfig.ts - COMPLETE FIXED VERSION
import type { ContactInfo, SEOConfig, SiteConfig, SocialLink } from "@/types/config";

/**
 * Canonical public site URL.
 * Keep without trailing slash for consistent canonical/og URLs.
 */
export const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org").replace(
  /\/+$/,
  "",
);

/* -------------------------------------------------------------------------- */
/* Brand                                                                       */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Routes                                                                      */
/* -------------------------------------------------------------------------- */

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
  home: { path: "/", label: "Home" },
  about: { path: "/about", label: "About" },
  blogIndex: { path: "/blog", label: "Insights" },
  contentIndex: { path: "/content", label: "The Kingdom Vault" },
  booksIndex: { path: "/books", label: "Books" },
  canonIndex: { path: "/canon", label: "The Canon" },
  ventures: { path: "/ventures", label: "Ventures" },
  downloadsIndex: { path: "/downloads", label: "Downloads" },
  strategyLanding: { path: "/strategy", label: "Strategy" },
  contact: { path: "/contact", label: "Contact" },
} as const;

/* -------------------------------------------------------------------------- */
/* Contact                                                                     */
/* -------------------------------------------------------------------------- */

export const contact: ContactInfo = {
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
  address: "London, United Kingdom",
};

/* -------------------------------------------------------------------------- */
/* SEO                                                                         */
/* -------------------------------------------------------------------------- */

export const seo: SEOConfig = {
  title: brand.name,
  description: "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders.",
  author: brand.name,
  ogImage: "/images/og-default.jpg",
  keywords: ["strategy", "leadership", "fatherhood", "legacy", "faith"],
  canonicalUrl: PUBLIC_SITE_URL,
  twitterHandle: "@AbrahamofLondon",
  siteName: brand.name,
  type: "website",
  locale: "en_GB",
};

/* -------------------------------------------------------------------------- */
/* Social                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Verified Social Links - All Live
 * Keep 'external' accurate. mailto is not "external" in the browser sense.
 */
export const socialLinks: SocialLink[] = [
  { href: "https://x.com/AbrahamAda48634", label: "X", kind: "twitter", external: true },
  { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok", external: true },
  { href: "https://www.facebook.com/share/1Gvu4ZunTq/", label: "Facebook", kind: "facebook", external: true },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram", external: true },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321", label: "LinkedIn", kind: "linkedin", external: true },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube", external: true },
  { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp", external: true },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "email", external: false },
];

/**
 * Compatibility layer for legacy components expecting:
 * social: { twitter: string; linkedin: string; }
 */
export const social = {
  twitter: socialLinks.find((s) => s.kind === "twitter")?.href ?? "https://x.com/AbrahamAda48634",
  linkedin:
    socialLinks.find((s) => s.kind === "linkedin")?.href ?? "https://www.linkedin.com/in/abraham-adaramola-06630321",
} as const;

/* -------------------------------------------------------------------------- */
/* Ventures                                                                    */
/* -------------------------------------------------------------------------- */

export type VentureStatus = "active" | "planned" | "paused" | "archived";
export type VentureCategory = "consulting" | "publication" | "technology" | "community" | "education" | "other";

export interface Venture {
  id: string;
  name: string;
  description: string;
  url: string;
  status: VentureStatus;
  category: VentureCategory;
}

export const ventures: Venture[] = [
  {
    id: "chatham-rooms",
    name: "Chatham Rooms",
    description: "Strategic advisory and board-level counsel",
    url: "/strategy/chatham-rooms",
    status: "active",
    category: "consulting",
  },
  {
    id: "canon-prelude",
    name: "Canon Prelude",
    description: "The Architecture of Human Purpose",
    url: "/canon/the-architecture-of-human-purpose",
    status: "active",
    category: "publication",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export const getPageTitle = (pageTitle?: string): string =>
  pageTitle ? `${pageTitle} | ${brand.name}` : brand.name;

/**
 * Generate absolute URL from a relative path
 */
export const absUrl = (path: string): string => {
  if (!path) return PUBLIC_SITE_URL;
  
  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Join base URL with path
  return `${PUBLIC_SITE_URL}/${normalizedPath}`;
};

/**
 * Check if URL is external (not same domain)
 */
export const isExternalUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const siteUrlObj = new URL(PUBLIC_SITE_URL);
    return urlObj.hostname !== siteUrlObj.hostname;
  } catch {
    // If URL parsing fails, assume it's relative (internal)
    return false;
  }
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format UK numbers
  if (digits.startsWith('44')) {
    const ukNumber = digits.slice(2);
    if (ukNumber.length === 10) {
      return `+44 (0)${ukNumber.slice(0, 4)} ${ukNumber.slice(4)}`;
    }
  }
  
  // Default formatting
  return phone;
};

/* -------------------------------------------------------------------------- */
/* Central config                                                              */
/* -------------------------------------------------------------------------- */

/**
 * IMPORTANT:
 * - `SiteConfig` in types/site-config.ts defines `contact.email` (canonical)
 * - Some legacy components read `siteConfig.email` directly → keep it.
 * - Some legacy components read `siteConfig.siteName` and `siteConfig.social` → keep them.
 */
export const siteConfig = {
  title: brand.name,
  siteName: brand.name, // legacy
  description: seo.description,
  siteUrl: PUBLIC_SITE_URL,
  author: brand.name,

  email: contact.email, // legacy convenience
  contact,

  socialLinks,
  social,

  seo,
  brand,
  routes,
  ventures,

  copyright: `© ${new Date().getFullYear()} Abraham of London.`,
  getPageTitle,
  absUrl, // Add absUrl to siteConfig
  isExternalUrl, // Add helper function
  formatPhoneNumber, // Add helper function
} satisfies SiteConfig & {
  siteName: string;
  email: string;
  social: typeof social;
  brand: typeof brand;
  routes: typeof routes;
  ventures: Venture[];
  socialLinks: SocialLink[];
  copyright: string;
  getPageTitle: (pageTitle?: string) => string;
  absUrl: (path: string) => string;
  isExternalUrl: (url: string) => boolean;
  formatPhoneNumber: (phone: string) => string;
};

/* -------------------------------------------------------------------------- */
/* Named exports (convenience)                                                 */
/* -------------------------------------------------------------------------- */

export const title = siteConfig.title; // new
export const siteName = siteConfig.siteName; // legacy
export const description = siteConfig.description;
export const author = siteConfig.author;
export const siteUrl = siteConfig.siteUrl;

export const brandConfig = siteConfig.brand;
export const siteRoutes = siteConfig.routes;
export const siteVentures = siteConfig.ventures;

export const socialConfig = siteConfig.social; // legacy convenience
export const socialLinksConfig = siteConfig.socialLinks; // new convenience



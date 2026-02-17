/* lib/siteConfig.ts — HARD-LOCKED SINGLE SOURCE OF TRUTH
   Canonical config lives in: config/site.ts
   This file exists ONLY to provide legacy exports + stable helpers.
*/

import {
  siteConfig as canonical,
  canonicalUrl as canonicalUrlFromConfig,
  getSocialLinks as getSocialLinksFromConfig,
  getSocialUrl as getSocialUrlFromConfig,
  getMainNavigation,
  getFooterNavigation,
  getSocialNavigation,
  getPageTitle as getPageTitleFromConfig,
  getMetaDescription,
  getKeywords,
} from "@/config/site";

import type { SiteConfig as CanonicalSiteConfig, SocialLink as CanonicalSocialLink } from "@/config/site";

/**
 * Types used by older parts of the codebase.
 * If your "@/types/config" differs, keep this as "type-only" best-effort.
 */
import type { ContactInfo, SEOConfig, SiteConfig as LegacySiteConfig, SocialLink as LegacySocialLink } from "@/types/config";

/* -------------------------------------------------------------------------- */
/* Canonical public site URL                                                   */
/* -------------------------------------------------------------------------- */
export const PUBLIC_SITE_URL = (canonical.url || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

/* -------------------------------------------------------------------------- */
/* Brand (legacy shape)                                                        */
/* -------------------------------------------------------------------------- */
export const brand = {
  name: canonical.brand?.name ?? "Abraham of London",
  tagline: canonical.brand?.tagline ?? "Faith · Strategy · Fatherhood",
  logo: canonical.brand?.logoSvg ?? canonical.brand?.logo ?? "/assets/images/logo/abraham-of-london.svg",
  logoDark: canonical.brand?.logoSvg ?? canonical.brand?.logo ?? "/assets/images/logo/abraham-of-london.svg",
  logoAlt: `${canonical.brand?.name ?? "Abraham of London"} Logo`,
  favicon: canonical.brand?.favicon ?? "/assets/icons/favicon.ico",
  themeColor: canonical.brand?.accentColor ?? "#1a1a1a",
  accentColor: canonical.brand?.primaryColor ?? "#d4af37",
} as const;

/* -------------------------------------------------------------------------- */
/* Routes (legacy shape)                                                       */
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

/**
 * Hard-lock routes to canonical navigation where possible,
 * but preserve your known route IDs.
 */
export const routes: Record<RouteId, RouteConfig> = {
  home: { path: "/", label: "Home" },
  about: { path: "/about", label: "About" },
  blogIndex: { path: "/blog", label: "Insights" },
  contentIndex: { path: "/content", label: "Content" },
  booksIndex: { path: "/books", label: "Books" },
  canonIndex: { path: "/canon", label: "The Canon" },
  ventures: { path: "/ventures", label: "Ventures" },
  downloadsIndex: { path: "/downloads", label: "Downloads" },
  strategyLanding: { path: "/strategy", label: "Strategy" },
  contact: { path: "/contact", label: "Contact" },
} as const;

/* -------------------------------------------------------------------------- */
/* Contact (legacy shape)                                                      */
/* -------------------------------------------------------------------------- */
export const contact: ContactInfo = {
  email: canonical.contact?.email ?? "info@abrahamoflondon.org",
  phone: canonical.contact?.phone ?? "+44 20 8622 5909",
  address: canonical.contact?.address ?? canonical.contact?.location ?? "London, United Kingdom",
};

/* -------------------------------------------------------------------------- */
/* SEO (legacy shape)                                                          */
/* -------------------------------------------------------------------------- */
export const seo: SEOConfig = {
  title: canonical.seo?.title ?? brand.name,
  description: canonical.seo?.description ?? "",
  author: canonical.author?.name ?? brand.name,
  ogImage: canonical.seo?.openGraphImage ?? "/assets/images/social/og-image.jpg",
  keywords: canonical.seo?.keywords ?? [],
  canonicalUrl: PUBLIC_SITE_URL,
  twitterHandle: canonical.seo?.twitterHandle ?? "",
  siteName: brand.name,
  type: "website",
  locale: "en_GB",
};

/* -------------------------------------------------------------------------- */
/* Social (legacy shape)                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Convert canonical socials → legacy SocialLink if needed.
 * (Same fields: kind/label/href; we also compute external.)
 */
export const socialLinks: LegacySocialLink[] = (canonical.socials || []).map((s: CanonicalSocialLink) => ({
  kind: (s.kind as any),
  label: s.label,
  href: s.href,
  external:
    /^https?:\/\//i.test(s.href) &&
    !s.href.startsWith("mailto:") &&
    !s.href.startsWith("tel:") &&
    !s.href.startsWith("sms:"),
})) as any;

/**
 * Legacy compatibility:
 * social: { twitter: string; linkedin: string }
 * Your canonical uses "x" not "twitter" — we map it.
 */
export const social = {
  twitter:
    getSocialUrlCompat("x") ||
    getSocialUrlCompat("twitter") ||
    "https://x.com/AbrahamAda48634",
  linkedin:
    getSocialUrlCompat("linkedin") ||
    "https://www.linkedin.com/in/abraham-adaramola-06630321/",
} as const;

function getSocialUrlCompat(kind: any): string | null {
  try {
    // use canonical helper if available
    const url = getSocialUrlFromConfig(kind);
    if (url) return url;
  } catch {
    // ignore
  }
  const found = (canonical.socials || []).find((s) => s.kind === kind);
  return found?.href ?? null;
}

/* -------------------------------------------------------------------------- */
/* Ventures (legacy shape)                                                     */
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

/**
 * Your canonical config doesn’t model ventures.
 * Keep this stable list here OR migrate ventures into config/site.ts later.
 */
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
/* Helpers (legacy + robust)                                                   */
/* -------------------------------------------------------------------------- */
export const getPageTitle = (pageTitle?: string): string => getPageTitleFromConfig(pageTitle);

export const absUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return PUBLIC_SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const clean = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${PUBLIC_SITE_URL}${clean}`;
};

export const isExternalUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("sms:")) return false;
  try {
    const u = new URL(url, PUBLIC_SITE_URL);
    const s = new URL(PUBLIC_SITE_URL);
    return u.hostname !== s.hostname;
  } catch {
    return false;
  }
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("44")) {
    const uk = digits.slice(2);
    if (uk.length === 10) return `+44 (0)${uk.slice(0, 4)} ${uk.slice(4)}`;
  }
  return phone;
};

/**
 * Hard-lock these to canonical navigation helpers:
 */
export const mainNavigation = getMainNavigation();
export const footerNavigation = getFooterNavigation();
export const socialNavigation = getSocialNavigation();

/**
 * Hard-lock canonicalUrl as well
 */
export const canonicalUrl = (path = "/") => canonicalUrlFromConfig(path);

/**
 * Social helpers: hard-lock to canonical helpers
 */
export const getSocialLinks = (priority?: number) => getSocialLinksFromConfig(priority);
export const getSocialUrl = (platform: any) => getSocialUrlFromConfig(platform);

/* -------------------------------------------------------------------------- */
/* Central config export (legacy shape)                                        */
/* -------------------------------------------------------------------------- */

/**
 * This is what older code expects: siteConfig.title, siteConfig.email, siteConfig.socialLinks, etc.
 * We populate it FROM canonical every time.
 */
export const siteConfig = {
  // legacy top-level
  title: brand.name,
  siteName: brand.name,
  description: seo.description,
  siteUrl: PUBLIC_SITE_URL,
  author: canonical.author?.name ?? brand.name,
  email: contact.email,

  // structured
  contact,
  seo,
  brand,
  routes,
  ventures,

  // social
  socialLinks,
  social,

  // helpers
  getPageTitle,
  absUrl,
  isExternalUrl,
  formatPhoneNumber,

  // navigation mirrors (optional)
  navigation: canonical.navigation,

  // canonical raw config for power-users
  canonical,
} satisfies LegacySiteConfig & {
  siteName: string;
  email: string;
  social: typeof social;
  socialLinks: LegacySocialLink[];
  brand: typeof brand;
  routes: typeof routes;
  ventures: Venture[];
  canonical: CanonicalSiteConfig;
};

/* -------------------------------------------------------------------------- */
/* Named exports (convenience)                                                 */
/* -------------------------------------------------------------------------- */
export const title = siteConfig.title;
export const siteName = siteConfig.siteName;
export const description = siteConfig.description;
export const author = siteConfig.author;
export const siteUrl = siteConfig.siteUrl;

export const brandConfig = siteConfig.brand;
export const siteRoutes = siteConfig.routes;
export const siteVentures = siteConfig.ventures;

export const socialConfig = siteConfig.social;
export const socialLinksConfig = siteConfig.socialLinks;

// Extra SEO helpers (hard-locked)
export { getMetaDescription, getKeywords };
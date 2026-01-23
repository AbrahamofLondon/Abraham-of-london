// config/site.ts - COMPREHENSIVE SITE CONFIGURATION
export type SocialPlatform =
  | "x"
  | "twitter"
  | "linkedin"
  | "instagram"
  | "youtube"
  | "facebook"
  | "github"
  | "website"
  | "email"
  | "phone"
  | "tiktok"
  | "whatsapp";

export interface SocialLink {
  kind: SocialPlatform;
  label: string;
  href: string;
  handle?: string;
  priority?: number;
}

export interface SiteBrand {
  name: string;
  tagline?: string;
  mission?: string;
  logo?: string;
  logoSvg?: string;
  favicon?: string;
  primaryColor?: string;
  accentColor?: string;
}

export interface SiteAuthor {
  name: string;
  title?: string;
  image?: string;
  email?: string;
  bio?: string;
}

export interface SiteContact {
  email?: string;
  phone?: string;
  address?: string;
  businessHours?: string;
  location?: string;
}

export interface SeoDefaults {
  title: string;
  description: string;
  keywords?: string[];
  openGraphImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterHandle?: string;
}

export interface SiteNavigation {
  main: Array<{ name: string; href: string; description?: string }>;
  footer: Array<{ name: string; href: string }>;
  social: SocialLink[];
}

export interface SiteConfig {
  url: string;
  brand: SiteBrand;
  author: SiteAuthor;
  contact: SiteContact;
  socials: SocialLink[];
  seo: SeoDefaults;
  navigation?: SiteNavigation;
  features?: {
    recaptcha?: boolean;
    darkMode?: boolean;
    newsletter?: boolean;
    innerCircle?: boolean;
    downloads?: boolean;
  };
}

// Constants
const ORIGIN =
  (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") ||
  "https://www.abrahamoflondon.org";

// Main site configuration
export const siteConfig: SiteConfig = {
  url: ORIGIN,
  brand: {
    name: "Abraham of London",
    tagline: "Faith · Strategy · Fatherhood",
    mission: "To restore faith-rooted leadership and strategy in a world that has outsourced responsibility.",
    logo: "/assets/images/abraham-logo.jpg",
    logoSvg: "/assets/images/logo/abraham-of-london.svg",
    favicon: "/assets/icons/favicon.ico",
    primaryColor: "#d4af37", // Gold
    accentColor: "#1a1a1a", // Charcoal
  },
  author: {
    name: "Abraham Adaramola",
    title: "Strategy & Leadership",
    image: "/assets/images/profile-portrait.webp",
    email: "info@abrahamoflondon.org",
    bio: "Faith-rooted strategist, founder, and author focused on legacy, responsibility, and restoring moral clarity in leadership.",
  },
  contact: {
    email: "info@abrahamoflondon.org",
    phone: "+44 20 8622 5909",
    address: "Based in London, working globally",
    businessHours: "Mon-Fri 9:00-17:00 GMT",
    location: "London, United Kingdom",
  },
  socials: [
    {
      kind: "x",
      label: "X (Twitter)",
      href: "https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09",
      handle: "@AbrahamAda48634",
      priority: 1,
    },
    {
      kind: "linkedin",
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
      priority: 2,
    },
    {
      kind: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/abraham_of_london",
      priority: 3,
    },
    {
      kind: "youtube",
      label: "YouTube",
      href: "https://youtube.com/@abrahamoflondon",
      priority: 4,
    },
    {
      kind: "facebook",
      label: "Facebook",
      href: "https://www.facebook.com/share/1Gvu4ZunTq/",
      priority: 5,
    },
    {
      kind: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@abrahamoflondon",
      priority: 6,
    },
    {
      kind: "website",
      label: "Website",
      href: "https://www.abrahamoflondon.org",
      priority: 99,
    },
    {
      kind: "email",
      label: "Email",
      href: "mailto:info@abrahamoflondon.org",
      priority: 100,
    },
    {
      kind: "phone",
      label: "Phone",
      href: "tel:+442086225909",
      priority: 101,
    },
  ],
  seo: {
    title: "Abraham of London",
    description: "Leadership and legacy—strategy, discipline, and timeless principles applied to fatherhood, business, and faith.",
    keywords: [
      "leadership",
      "strategy",
      "legacy",
      "fatherhood",
      "business",
      "faith",
      "Abraham of London",
      "founder",
      "responsibility",
      "discipline",
    ],
    openGraphImage: "/assets/images/social/og-image.jpg",
    twitterCard: "summary_large_image",
    twitterHandle: "@AbrahamAda48634",
  },
  navigation: {
    main: [
      { name: "Home", href: "/", description: "Start here" },
      { name: "Essays", href: "/blog", description: "Long-form thinking" },
      { name: "The Canon", href: "/canon", description: "Core principles" },
      { name: "Books", href: "/books", description: "Published works" },
      { name: "Downloads", href: "/downloads", description: "Resources" },
      { name: "Contact", href: "/contact", description: "Get in touch" },
    ],
    footer: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Accessibility", href: "/accessibility" },
      { name: "Security", href: "/security" },
      { name: "Cookies", href: "/cookies" },
    ],
    social: [
      { kind: "x", label: "Twitter", href: "https://x.com/AbrahamAda48634" },
      { kind: "linkedin", label: "LinkedIn", href: "https://linkedin.com/in/abraham-adaramola" },
      { kind: "instagram", label: "Instagram", href: "https://instagram.com/abraham_of_london" },
    ],
  },
  features: {
    recaptcha: Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
    darkMode: true,
    newsletter: false,
    innerCircle: true,
    downloads: true,
  },
};

// Convenience getters
export const canonicalUrl = (path = "/") =>
  `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;

export const authorImage = siteConfig.author.image || "/assets/images/profile-portrait.webp";

export const brandName = siteConfig.brand.name;
export const brandTagline = siteConfig.brand.tagline || "";
export const siteDescription = siteConfig.seo.description;

// Social media helpers
export function getSocialUrl(platform: SocialPlatform): string | null {
  const social = siteConfig.socials.find(s => s.kind === platform);
  return social?.href || null;
}

export function getSocialLinks(priority?: number): SocialLink[] {
  if (priority) {
    return siteConfig.socials.filter(s => s.priority && s.priority <= priority);
  }
  return [...siteConfig.socials].sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

// Navigation helpers
export function getMainNavigation() {
  return siteConfig.navigation?.main || [];
}

export function getFooterNavigation() {
  return siteConfig.navigation?.footer || [];
}

export function getSocialNavigation() {
  return siteConfig.navigation?.social || [];
}

// SEO helpers
export function getPageTitle(title?: string): string {
  if (!title) return siteConfig.seo.title;
  if (title.includes(siteConfig.brand.name)) return title;
  return `${title} | ${siteConfig.brand.name}`;
}

export function getMetaDescription(customDescription?: string): string {
  return customDescription || siteConfig.seo.description;
}

export function getKeywords(customKeywords?: string[]): string {
  const defaultKeywords = siteConfig.seo.keywords || [];
  const allKeywords = [...defaultKeywords, ...(customKeywords || [])];
  return Array.from(new Set(allKeywords)).join(', ');
}
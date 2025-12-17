import { SiteConfig, SEOConfig, ContactInfo, SocialLink } from "@/types/config";

export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org";

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

export type RouteId =
  | "home" | "about" | "blogIndex" | "contentIndex" | "booksIndex" 
  | "canonIndex" | "ventures" | "downloadsIndex" | "strategyLanding" | "contact";

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

export const contact: ContactInfo = {
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
  address: "London, United Kingdom",
};

export const seo: SEOConfig = {
  title: "Abraham of London",
  description: "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders.",
  author: "Abraham of London",
  ogImage: "/images/og-default.jpg",
  keywords: ["strategy", "leadership", "fatherhood", "legacy", "faith"],
  canonicalUrl: PUBLIC_SITE_URL,
  twitterHandle: "@AbrahamofLondon",
  siteName: "Abraham of London",
  type: "website",
  locale: "en_GB",
};

/* Verified Social Links - All Live */
export const socialLinks: SocialLink[] = [
  { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok", external: true },
  { href: "https://x.com/AbrahamAda48634", label: "X", kind: "twitter", external: true },
  { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram", external: true },
  { href: "https://www.facebook.com/profile.php?id=61566373432457", label: "Facebook", kind: "facebook", external: true },
  { href: "https://www.linkedin.com/in/abraham-adaramola-06630321", label: "LinkedIn", kind: "linkedin", external: true },
  { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube", external: true },
  { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp", external: true },
  { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "email", external: false },
];

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

export const getPageTitle = (pageTitle?: string): string => 
  pageTitle ? `${pageTitle} | ${brand.name}` : brand.name;

export const siteConfig = {
  title: brand.name,
  description: seo.description,
  siteUrl: PUBLIC_SITE_URL,
  author: "Abraham of London",
  email: contact.email,
  contact,
  socialLinks,
  seo,
  brand,
  routes,
  ventures,
  copyright: `© ${new Date().getFullYear()} Abraham of London.`,
  getPageTitle,
};

export const title = siteConfig.title;
export const description = siteConfig.description;
export const author = siteConfig.author;
export const siteUrl = siteConfig.siteUrl;
export const brandConfig = siteConfig.brand;
export const siteRoutes = siteConfig.routes;
export const siteVentures = siteConfig.ventures;
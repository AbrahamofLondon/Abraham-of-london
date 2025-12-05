// lib/siteConfig.ts
// Browser-safe site configuration + route & venture registry.
// No fs, no Node-only APIs.

// =======================================================
// TYPE DEFINITIONS
// =======================================================

export interface SocialLink {
  href: string;
  label: string;
  kind?: string;
  external?: boolean;
}

export interface BaseSiteConfig {
  siteUrl: string;
  title: string;
  description: string;
  author: string;
  email: string;
  phone: string;
  copyright?: string;
  companyNumber?: string;
  socialLinks?: SocialLink[];
  contact?: {
    email: string;
    phone?: string;
  };
  seo?: {
    title: string;
    description: string;
  };
  authorImage?: string;
}

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
  id: RouteId;
  path: string;
  label?: string;
}

export interface BrandConfig {
  name: string;
  tagline: string;
  mission: string;
  values: string[];
  principles?: string[];
}

export interface Venture {
  initials: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  muted?: boolean;
  themeColor?: string;
}

export interface FullSiteConfig extends BaseSiteConfig {
  brand: BrandConfig;
  routes: Record<RouteId, RouteConfig>;
  ventures: Venture[];
  getPageTitle: (pageTitle?: string) => string;
}

// =======================================================
// UTILITY FUNCTIONS
// =======================================================

function normalisePath(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "/";
  const withLead = s.startsWith("/") ? s : `/${s}`;
  if (withLead === "/") return "/";
  return withLead.replace(/\/+$/u, "");
}

export function getRoutePath(id: RouteId): string {
  const cfg = siteConfig.routes[id];
  if (!cfg) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[siteConfig] Unknown route id: ${id}`);
    }
    return "/";
  }
  return normalisePath(cfg.path);
}

export function internalHref(target: RouteId | string): string {
  if (typeof target === "string" && target in siteConfig.routes) {
    return getRoutePath(target as RouteId);
  }

  if (typeof target === "string") {
    if (
      target.startsWith("/") ||
      target.startsWith("#") ||
      target.startsWith("mailto:") ||
      target.startsWith("tel:")
    ) {
      return target;
    }
    return normalisePath(`/${target}`);
  }

  return getRoutePath(target);
}

export function absUrl(path: string | RouteId): string {
  const href =
    typeof path === "string" ? internalHref(path) : getRoutePath(path);
  if (/^https?:\/\//iu.test(href)) return href;
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return href;
  }
  return `${siteConfig.siteUrl}${href === "/" ? "" : href}`;
}

export function isActiveRoute(
  currentPath: string,
  target: RouteId | string
): boolean {
  const targetPath = internalHref(target);
  const normalizedCurrent = normalisePath(currentPath);
  if (targetPath === "/") return normalizedCurrent === "/";
  return normalizedCurrent.startsWith(targetPath);
}

export function getPageTitle(pageTitle?: string): string {
  const base = siteConfig.title || "Abraham of London";
  if (!pageTitle || typeof pageTitle !== "string") return base;
  return `${pageTitle} | ${base}`;
}

// =======================================================
// CONSTANTS
// =======================================================

const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org"
).replace(/\/+$/u, "");

const ALOMARADA_URL =
  process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";

const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";

const INNOVATEHUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub.abrahamoflondon.org";

const defaultSocialLinks: SocialLink[] = [
  {
    href: "https://www.linkedin.com/in/seunadaramola",
    label: "LinkedIn",
    kind: "linkedin",
    external: true,
  },
  {
    href: "https://x.com/abrahamoflondon",
    label: "X (Twitter)",
    kind: "twitter",
    external: true,
  },
  {
    href: "https://medium.com/@seunadaramola",
    label: "Medium",
    kind: "medium",
    external: true,
  },
  {
    href: "https://github.com/AbrahamofLondon",
    label: "GitHub",
    kind: "github",
    external: true,
  },
];

// =======================================================
// FINAL SITE CONFIG (DROP-IN)
// =======================================================

export const siteConfig: FullSiteConfig = {
  siteUrl: PUBLIC_SITE_URL,
  title: "Abraham of London",
  description:
    "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.",
  author: "Abraham of London",
  email: "info@abrahamoflondon.org",
  phone: "+44 20 8622 5909",
  companyNumber: "11549053",
  copyright: `© ${new Date().getFullYear()} Abraham of London. All rights reserved.`,
  authorImage: "/assets/images/profile-portrait.webp",

  contact: {
    email: "info@abrahamoflondon.org",
    phone: "+44 20 8622 5909",
  },

  seo: {
    title: "Abraham of London",
    description:
      "Faith-rooted strategy and leadership for fathers, founders, and board-level leaders who refuse to outsource responsibility.",
  },

  socialLinks: defaultSocialLinks,

  brand: {
    name: "Abraham of London",
    tagline: "Building Fathers, Founders & Faithful Leaders",
    mission:
      "Equipping serious men with faith-rooted strategy, tools, and frameworks for intentional fatherhood, disciplined leadership, and generational legacy.",

    values: [
      "Faith-rooted leadership",
      "Strategic discipline",
      "Generational thinking",
      "Community focus",
      "Excellence in execution",
      "Sustainable impact",
    ],

    principles: [
      "Legacy over noise",
      "Standards before sensations",
      "Execution above excuses",
      "Wisdom before ambition",
    ],
  },

  routes: {
    home: { id: "home", path: "/", label: "Home" },
    about: { id: "about", path: "/about", label: "About" },
    blogIndex: { id: "blogIndex", path: "/blog", label: "Insights" },
    contentIndex: { id: "contentIndex", path: "/content", label: "All Content" },
    booksIndex: { id: "booksIndex", path: "/books", label: "Books" },
    canonIndex: { id: "canonIndex", path: "/canon", label: "The Canon" },
    ventures: { id: "ventures", path: "/ventures", label: "Ventures" },
    downloadsIndex: { id: "downloadsIndex", path: "/downloads", label: "Downloads" },
    strategyLanding: { id: "strategyLanding", path: "/strategy", label: "Strategy" },
    contact: { id: "contact", path: "/contact", label: "Contact" },
  },

  ventures: [
    {
      initials: "AL",
      title: "Alomarada Ltd",
      description:
        "Board-level advisory, operating systems, and market-entry strategy for Africa-focused founders, boards, and institutions.",
      href: ALOMARADA_URL,
      cta: "Visit Alomarada.com",
      themeColor: "#0b2e1f",
    },
    {
      initials: "EL",
      title: "EndureLuxe",
      description:
        "Durable luxury performance gear for people who train, build, and endure — without compromising quality or aesthetics.",
      href: ENDURELUXE_URL,
      cta: "Explore EndureLuxe",
      muted: true,
      themeColor: "#9f7a38",
    },
    {
      initials: "IH",
      title: "InnovateHub",
      description:
        "Tools, cohorts, and hands-on support for builders who want to test ideas, ship value, and stay accountable.",
      href: INNOVATEHUB_URL,
      cta: "Visit InnovateHub",
      themeColor: "#0b2e1f",
    },
  ],

  getPageTitle: (pageTitle?: string) => {
    const base = "Abraham of London";
    if (!pageTitle || typeof pageTitle !== "string") return base;
    return `${pageTitle} | ${base}`;
  },
};

// =======================================================
// EXPORT ALIASES FOR BACKWARD COMPATIBILITY
// =======================================================

export const siteUrl = siteConfig.siteUrl;
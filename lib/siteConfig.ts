// lib/siteConfig.ts
// Browser-safe site configuration + route & venture registry.
// No fs, no Node-only APIs.

export interface SocialLink {
  href: string;
  label?: string;
  external?: boolean;
}

/**
 * Enumerate all "canonical" routes you actually support.
 * Add to this union instead of sprinkling string paths around the codebase.
 */
export type RouteId =
  | "home"
  | "about"
  | "blogIndex"
  | "contentIndex"
  | "booksIndex"
  | "ventures"
  | "downloadsIndex"
  | "strategyLanding"
  | "contact";

/**
 * Route configuration – minimal but explicit.
 */
export interface RouteConfig {
  id: RouteId;
  /** Canonical pathname, ALWAYS starting with "/" */
  path: string;
  /** Optional human label (for nav) */
  label?: string;
}

/**
 * Brand values and principles
 */
export interface BrandConfig {
  values: string[];
  principles?: string[];
}

/**
 * Venture model used across the site (cards, landing pages, etc.).
 * This is what BrandCard expects via `import { Venture } from "@/lib/siteConfig"`.
 */
export interface Venture {
  initials: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  muted?: boolean;
  themeColor?: string;
}

/**
 * Top-level site configuration.
 */
export interface SiteConfig {
  /** Public base URL (no trailing slash) */
  siteUrl: string;
  /** Brand/site title */
  title: string;
  /** Canonical author/owner name */
  author: string;
  /** Public contact email */
  email: string;
  /** Optional public phone (used in header/footer) */
  phone?: string;
  /** Optional social links used across the site */
  socialLinks?: SocialLink[];
  /** Default author avatar used across blog cards, etc. */
  authorImage?: string;
  /** Brand values and principles */
  brand: BrandConfig;
  /** Canonical routes */
  routes: Record<RouteId, RouteConfig>;
  /** Portfolio of ventures under the Abraham of London umbrella */
  ventures: Venture[];
}

/**
 * Normalise a path – always leading slash, no trailing slash (except "/").
 */
function normalisePath(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "/";
  const withLead = s.startsWith("/") ? s : `/${s}`;
  if (withLead === "/") return "/";
  return withLead.replace(/\/+$/u, "");
}

// --------- URL CONSTANTS (BROWSER-SAFE) -------------------------------------

const PUBLIC_SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org").replace(
    /\/+$/u,
    ""
  );

const ALOMARADA_URL =
  process.env.NEXT_PUBLIC_ALOMARADA_URL || "https://alomarada.com";

const ENDURELUXE_URL =
  process.env.NEXT_PUBLIC_ENDURELUXE_URL || "https://endureluxe.com";

const INNOVATEHUB_URL =
  process.env.NEXT_PUBLIC_INNOVATEHUB_URL ||
  process.env.NEXT_PUBLIC_INNOVATEHUB_ALT_URL ||
  "https://innovatehub.abrahamoflondon.org";

// --------- PRIMARY CONFIG OBJECT --------------------------------------------

/**
 * Single source of truth for site identity + routes + ventures.
 */
export const siteConfig: SiteConfig = {
  siteUrl: PUBLIC_SITE_URL,
  title: "Abraham of London",
  author: "Abraham of London",
  email: "hello@abrahamoflondon.org",
  phone: "+44 0000 000000", // optional – adjust or remove
  authorImage: "/assets/images/profile-portrait.webp",

  socialLinks: [
    {
      href: "https://abrahamoflondon.org",
      label: "Abraham of London",
      external: true,
    },
    {
      href:
        process.env.NEXT_PUBLIC_LINKEDIN_URL ||
        "https://www.linkedin.com/in/abrahamoflondon",
      label: "LinkedIn",
      external: true,
    },
    {
      href:
        process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
        "https://www.instagram.com/abrahamoflondon",
      label: "Instagram",
      external: true,
    },
    {
      href:
        process.env.NEXT_PUBLIC_YOUTUBE_URL ||
        "https://www.youtube.com/@abrahamoflondon",
      label: "YouTube",
      external: true,
    },
  ],

  brand: {
    values: [
      "Excellence in every detail",
      "Innovation that matters", 
      "Integrity above all",
      "Collaboration for impact",
      "Continuous learning and growth"
    ],
    principles: [
      "Quality over quantity",
      "User-centric design",
      "Sustainable business practices",
      "Transparent communication"
    ]
  },

  routes: {
    home: {
      id: "home",
      path: "/",
      label: "Home",
    },
    about: {
      id: "about",
      path: "/about",
      label: "About",
    },
    blogIndex: {
      id: "blogIndex",
      path: "/blog",
      label: "Insights",
    },
    contentIndex: {
      id: "contentIndex",
      path: "/content",
      label: "All Content",
    },
    booksIndex: {
      id: "booksIndex",
      path: "/books",
      label: "Books",
    },
    ventures: {
      id: "ventures",
      path: "/ventures",
      label: "Ventures",
    },
    downloadsIndex: {
      id: "downloadsIndex",
      path: "/downloads",
      label: "Downloads",
    },
    strategyLanding: {
      id: "strategyLanding",
      path: "/strategy",
      label: "Strategy",
    },
    contact: {
      id: "contact",
      path: "/contact",
      label: "Contact",
    },
  },

  ventures: [
    {
      initials: "AL",
      title: "Alomarada Ltd",
      description:
        "Board-level advisory, operating systems, and market-entry strategy for Africa-focused founders, boards, and institutions.",
      href: ALOMARADA_URL,
      cta: "Visit Alomarada.com",
      muted: false,
      themeColor: "#0b2e1f",
    },
    {
      initials: "EL",
      title: "EndureLuxe",
      description:
        "Durable luxury performance gear for people who train, build, and endure – without compromising on quality or aesthetics.",
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
      muted: false,
      themeColor: "#0b2e1f",
    },
  ],
};

// --------- HELPERS ----------------------------------------------------------

/** Look up the canonical path for a given route id. */
export function getRoutePath(id: RouteId): string {
  const cfg = siteConfig.routes[id];
  if (!cfg) {
    if (process.env.NODE_ENV !== "production") {
      // Fail loudly in dev so we don't ship broken links.
      // eslint-disable-next-line no-console
      console.warn(`[siteConfig] Unknown route id: ${id as string}`);
    }
    return "/";
  }
  return normalisePath(cfg.path);
}

/** Build an internal href from either a route id or a raw path. */
export function internalHref(target: RouteId | string): string {
  if (typeof target === "string" && target in siteConfig.routes) {
    // Narrow RouteId case when devs accidentally pass "blogIndex" as string
    return getRoutePath(target as RouteId);
  }
  if (typeof target === "string" && target.startsWith("/")) {
    return normalisePath(target);
  }
  if (typeof target === "string") {
    // Non-slash string – treat as path fragment
    return normalisePath(`/${target}`);
  }
  return "/";
}

/** Build an absolute URL safely (for OG tags, emails, sitemaps, etc.). */
export function absUrl(path: string | RouteId): string {
  const href = typeof path === "string" ? internalHref(path) : getRoutePath(path);
  if (/^https?:\/\//iu.test(href)) return href;
  return `${siteConfig.siteUrl}${href === "/" ? "" : href}`;
}

/** Compose a page title consistently. */
export function getPageTitle(pageTitle?: string): string {
  const base = siteConfig.title || "Abraham of London";
  if (!pageTitle || typeof pageTitle !== "string") return base;
  return `${pageTitle} | ${base}`;
}
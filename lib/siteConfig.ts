// lib/siteConfig.ts
// Browser-safe site configuration + route registry.
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
 * Top-level site configuration.
 */
export interface SiteConfig {
  /** Public base URL (no trailing slash) */
  siteUrl: string;
  /** Brand/site title */
  title: string;
  /** Public contact email */
  email: string;
  /** Optional public phone (used in header/footer) */
  phone?: string;
  /** Optional social links used across the site */
  socialLinks?: SocialLink[];
  /** Default author avatar used across blog cards, etc. */
  authorImage?: string;
  /** Canonical routes */
  routes: Record<RouteId, RouteConfig>;
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

/**
 * Single source of truth for site identity + routes.
 */
export const siteConfig: SiteConfig = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org").replace(/\/+$/u, ""),
  title: "Abraham of London",
  email: "hello@abrahamoflondon.org",
  phone: "+44 0000 000000", // optional – adjust or remove
  authorImage: "/assets/images/profile-portrait.webp",

  routes: {
    home:          { id: "home",          path: "/",            label: "Home" },
    about:         { id: "about",         path: "/about",       label: "About" },
    blogIndex:     { id: "blogIndex",     path: "/blog",        label: "Insights" },
    contentIndex:  { id: "contentIndex",  path: "/content",     label: "All Content" },
    booksIndex:    { id: "booksIndex",    path: "/books",       label: "Books" },
    ventures:      { id: "ventures",      path: "/ventures",    label: "Ventures" },
    downloadsIndex:{ id: "downloadsIndex",path: "/downloads",   label: "Downloads" },
    strategyLanding:{id: "strategyLanding",path: "/strategy",   label: "Strategy" },
    contact:       { id: "contact",       path: "/contact",     label: "Contact" },
  },
};

/** Look up the canonical path for a given route id. */
export function getRoutePath(id: RouteId): string {
  const cfg = siteConfig.routes[id];
  if (!cfg) {
    if (process.env.NODE_ENV !== "production") {
      // Fail loudly in dev so we don’t ship broken links.
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
// lib/siteConfig.ts
// Lean, browser-safe site configuration used by Layout & SiteLayout.
// No 'fs', no Node-only APIs.

export interface SocialLink {
  href: string;
  label?: string;
  external?: boolean;
}

export interface SiteConfig {
  /** Public base URL (no trailing slash) */
  siteUrl: string;
  /** Brand/site title */
  title: string;
  /** Public contact email */
  email: string;
  /** Optional social links used across the site */
  socialLinks?: SocialLink[];
  /** Optional default author avatar used across blog cards, etc. */
  authorImage?: string;
}

/**
 * Single source of truth for site identity.
 * Keep this lean to avoid type churn across the app.
 */
export const siteConfig: SiteConfig = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org").replace(/\/+$/, ""),
  title: "Abraham of London",
  email: "hello@abrahamoflondon.org",
  authorImage: "/assets/images/profile-portrait.webp", // ✅ satisfies BlogPostCard
  socialLinks: [
    {
      href: "https://www.linkedin.com/in/abrahamadaramola",
      label: "LinkedIn",
      external: true,
    },
    {
      href: "https://x.com/AbrahamOfLondon",
      label: "X (Twitter)",
      external: true,
    },
    {
      href: "mailto:hello@abrahamoflondon.org",
      label: "Email",
    },
  ],
};

/** Build an absolute URL safely. */
export function absUrl(path: string): string {
  const p = String(path || "").trim();
  if (!p) return siteConfig.siteUrl;
  if (/^https?:\/\//i.test(p)) return p;
  return `${siteConfig.siteUrl}/${p.replace(/^\/+/, "")}`;
}

/** Compose a page title consistently. */
export function getPageTitle(pageTitle?: string): string {
  const base = siteConfig.title || "Abraham of London";
  if (!pageTitle || typeof pageTitle !== "string") return base;
  return `${pageTitle} | ${base}`;
}
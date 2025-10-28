// lib/siteConfig.ts

// --- Type Definitions ---

export type SocialKind = "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "whatsapp" | "mail" | "phone" | "tiktok";

export type SocialLink = {
  href: string;
  label: string;
  icon: string; // Path under /public, e.g., /assets/images/social/twitter.svg
  kind: SocialKind | 'custom'; // Ensure kind is always present for utility
  external: boolean; // Explicitly required and set
};

export type SiteConfig = {
  title: string;
  author: string;
  description: string;
  /** Canonical site origin, e.g. https://www.abrahamoflondon.org */
  siteUrl: string; 
  socialLinks: readonly SocialLink[]; // Use readonly for tuple safety
  gaMeasurementId: string | null;
  email: string;
  ogImage: string; // path under /public
  twitterImage: string; // path under /public
  authorImage: string; // path under /public
};

// --- Private Helpers ---

/** Normalise an origin string (trim + strip trailing slash). */
function cleanOrigin(s: string): string {
  const x = s.trim();
  return x.endsWith("/") ? x.slice(0, -1) : x;
}

/**
 * Checks if a URL is external (http/https, mailto, tel, or protocol-relative).
 */
export const isExternal = (href: string): boolean => 
    /^(?:[a-z]+:|\/\/)/i.test(href);


/**
 * Always prefer NEXT_PUBLIC_SITE_URL; fall back to your real domain.
 */
const SITE_ORIGIN = cleanOrigin(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
);

// --- Site Configuration Object ---

export const siteConfig = {
  title: "Abraham of London",
  author: "Abraham of London",
  // FIX: Corrected the broken ellipsis escape sequence
  description: "Official site of Abraham of London — author, strategist, and fatherhood advocate.",
  siteUrl: SITE_ORIGIN,

  socialLinks: [
    { href: "mailto:info@abrahamoflondon.org", label: "Email", kind: "mail", icon: "/assets/images/social/email.svg", external: true },
    { href: "tel:+442086225909", label: "Phone", kind: "phone", icon: "/assets/images/social/phone.svg", external: true },
    { href: "https://x.com/AbrahamAda48634", label: "X", kind: "x", icon: "/assets/images/social/twitter.svg", external: true },
    { href: "https://www.instagram.com/abraham_of_london_/", label: "Instagram", kind: "instagram", icon: "/assets/images/social/instagram.svg", external: true },
    { href: "https://www.facebook.com/share/16tvsnTgRG/", label: "Facebook", kind: "facebook", icon: "/assets/images/social/facebook.svg", external: true },
    { href: "https://www.linkedin.com/in/abraham-adaramola-06630321/", label: "LinkedIn", kind: "linkedin", icon: "/assets/images/social/linkedin.svg", external: true },
    { href: "https://www.youtube.com/@abrahamoflondon", label: "YouTube", kind: "youtube", icon: "/assets/images/social/youtube.svg", external: true },
    { href: "https://wa.me/447496334022", label: "WhatsApp", kind: "whatsapp", icon: "/assets/images/social/whatsapp.svg", external: true },
    { href: "https://www.tiktok.com/@abrahamoflondon", label: "TikTok", kind: "tiktok", icon: "/assets/images/social/tiktok.svg", external: true },
  ] as const as ReadonlyArray<SocialLink>, // Explicitly cast for array safety

  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
  email: "info@abrahamoflondon.org",

  // Paths under /public
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.jpg",
  authorImage: "/assets/images/profile-portrait.webp",
} as const; // Apply 'as const' to the entire config object for deep immutability

// Ensure the exported type is used for external reference
export type ReadonlySiteConfig = typeof siteConfig;

// --- URL Utilities ---

/**
 * Normalise a local asset path to start with a single leading slash.
 * @param p The path string.
 * @returns The cleaned local path string, or undefined if the input was null/undefined or an external URL.
 */
export const ensureLocal = (p: string | null | undefined): string | undefined => {
  if (!p || isExternal(p)) return undefined;
  // Ensure it starts with exactly one slash
  return p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`;
};

/**
 * Safe absolute URL join.
 * Returns the path as-is if it's already absolute (http/https/mailto/tel).
 * Otherwise, prepends siteConfig.siteUrl, ensuring a single slash separator.
 */
export const absUrl = (path: string): string => {
  if (isExternal(path)) return path;

  // Use ensureLocal to clean the path and guarantee a starting slash
  const cleanLocalPath = ensureLocal(path);
  
  // If cleanLocalPath is undefined, return the original path as a fallback (though it shouldn't happen for valid inputs)
  if (!cleanLocalPath) return path;

  return `${siteConfig.siteUrl}${cleanLocalPath}`;
};

/** Absolute URL for a local `/public` asset path. */
export const absAsset = (localPath: string): string => {
  // Leverage absUrl, which handles the local path cleanup internally
  return absUrl(localPath);
};
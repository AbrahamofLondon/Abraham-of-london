// lib/siteConfig.ts
export type SocialLink = {
  href: string;
  label: string;
  icon: string; // Made required
  kind?:
    | "x"
    | "instagram"
    | "facebook"
    | "linkedin"
    | "youtube"
    | "whatsapp"
    | "mail"
    | "phone"
    | "tiktok";
  external?: boolean;
};

export type SiteConfig = {
  title: string;
  author: string;
  description: string;
  /** Canonical site origin, e.g. https://www.abrahamoflondon.org */
  siteUrl: string;
  socialLinks: SocialLink[];
  gaMeasurementId?: string | null;
  email: string;
  ogImage: string; // path under /public
  twitterImage: string; // path under /public
  authorImage: string; // path under /public
};

/** Normalise an origin string (trim + strip trailing slash). */
function cleanOrigin(s: string) {
  const x = s.trim();
  return x.endsWith("/") ? x.slice(0, -1) : x;
}

/**
 * Always prefer NEXT_PUBLIC_SITE_URL; fall back to your real domain.
 * (Avoid preview URLs for canonicals/JSON-LD.)
 */
const SITE_ORIGIN = cleanOrigin(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
);

export const siteConfig: SiteConfig = {
  title: "Abraham of London",
  author: "Abraham of London",
  description:
    "Official site of Abraham of London Ãƒ¢Ã¢â€š¬Ã¢â‚¬ author, strategist, and fatherhood advocate.",
  siteUrl: SITE_ORIGIN,

  socialLinks: [
    {
      href: "mailto:info@abrahamoflondon.org",
      label: "Email",
      kind: "mail",
      icon: "/assets/images/social/email.svg",
    },
    {
      href: "tel:+442086225909",
      label: "Phone",
      kind: "phone",
      icon: "/assets/images/social/phone.svg",
    },
    {
      href: "https://x.com/AbrahamAda48634",
      label: "X",
      kind: "x",
      icon: "/assets/images/social/twitter.svg",
      external: true,
    },
    {
      href: "https://www.instagram.com/abraham_of_london_/",
      label: "Instagram",
      kind: "instagram",
      icon: "/assets/images/social/instagram.svg",
      external: true,
    },
    {
      href: "https://www.facebook.com/share/16tvsnTgRG/",
      label: "Facebook",
      kind: "facebook",
      icon: "/assets/images/social/facebook.svg",
      external: true,
    },
    {
      href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
      label: "LinkedIn",
      kind: "linkedin",
      icon: "/assets/images/social/linkedin.svg",
      external: true,
    },
    {
      href: "https://www.youtube.com/@abrahamoflondon",
      label: "YouTube",
      kind: "youtube",
      icon: "/assets/images/social/youtube.svg",
      external: true,
    },
    {
      href: "https://wa.me/447496334022",
      label: "WhatsApp",
      kind: "whatsapp",
      icon: "/assets/images/social/whatsapp.svg",
      external: true,
    },
    {
      href: "https://www.tiktok.com/@abrahamoflondon",
      label: "TikTok",
      kind: "tiktok",
      icon: "/assets/images/social/tiktok.svg",
      external: true,
    },
  ],

  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
  email: "info@abrahamoflondon.org",

  // Use JPG/PNG for best social scraper compatibility.
  ogImage: "/assets/images/social/og-image.jpg",
  twitterImage: "/assets/images/social/twitter-image.jpg",
  authorImage: "/assets/images/profile-portrait.webp",
};

/** Simple external check for links/components. */
export const isExternal = (href: string) =>
  /^https?:\/\//i.test(href) ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:");

/** Normalise a local asset to a leading-slash path (or undefined if remote). */
export const ensureLocal = (p?: string | null) =>
  p && !isExternal(p)
    ? p.startsWith("/")
      ? p
      : `/${p.replace(/^\/+/, "")}`
    : undefined;

/**
 * Safe absolute URL join.
 * Returns the path as-is if it's already absolute (http/https).
 * Otherwise, prepends siteConfig.siteUrl, ensuring a single slash separator.
 */
export const absUrl = (path: string) => {
  if (isExternal(path)) return path;

  // Ensure the path starts with a slash for clean joining
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${siteConfig.siteUrl}${cleanPath}`;
};

/** Absolute URL for a local `/public` asset path. */
export const absAsset = (localPath: string) => {
  // Use ensureLocal to guarantee a clean starting slash for local paths
  const cleanLocalPath = ensureLocal(localPath);

  if (!cleanLocalPath) return localPath; // Should only happen if input was remote/null

  return absUrl(cleanLocalPath);
};

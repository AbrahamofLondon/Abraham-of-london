// lib/siteConfig.ts
export type SocialLink = {
  href: string;
  label: string;
  icon: string; // Made required
  kind?: "x" | "instagram" | "facebook" | "linkedin" | "youtube" | "whatsapp" | "mail" | "phone" | "tiktok";
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
  ogImage: string;      // path under /public
  twitterImage: string; // path under /public
  authorImage: string;  // path under /public
};

/** Normalise an origin string (trim + strip trailing slash). */
function cleanOrigin(s: string) {
  const x = s.trim();
  return x.endsWith("/") ? x.slice(0, -1) : x;
}
